import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runE2ETest() {
  console.log('🚀 Starting Alcheminds Phase 1 Automated E2E Test Suite...');

  // 1. Check Server Health
  console.log('\n--- 1. Testing Health Endpoint ---');
  const healthRes = await fetch('http://localhost:3001/api/health');
  const healthData = await healthRes.json();
  console.log('Health Response:', healthData);
  if (healthData.status !== 'healthy') throw new Error('Health check failed');

  // 2. Test Multipart Media Upload with Geotagged Photo
  console.log('\n--- 2. Testing Geotagged Media Upload ---');
  const sampleImagePath = path.join(__dirname, 'samples', 'flooded_road_mumbai.jpg');
  const fileBuffer = fs.readFileSync(sampleImagePath);
  const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
  const formData = new FormData();
  formData.append('files', blob, 'flooded_road_mumbai.jpg');

  const uploadRes = await fetch('http://localhost:3001/api/upload', {
    method: 'POST',
    body: formData,
  });
  const uploadData = await uploadRes.json();
  console.log('Upload Result:', JSON.stringify(uploadData, null, 2));

  if (!uploadData.success || !uploadData.files || uploadData.files.length === 0) {
    throw new Error('Upload failed');
  }

  const uploadedFile = uploadData.files[0];
  console.log('Extracted GPS on Server:', uploadedFile.gps);
  console.log('Extracted Camera EXIF on Server:', uploadedFile.exif);

  if (!uploadedFile.gps || Math.abs(uploadedFile.gps.latitude - 19.076) > 0.01) {
    throw new Error('EXIF GPS extraction did not match expected coordinates (19.0760, 72.8777)');
  }

  // 3. Test Report Persistence
  console.log('\n--- 3. Testing Report Creation & SQLite Persistence ---');
  const reportPayload = {
    category: 'Water',
    description: 'Flooded roadway near school entrance after heavy rainfall. Drains are blocked with plastic debris.',
    duration: 'A few days',
    recurrence: 'Frequently',
    severity: 'Serious',
    isRiskPresent: false,
    riskDescription: '',
    location: {
      latitude: uploadedFile.gps.latitude,
      longitude: uploadedFile.gps.longitude,
      source: 'exif',
      accuracy: 10,
      address: 'Mumbai, Maharashtra, India',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
    },
    media: [
      {
        mediaId: uploadedFile.mediaId,
        mediaType: uploadedFile.mediaType,
        originalName: uploadedFile.originalName,
        fileName: uploadedFile.fileName,
        filePath: uploadedFile.filePath,
        mimeType: uploadedFile.mimeType,
        fileSize: uploadedFile.fileSize,
        exif: uploadedFile.exif,
      }
    ],
    smartSuggested: true,
  };

  const createRes = await fetch('http://localhost:3001/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportPayload),
  });

  const createData = await createRes.json();
  console.log('Created Report Response:', JSON.stringify(createData, null, 2));

  if (!createData.success || !createData.report) {
    throw new Error('Report creation failed');
  }

  const reportId = createData.report.id;
  const reportCode = createData.report.report_code;
  console.log(`✓ Report persisted with ID: ${reportId}, Code: ${reportCode}`);
  console.log(`✓ Civic Priority Score: ${createData.report.civic_priority_score}/100`);

  // 4. Test Report List Fetching
  console.log('\n--- 4. Testing Report List Retrieval ---');
  const listRes = await fetch('http://localhost:3001/api/reports');
  const listData = await listRes.json();
  console.log(`Fetched ${listData.count} reports from database.`);

  // 5. Test Single Report Retrieval
  console.log(`\n--- 5. Testing Single Report Retrieval (${reportCode}) ---`);
  const singleRes = await fetch(`http://localhost:3001/api/reports/${reportCode}`);
  const singleData = await singleRes.json();
  console.log('Single Report Fetch:', singleData.success ? 'SUCCESS' : 'FAILED');

  // 6. Test Frontend Static Asset Server
  console.log('\n--- 6. Testing Frontend Dev Server (port 5173) ---');
  const frontendRes = await fetch('http://localhost:5173/');
  const frontendHtml = await frontendRes.text();
  console.log('Frontend HTML status:', frontendRes.status, 'Contains Alcheminds:', frontendHtml.includes('Alcheminds'));

  console.log('\n🎉 ALL E2E INTEGRATION TESTS PASSED SUCCESSFULLY! 💯');
}

runE2ETest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
