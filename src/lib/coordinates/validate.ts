/**
 * @module validate
 * @description Provides validation logic and assertions for DMS and DD coordinates against WGS84 standards.
 */
import type { Axis, CardinalDirection, DmsCoordinate } from './types'
import { CoordinateValidationError, LATITUDE_MAX_DEGREES, LONGITUDE_MAX_DEGREES } from './types'

/**
 * Inclusive upper bound for the minutes component of a DMS coordinate.
 */
const MINUTES_MAX = 59

/**
 * Exclusive upper bound for the seconds component of a DMS coordinate.
 * Seconds are valid in the interval [0, 60), i.e. up to 59.999... seconds.
 */
const SECONDS_UPPER_BOUND = 60

/**
 * Checks whether a cardinal direction is valid for the given axis.
 *
 * @param direction - Cardinal direction letter to check.
 * @param axis - Geographic axis the direction is supposed to belong to.
 * @returns `true` when the direction matches the axis (`N`/`S` for latitude,
 *   `E`/`W` for longitude), `false` otherwise.
 */
function isValidDirectionForAxis(direction: CardinalDirection, axis: Axis): boolean {
  return axis === 'latitude' ? direction === 'N' || direction === 'S' : direction === 'E' || direction === 'W'
}

/**
 * Asserts that a DMS coordinate is structurally and numerically valid for the
 * given axis, otherwise throws a {@link CoordinateValidationError}.
 *
 * Validation rules (checked in order):
 * 1. `degrees` must be a finite number between 0 and 90 (latitude) or 180 (longitude).
 * 2. `minutes` must be a finite number between 0 and 59 (inclusive).
 * 3. `seconds` must be a finite number between 0 and 59.999... (below 60).
 * 4. `direction` must match the axis (`N`/`S` for latitude, `E`/`W` for longitude).
 *
 * @param dms - The DMS coordinate to validate.
 * @param axis - Geographic axis the coordinate belongs to.
 * @returns Nothing; the function only asserts validity.
 * @throws {CoordinateValidationError} With field `'degrees'` when the degrees
 *   component is out of range or not a number.
 * @throws {CoordinateValidationError} With field `'minutes'` when the minutes
 *   component is out of range or not a number.
 * @throws {CoordinateValidationError} With field `'seconds'` when the seconds
 *   component is out of range or not a number.
 * @throws {CoordinateValidationError} With field `'direction'` when the
 *   cardinal direction does not match the axis.
 *
 * @example
 * assertValidDms({ degrees: 6, minutes: 12, seconds: 0, direction: 'S' }, 'latitude') // OK
 * assertValidDms({ degrees: 6, minutes: 12, seconds: 0, direction: 'E' }, 'latitude') // throws
 */
export function assertValidDms(dms: DmsCoordinate, axis: Axis): void {
  const maxDegrees = axis === 'latitude' ? LATITUDE_MAX_DEGREES : LONGITUDE_MAX_DEGREES

  if (!Number.isFinite(dms.degrees) || dms.degrees < 0 || dms.degrees > maxDegrees) {
    throw new CoordinateValidationError(
      'degrees',
      axis === 'latitude'
        ? `Derajat latitude harus berupa angka antara 0 dan ${LATITUDE_MAX_DEGREES}.`
        : `Derajat longitude harus berupa angka antara 0 dan ${LONGITUDE_MAX_DEGREES}.`,
    )
  }

  if (!Number.isFinite(dms.minutes) || dms.minutes < 0 || dms.minutes > MINUTES_MAX) {
    throw new CoordinateValidationError('minutes', 'Menit harus berupa angka antara 0 dan 59.')
  }

  if (!Number.isFinite(dms.seconds) || dms.seconds < 0 || dms.seconds >= SECONDS_UPPER_BOUND) {
    throw new CoordinateValidationError('seconds', 'Detik harus berupa angka antara 0 dan 59.999.')
  }

  if (!isValidDirectionForAxis(dms.direction, axis)) {
    throw new CoordinateValidationError(
      'direction',
      axis === 'latitude' ? 'Arah latitude harus N atau S.' : 'Arah longitude harus E atau W.',
    )
  }
}

/**
 * Asserts that a decimal degrees (DD) value is a finite number within the
 * valid range of the given axis, otherwise throws a
 * {@link CoordinateValidationError}.
 *
 * Valid ranges: latitude must lie in [-90, 90], longitude must lie in
 * [-180, 180]. `NaN`, `+Infinity` and `-Infinity` are rejected as well.
 *
 * @param dd - The decimal degrees value to validate.
 * @param axis - Geographic axis the value belongs to.
 * @returns Nothing; the function only asserts validity.
 * @throws {CoordinateValidationError} With field `'dd'` when the value is out
 *   of range, `NaN`, or infinite.
 *
 * @example
 * assertValidDd(-6.2, 'latitude') // OK
 * assertValidDd(-123.50556, 'longitude') // OK
 * assertValidDd(Number.NaN, 'latitude') // throws
 */
export function assertValidDd(dd: number, axis: Axis): void {
  const maxDegrees = axis === 'latitude' ? LATITUDE_MAX_DEGREES : LONGITUDE_MAX_DEGREES
  const minDegrees = -maxDegrees

  if (!Number.isFinite(dd) || dd < minDegrees || dd > maxDegrees) {
    throw new CoordinateValidationError(
      'dd',
      axis === 'latitude'
        ? `Nilai latitude harus berupa angka antara ${minDegrees} dan ${maxDegrees}.`
        : `Nilai longitude harus berupa angka antara ${minDegrees} dan ${maxDegrees}.`,
    )
  }
}
