export const KAABAH_LATITUDE = 21.422487;
export const KAABAH_LONGITUDE = 39.826206;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

/**
 * Calculates the bearing (angle) from a given coordinate to another coordinate using the Great Circle formula.
 * The result is measured in degrees, from 0 to 360, where 0/360 is North, 90 is East, etc.
 */
export const getBearing = (
    startLat: number,
    startLng: number,
    destLat: number,
    destLng: number
): number => {
    const startLatRad = toRadians(startLat);
    const startLngRad = toRadians(startLng);
    const destLatRad = toRadians(destLat);
    const destLngRad = toRadians(destLng);

    const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
    const x =
        Math.cos(startLatRad) * Math.sin(destLatRad) -
        Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

    let bearing = Math.atan2(y, x);
    bearing = toDegrees(bearing);
    return (bearing + 360) % 360;
};

/**
 * Calculates the Qibla bearing from a given location to the Kaabah.
 */
export const getQiblaBearing = (lat: number, lng: number): number => {
    return getBearing(lat, lng, KAABAH_LATITUDE, KAABAH_LONGITUDE);
};
