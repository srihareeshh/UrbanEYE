import exifr from 'exifr';
import type { ExifData } from '../types';

/**
 * Extracts EXIF metadata and GPS coordinates from a File object
 */
export async function extractExifFromImage(file: File): Promise<ExifData | null> {
  try {
    const raw = await exifr.parse(file, {
      gps: true,
      tiff: true,
      exif: true,
      iptc: true,
      xmp: true,
    });

    if (!raw) return null;

    const data: ExifData = {
      make: raw.Make || null,
      model: raw.Model || null,
      dateTimeOriginal: raw.DateTimeOriginal ? new Date(raw.DateTimeOriginal).toISOString() : null,
      orientation: raw.Orientation || null,
      software: raw.Software || null,
      exposureTime: raw.ExposureTime || null,
      fNumber: raw.FNumber || null,
      iso: raw.ISO || null,
    };

    if (raw.latitude !== undefined && raw.longitude !== undefined) {
      data.latitude = Number(raw.latitude);
      data.longitude = Number(raw.longitude);
      data.altitude = raw.GPSAltitude ? Number(raw.GPSAltitude) : null;
    }

    return data;
  } catch (err) {
    console.warn('Could not extract EXIF from image:', err);
    return null;
  }
}

/**
 * Reverse geocode latitude and longitude to human readable address using OpenStreetMap Nominatim with fallback
 */
export async function reverseGeocode(lat: number, lon: number): Promise<{ address: string; city: string; state: string; postalCode: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`, {
      headers: { 'Accept-Language': 'en' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const street = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || '';
      const city = addr.city || addr.town || addr.village || addr.county || 'Local Area';
      const state = addr.state || '';
      const postalCode = addr.postcode || '';

      const fullAddress = data.display_name || `${street}, ${city}, ${state}`.replace(/^,\s*/, '');
      return {
        address: fullAddress,
        city,
        state,
        postalCode
      };
    }
  } catch (err) {
    console.warn('Reverse geocoding network notice:', err);
  }

  // Graceful fallback coordinate display
  return {
    address: `Coordinate Pin (${lat.toFixed(5)}, ${lon.toFixed(5)})`,
    city: 'Location Area',
    state: '',
    postalCode: ''
  };
}

/**
 * Format bytes to human readable format (KB, MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
