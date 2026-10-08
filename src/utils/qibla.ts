/**
 * Qibla calculation utilities
 * Kaaba coordinates in Mecca: 21.422487° N, 39.826206° E
 */

export const KAABA_LAT = 21.422487;
export const KAABA_LNG = 39.826206;

/**
 * Normalizes any angle to [0, 360) degrees
 */
export function normalizeAngle(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/**
 * Calculates initial great-circle Qibla bearing in degrees clockwise from True North (0-360)
 * Uses standard spherical trigonometry for great-circle navigation
 */
export function calculateQiblaDirection(latitude: number, longitude: number): number {
  const phi1 = (latitude * Math.PI) / 180;
  const phi2 = (KAABA_LAT * Math.PI) / 180;
  const deltaLambda = ((KAABA_LNG - longitude) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const qibla = (Math.atan2(y, x) * 180) / Math.PI;
  return normalizeAngle(qibla);
}

/**
 * Calculates distance from user location to Kaaba in kilometers using Haversine formula
 */
export function calculateDistanceToKaaba(latitude: number, longitude: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((KAABA_LAT - latitude) * Math.PI) / 180;
  const dLon = ((KAABA_LNG - longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((latitude * Math.PI) / 180) *
      Math.cos((KAABA_LAT * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance / 10) * 10; // Round to nearest 10 km
}

/**
 * Returns 8-point cardinal or 16-point intercardinal direction string for a given angle
 */
export function getCardinalDirection(angle: number, precision: 8 | 16 = 8): string {
  const normalized = normalizeAngle(angle);
  if (precision === 8) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(normalized / 45) % 8;
    return directions[index];
  }
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW',
  ];
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}
