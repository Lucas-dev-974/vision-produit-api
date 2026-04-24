/**
 * Applique un offset aléatoire de radius mètres à un point GPS.
 * Utilisé pour générer publicLocation à partir de location précis.
 */
export function blurCoordinates(
  lat: number,
  lng: number,
  radiusMeters = 500,
): { lat: number; lng: number } {
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusMeters;
  const deltaLat = (distance * Math.cos(angle)) / 111320;
  const deltaLng =
    (distance * Math.sin(angle)) / (111320 * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + deltaLat, lng: lng + deltaLng };
}
