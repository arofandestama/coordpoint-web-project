/**
 * @module dms-to-dd
 * @description Provides mathematical conversion from Degrees-Minutes-Seconds (DMS) notation to Decimal Degrees (DD).
 */
import type { Axis, CardinalDirection, DmsCoordinate } from './types'
import { assertValidDd, assertValidDms } from './validate'

/**
 * Factor used to round decimal-degree results to six fractional digits
 * (about 0.1 m of precision on the Earth's surface).
 */
const DD_ROUNDING_FACTOR = 1_000_000

/**
 * Converts a coordinate from Degrees-Minutes-Seconds (DMS) notation to
 * Decimal Degrees (DD).
 *
 * The conversion is `dd = degrees + minutes / 60 + seconds / 3600`. Southern
 * latitudes (`S`) and western longitudes (`W`) are returned as negative
 * values. The result is rounded to six decimal places.
 *
 * @param dms - The DMS coordinate to convert. Must be valid for `axis`.
 * @param axis - Geographic axis the coordinate belongs to; determines the
 *   allowed degree range and the valid cardinal directions.
 * @returns The coordinate in decimal degrees, rounded to 6 decimal places.
 * @throws {CoordinateValidationError} When `dms` is not a valid DMS
 *   coordinate for `axis` (see `assertValidDms` for the rules).
 *
 * @example
 * dmsToDd({ degrees: 49, minutes: 30, seconds: 10, direction: 'N' }, 'latitude')
 * // => 49.502778
 *
 * @example
 * dmsToDd({ degrees: 123, minutes: 30, seconds: 20, direction: 'W' }, 'longitude')
 * // => -123.505556
 */
export function dmsToDd(dms: DmsCoordinate, axis: Axis): number {
  assertValidDms(dms, axis)

  const unsignedDd = dms.degrees + dms.minutes / 60 + dms.seconds / 3600
  const isNegative = dms.direction === 'S' || dms.direction === 'W'
  const signedDd = isNegative ? -unsignedDd : unsignedDd

  return Math.round(signedDd * DD_ROUNDING_FACTOR) / DD_ROUNDING_FACTOR
}

/**
 * Formats a decimal degrees (DD) value as a human-readable string, e.g.
 * `49.50278° N` or `123.50556° W`.
 *
 * The hemisphere letter is derived from the sign of the value: non-negative
 * values (including `-0`) map to `N` for latitude and `E` for longitude,
 * while negative values map to `S` and `W` respectively.
 *
 * @param dd - The decimal degrees value to format. Must be valid for `axis`.
 * @param axis - Geographic axis the value belongs to; determines the letter
 *   pair used (`N`/`S` or `E`/`W`).
 * @param precision - Number of digits after the decimal point. Defaults to 5.
 * @returns The formatted string `"<absValue>° <letter>"` where `<absValue>`
 *   is the absolute value rendered with `toFixed(precision)`.
 * @throws {CoordinateValidationError} With field `'dd'` when `dd` is out of
 *   range for `axis`, `NaN`, or infinite.
 *
 * @example
 * formatDd(49.5027777777, 'latitude') // => '49.50278° N'
 * formatDd(-6.2, 'latitude') // => '6.20000° S'
 * formatDd(49.5, 'latitude', 2) // => '49.50° N'
 */
export function formatDd(dd: number, axis: Axis, precision: number = 5): string {
  assertValidDd(dd, axis)

  const isPositive = dd >= 0
  const direction: CardinalDirection = axis === 'latitude' ? (isPositive ? 'N' : 'S') : isPositive ? 'E' : 'W'

  return `${Math.abs(dd).toFixed(precision)}° ${direction}`
}
