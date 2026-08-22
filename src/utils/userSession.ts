// User Session & Identity Management Utility
// Manages a persistent anonymous/citizen user identity in localStorage

const USER_ID_KEY = 'alcheminds_citizen_user_id';
const USER_LOCATION_KEY = 'alcheminds_saved_location';

export interface SavedUserLocation {
  name: string;
  latitude: number;
  longitude: number;
}

export const PRESET_COMMUNITY_AREAS: SavedUserLocation[] = [
  { name: 'Ward 14 West (Main Junction)', latitude: 19.0760, longitude: 72.8777 },
  { name: 'Dadar Central Market Zone', latitude: 19.0178, longitude: 72.8478 },
  { name: 'Bandra Hill Road & Schools', latitude: 19.0558, longitude: 72.8315 },
  { name: 'Andheri Subway Basin', latitude: 19.1197, longitude: 72.8464 },
  { name: 'Kurla West Railway Approach', latitude: 19.0680, longitude: 72.8820 },
];

/**
 * Returns or initializes a persistent unique user ID for this browser session.
 */
export function getCitizenUserId(): string {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    // Generate a clean citizen ID
    const randomHex = Math.random().toString(36).substring(2, 9);
    userId = `usr_citizen_${randomHex}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

/**
 * Returns the citizen's preferred location (device or selected preset).
 */
export function getCitizenLocation(): SavedUserLocation {
  const saved = localStorage.getItem(USER_LOCATION_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return PRESET_COMMUNITY_AREAS[0];
}

/**
 * Sets citizen's preferred location.
 */
export function setCitizenLocation(location: SavedUserLocation): void {
  localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(location));
}

/**
 * Wrapper for API calls including user ID header.
 */
export async function apiFetch(url: string, options: RequestInit = {}) {
  const userId = getCitizenUserId();
  const headers = new Headers(options.headers || {});
  headers.set('x-user-id', userId);

  return fetch(url, {
    ...options,
    headers,
  });
}
