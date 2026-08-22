import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const samplesDir = path.join(__dirname, 'samples');

if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir, { recursive: true });
}

// Function to construct a valid minimal JPEG with full APP1 EXIF GPS metadata
function createExifJpeg(lat, lon, make = 'Citizen Cam', model = 'Civic Alpha 1') {
  // Convert lat/lon to deg, min, sec rationals
  const latRef = lat >= 0 ? 'N' : 'S';
  const lonRef = lon >= 0 ? 'E' : 'W';
  const absLat = Math.abs(lat);
  const absLon = Math.abs(lon);

  const latDeg = Math.floor(absLat);
  const latMin = Math.floor((absLat - latDeg) * 60);
  const latSec = Math.round(((absLat - latDeg) * 60 - latMin) * 60 * 100);

  const lonDeg = Math.floor(absLon);
  const lonMin = Math.floor((absLon - lonDeg) * 60);
  const lonSec = Math.round(((absLon - lonDeg) * 60 - lonMin) * 60 * 100);

  // Minimal standard 1x1 JPEG bytes with custom EXIF block
  // SOI (FF D8)
  // APP1 Marker (FF E1) + Length (2 bytes) + 'Exif\0\0' + TIFF header (II 2A 00 08 00 00 00)
  
  // Let's create an APP1 EXIF buffer
  const tiff = Buffer.alloc(300);
  let pos = 0;

  // Byte order: Little Endian ('II')
  tiff.write('II', pos); pos += 2;
  tiff.writeUInt16LE(42, pos); pos += 2;
  tiff.writeUInt32LE(8, pos); pos += 4; // Offset to 0th IFD

  // 0th IFD: 4 entries (Make, Model, DateTime, GPS IFD Offset)
  tiff.writeUInt16LE(4, pos); pos += 2;

  // Make tag (0x010F), ASCII (2), len 16, offset 150
  tiff.writeUInt16LE(0x010F, pos); pos += 2;
  tiff.writeUInt16LE(2, pos); pos += 2;
  tiff.writeUInt32LE(16, pos); pos += 4;
  tiff.writeUInt32LE(150, pos); pos += 4;

  // Model tag (0x0110), ASCII (2), len 16, offset 170
  tiff.writeUInt16LE(0x0110, pos); pos += 2;
  tiff.writeUInt16LE(2, pos); pos += 2;
  tiff.writeUInt32LE(16, pos); pos += 4;
  tiff.writeUInt32LE(170, pos); pos += 4;

  // DateTime tag (0x0132), ASCII (2), len 20, offset 190
  tiff.writeUInt16LE(0x0132, pos); pos += 2;
  tiff.writeUInt16LE(2, pos); pos += 2;
  tiff.writeUInt32LE(20, pos); pos += 4;
  tiff.writeUInt32LE(190, pos); pos += 4;

  // GPS IFD Pointer tag (0x8825), LONG (4), count 1, offset
  const gpsIfdOffset = 60;
  tiff.writeUInt16LE(0x8825, pos); pos += 2;
  tiff.writeUInt16LE(4, pos); pos += 2;
  tiff.writeUInt32LE(1, pos); pos += 4;
  tiff.writeUInt32LE(gpsIfdOffset, pos); pos += 4;

  // Next IFD offset = 0
  tiff.writeUInt32LE(0, pos); pos += 4;

  // GPS IFD at offset 60
  pos = gpsIfdOffset;
  // 5 GPS tags: GPSLatitudeRef, GPSLatitude, GPSLongitudeRef, GPSLongitude, GPSAltitude
  tiff.writeUInt16LE(5, pos); pos += 2;

  // GPSLatitudeRef (0x0001), ASCII (2), len 2, value 'N\0'
  tiff.writeUInt16LE(0x0001, pos); pos += 2;
  tiff.writeUInt16LE(2, pos); pos += 2;
  tiff.writeUInt32LE(2, pos); pos += 4;
  tiff.write(latRef + '\0', pos); pos += 4;

  // GPSLatitude (0x0002), RATIONAL (5), count 3, offset 220
  tiff.writeUInt16LE(0x0002, pos); pos += 2;
  tiff.writeUInt16LE(5, pos); pos += 2;
  tiff.writeUInt32LE(3, pos); pos += 4;
  tiff.writeUInt32LE(220, pos); pos += 4;

  // GPSLongitudeRef (0x0003), ASCII (2), len 2, value 'E\0'
  tiff.writeUInt16LE(0x0003, pos); pos += 2;
  tiff.writeUInt16LE(2, pos); pos += 2;
  tiff.writeUInt32LE(2, pos); pos += 4;
  tiff.write(lonRef + '\0', pos); pos += 4;

  // GPSLongitude (0x0004), RATIONAL (5), count 3, offset 250
  tiff.writeUInt16LE(0x0004, pos); pos += 2;
  tiff.writeUInt16LE(5, pos); pos += 2;
  tiff.writeUInt32LE(3, pos); pos += 4;
  tiff.writeUInt32LE(250, pos); pos += 4;

  // GPSAltitude (0x0006), RATIONAL (5), count 1, offset 280
  tiff.writeUInt16LE(0x0006, pos); pos += 2;
  tiff.writeUInt16LE(5, pos); pos += 2;
  tiff.writeUInt32LE(1, pos); pos += 4;
  tiff.writeUInt32LE(280, pos); pos += 4;

  // Next IFD = 0
  tiff.writeUInt32LE(0, pos);

  // Write Values:
  // Offset 150: Make
  tiff.write(make.padEnd(16, '\0'), 150);
  // Offset 170: Model
  tiff.write(model.padEnd(16, '\0'), 170);
  // Offset 190: DateTime
  tiff.write('2026:08:22 14:30:00\0', 190);

  // Offset 220: Lat rationals (deg/1, min/1, sec/100)
  tiff.writeUInt32LE(latDeg, 220); tiff.writeUInt32LE(1, 224);
  tiff.writeUInt32LE(latMin, 228); tiff.writeUInt32LE(1, 232);
  tiff.writeUInt32LE(latSec, 236); tiff.writeUInt32LE(100, 240);

  // Offset 250: Lon rationals (deg/1, min/1, sec/100)
  tiff.writeUInt32LE(lonDeg, 250); tiff.writeUInt32LE(1, 254);
  tiff.writeUInt32LE(lonMin, 258); tiff.writeUInt32LE(1, 262);
  tiff.writeUInt32LE(lonSec, 266); tiff.writeUInt32LE(100, 270);

  // Offset 280: Altitude (14/1 meters)
  tiff.writeUInt32LE(14, 280); tiff.writeUInt32LE(1, 284);

  // Construct full JPEG with APP1 and a simple 64x64 valid image stream
  const app1Header = Buffer.from([0xFF, 0xE1, 0x00, 0x00, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00]); // FF E1 len Exif\0\0
  const app1Len = tiff.length + 8;
  app1Header.writeUInt16BE(app1Len, 2);

  // Raw minimal 2x2 JPEG image bytes
  const minimalJpeg = Buffer.from([
    0xFF, 0xD8, // SOI
    ...app1Header,
    ...tiff,
    // DQT (Quantization table)
    0xFF, 0xDB, 0x00, 0x43, 0x00,
    0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14,
    0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12, 0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A,
    0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C,
    0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32,
    // SOF0 (Start of frame 2x2)
    0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x02, 0x00, 0x02, 0x01, 0x01, 0x11, 0x00,
    // DHT (Huffman table)
    0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B,
    // SOS (Start of scan)
    0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
    // Scan data
    0x7F, 0xFF, 0xD9 // Data + EOI
  ]);

  return minimalJpeg;
}

// Generate 3 sample geotagged images:
// 1. Flooded Roadway (Mumbai - 19.0760, 72.8777)
fs.writeFileSync(path.join(samplesDir, 'flooded_road_mumbai.jpg'), createExifJpeg(19.0760, 72.8777, 'Citizen Cam Pro', 'UrbanEye-4K'));

// 2. Broken Streetlight (London - 51.5074, -0.1278)
fs.writeFileSync(path.join(samplesDir, 'broken_infrastructure_london.jpg'), createExifJpeg(51.5074, -0.1278, 'Sony Alpha', 'Civic-Lens 7'));

// 3. Overflowing Drainage (San Francisco - 37.7749, -122.4194)
fs.writeFileSync(path.join(samplesDir, 'overflowing_drain_sf.jpg'), createExifJpeg(37.7749, -122.4194, 'Apple iPhone', 'iPhone 15 Pro'));

console.log('Sample Geotagged EXIF images created successfully in server/samples!');
