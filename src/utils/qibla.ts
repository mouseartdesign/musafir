/**
 * Qibla calculation utilities
 * Kaaba coordinates: 21.422487° N, 39.826206° E
 */

export const KAABA_LAT = 21.422487;
export const KAABA_LNG = 39.826206;

/**
 * Calculates Qibla direction in degrees clockwise from True North (0-360)
 */
export function calculateQiblaDirection(latitude: number, longitude: number): number {
  const phi1 = (latitude * Math.PI) / 180;
  const phi2 = (KAABA_LAT * Math.PI) / 180;
  const deltaLambda = ((KAABA_LNG - longitude) * Math.PI) / 180;

  const y = Math.sin(deltaLambda);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);

  let qibla = (Math.atan2(y, x) * 180) / Math.PI;
  qibla = (qibla + 360) % 360;

  return Math.round(qibla);
}

/**
 * Calculates distance from user location to Kaaba in kilometers using Haversine formula
 */
export function calculateDistanceToKaaba(latitude: number, longitude: number): number {
  const R = 6371; // Earth's radius in km
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
