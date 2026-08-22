import exifr from 'exifr';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function test() {
  const samplePath = path.join(__dirname, 'samples', 'flooded_road_mumbai.jpg');
  const data = await exifr.parse(samplePath, { gps: true, tiff: true });
  console.log('Parsed EXIF result:', JSON.stringify(data, null, 2));
}

test();
