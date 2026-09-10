import type { Axis, CardinalDirection, DmsCoordinate } from './types'
import { assertValidDd, assertValidDms } from './validate'

/**
 * Factor used to round the seconds component to two fractional digits.
 */
const SECONDS_ROUNDING_FACTOR = 100

/**
 * Converts a coordinate from Decimal Degrees (DD) to Degrees-Minutes-Seconds
 * (DMS) notation.
 *
 * Degrees are obtained by flooring the absolute value, minutes by flooring
 * the remaining fraction times 60, and seconds by rounding the remaining
 * fraction times 3600 to two decimals. Rounding carries are propagated:
 * when seconds reach 60 they wrap to 0 and the minutes are incremented, and
 * when minutes reach 60 they wrap to 0 and the degrees are incremented.
 * Negative values produce `'S'` (latitude) or `'W'` (longitude) directions;
 * zero maps to `'N'` / `'E'`.
 *
 * @param dd - The decimal degrees value to convert. Must be valid for `axis`.
 * @param axis - Geographic axis the value belongs to; determines the allowed
 *   range and the resulting direction letters.
 * @returns The equivalent DMS coordinate with non-negative components.
 * @throws {CoordinateValidationError} When `dd` is out of range for `axis`,
 *   `NaN`, or infinite.
 *
 * @example
 * ddToDms(49.50278, 'latitude')
 * // => { degrees: 49, minutes: 30, seconds: 10.01, direction: 'N' }
 *
 * @example
 * ddToDms(123.50556, 'longitude')
 * // => { degrees: 123, minutes: 30, seconds: 20.02, direction: 'E' }
 *
 * @example
 * ddToDms(-123.50556, 'longitude')
 * // => { degrees: 123, minutes: 30, seconds: 20.02, direction: 'W' }
 *
 * @example
 * // Rounding carry: seconds round up to 60, then minutes, then degrees.
 * ddToDms(59.999999, 'latitude')
 * // => { degrees: 60, minutes: 0, seconds: 0, direction: 'N' }
 */
export function ddToDms(dd: number, axis: Axis): DmsCoordinate {
  assertValidDd(dd, axis)

  const isNegative = dd < 0
  const absDd = Math.abs(dd)

  let degrees = Math.floor(absDd)
  const minutesFloat = (absDd - degrees) * 60
  let minutes = Math.floor(minutesFloat)
  const secondsFloat = (minutesFloat - minutes) * 60
  let seconds = Math.round(secondsFloat * SECONDS_ROUNDING_FACTOR) / SECONDS_ROUNDING_FACTOR

  // Carry handling after rounding seconds to two decimals.
  if (seconds >= 60) {
    seconds = 0
    minutes += 1
  }
  if (minutes >= 60) {
    minutes = 0
    degrees += 1
  }

  const direction: CardinalDirection = axis === 'latitude' ? (isNegative ? 'S' : 'N') : isNegative ? 'W' : 'E'

  return { degrees, minutes, seconds, direction }
}

/**
 * Formats a DMS coordinate as a human-readable string, e.g. `49°30'10.01" N`.
 *
 * Integer seconds are rendered without decimals (`49°30'10"`), fractional
 * seconds with up to two decimals and trailing zeros trimmed
 * (`20.02` stays `20.02`, `10.5` stays `10.5`).
 *
 * @param dms - The DMS coordinate to format. Must be valid for `axis`.
 * @param axis - Geographic axis the coordinate belongs to.
 * @returns The formatted string `<degrees>°<minutes>'<seconds>" <direction>`.
 * @throws {CoordinateValidationError} When `dms` is not a valid DMS
 *   coordinate for `axis` (see `assertValidDms` for the rules).
 *
 * @example
 * formatDms({ degrees: 49, minutes: 30, seconds: 10.01, direction: 'N' }, 'latitude')
 * // => `49°30'10.01" N`
 *
 * @example
 * formatDms({ degrees: 6, minutes: 12, seconds: 0, direction: 'S' }, 'latitude')
 * // => `6°12'0" S`
 */
export function formatDms(dms: DmsCoordinate, axis: Axis): string {
  assertValidDms(dms, axis)

  const secondsText = Number.isInteger(dms.seconds)
    ? String(dms.seconds)
    : dms.seconds.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')

  return `${dms.degrees}°${dms.minutes}'${secondsText}" ${dms.direction}`
}
