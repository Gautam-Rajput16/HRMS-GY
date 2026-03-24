/**
 * Geo-Fencing Utility
 * Uses the Haversine formula to calculate distance between two GPS coordinates
 * and validates whether an employee is within the allowed office radius.
 */

/**
 * Calculate distance between two GPS points using the Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const toRad = (deg) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // distance in meters
};

/**
 * Check if a given GPS coordinate is within the allowed office radius
 * @param {number} latitude - Employee's latitude
 * @param {number} longitude - Employee's longitude
 * @returns {{ isWithinRadius: boolean, distance: number, maxRadius: number }}
 */
const isWithinOfficeRadius = (latitude, longitude) => {
    const officeLat = parseFloat(process.env.OFFICE_LATITUDE);
    const officeLon = parseFloat(process.env.OFFICE_LONGITUDE);
    // Parse directly from env, default to 100 only if completely undefined to avoid crashing
    const maxRadius = parseFloat(process.env.OFFICE_RADIUS_METERS);

    // Debug: log all values
    console.log('=== GEO-FENCE CHECK ===' );
    console.log('Employee Location:', { latitude, longitude });
    console.log('Office Location:', { officeLat, officeLon });
    console.log('Max Radius:', maxRadius, 'meters');

    // Check if office coordinates are properly configured
    if (isNaN(officeLat) || isNaN(officeLon)) {
        console.log('⚠️ Office coordinates NOT configured in .env — ALLOWING access');
        return {
            isWithinRadius: true,
            distance: 0,
            maxRadius,
        };
    }

    const distance = calculateDistance(latitude, longitude, officeLat, officeLon);
    const isWithin = distance <= maxRadius;

    console.log('Calculated Distance:', Math.round(distance), 'meters');
    console.log('Result:', isWithin ? '✅ WITHIN RADIUS' : '❌ OUTSIDE RADIUS');
    console.log('========================');

    return {
        isWithinRadius: isWithin,
        distance: Math.round(distance),
        maxRadius,
    };
};

module.exports = {
    calculateDistance,
    isWithinOfficeRadius,
};
