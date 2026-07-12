const EARTH_RADIUS_MILES = 3958.7613;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export function haversineMiles(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    2 * EARTH_RADIUS_MILES * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
  );
}

export function verifyRadius(
  customer: { latitude: number; longitude: number },
  store: { latitude: number; longitude: number },
  radiusMiles: number,
) {
  const distanceMiles = haversineMiles(customer, store);
  return {
    verified: distanceMiles <= radiusMiles,
    distanceMiles: Math.round(distanceMiles * 100) / 100,
  };
}
