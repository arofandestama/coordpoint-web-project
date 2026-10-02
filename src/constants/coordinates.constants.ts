/**
 * @module coordinates.constants
 * @description Global numeric bounds and rounding factors for DMS ⇄ DD conversion.
 */

/**
 * Maximum absolute number of degrees a latitude may have (North or South).
 * Latitude therefore spans the closed interval [-90, 90] in decimal degrees.
 */
export const LATITUDE_MAX_DEGREES = 90;

/**
 * Maximum absolute number of degrees a longitude may have (East or West).
 * Longitude therefore spans the closed interval [-180, 180] in decimal degrees.
 */
export const LONGITUDE_MAX_DEGREES = 180;

/**
 * Inclusive upper bound for the minutes component of a DMS coordinate.
 */
export const MINUTES_MAX = 59;

/**
 * Exclusive upper bound for the seconds component of a DMS coordinate.
 * Seconds are valid in the interval [0, 60), i.e. up to 59.999... seconds.
 */
export const SECONDS_UPPER_BOUND = 60;

/**
 * Factor used to round decimal-degree results to six fractional digits
 * (about 0.1 m of precision on the Earth's surface).
 */
export const DD_ROUNDING_FACTOR = 1_000_000;

/**
 * Factor used to round the DMS seconds component to two fractional digits.
 */
export const SECONDS_ROUNDING_FACTOR = 100;
