/**
 * Identifies the geographic axis a coordinate belongs to.
 *
 * Latitude values range from 0 to 90 degrees in absolute terms (hemisphere
 * determined by the `N`/`S` direction), while longitude values range from
 * 0 to 180 degrees in absolute terms (hemisphere determined by the `E`/`W`
 * direction). Conversion and formatting functions require the axis so they
 * can apply the correct bounds and the correct set of cardinal directions.
 */
export type Axis = 'latitude' | 'longitude'

/**
 * Cardinal direction designator for a latitude value.
 *
 * - `'N'` (North) marks positive latitudes (from the equator up to 90°).
 * - `'S'` (South) marks negative latitudes (from the equator down to -90°).
 */
export type DirectionLatitude = 'N' | 'S'

/**
 * Cardinal direction designator for a longitude value.
 *
 * - `'E'` (East) marks positive longitudes (from the prime meridian up to 180°).
 * - `'W'` (West) marks negative longitudes (from the prime meridian down to -180°).
 */
export type DirectionLongitude = 'E' | 'W'

/**
 * Any valid cardinal direction letter used by DMS coordinates, i.e. a
 * {@link DirectionLatitude} (`'N'` | `'S'`) or a {@link DirectionLongitude}
 * (`'E'` | `'W'`).
 */
export type CardinalDirection = DirectionLatitude | DirectionLongitude

/**
 * A geographic coordinate expressed in Degrees-Minutes-Seconds (DMS) notation.
 *
 * The hemisphere is encoded in `direction` rather than in the numeric fields,
 * so `degrees`, `minutes` and `seconds` are always non-negative. The allowed
 * range of `degrees` depends on the axis: at most
 * {@link LATITUDE_MAX_DEGREES} for latitude and at most
 * {@link LONGITUDE_MAX_DEGREES} for longitude.
 *
 * @example
 * const monasJakarta: DmsCoordinate = {
 *   degrees: 6,
 *   minutes: 10,
 *   seconds: 30,
 *   direction: 'S',
 * }
 */
export interface DmsCoordinate {
  /**
   * Whole degrees of the coordinate. Always non-negative; the hemisphere is
   * carried by {@link DmsCoordinate.direction}.
   */
  degrees: number

  /**
   * Arc minutes component. Must be a number between 0 and 59 (inclusive).
   */
  minutes: number

  /**
   * Arc seconds component. Must be a number between 0 and 59.999... (i.e.
   * lower than 60) so that minutes never need to absorb a carry.
   */
  seconds: number

  /**
   * Cardinal direction (hemisphere). Must match the axis: `'N'`/`'S'` for
   * latitude, `'E'`/`'W'` for longitude.
   */
  direction: CardinalDirection
}

/**
 * Maximum absolute number of degrees a latitude may have (North or South).
 * Latitude therefore spans the closed interval [-90, 90] in decimal degrees.
 */
export const LATITUDE_MAX_DEGREES = 90

/**
 * Maximum absolute number of degrees a longitude may have (East or West).
 * Longitude therefore spans the closed interval [-180, 180] in decimal degrees.
 */
export const LONGITUDE_MAX_DEGREES = 180

/**
 * Error thrown when a coordinate value (a DMS component, a cardinal
 * direction, or a decimal-degree number) fails validation.
 *
 * The `field` property identifies which input was rejected, which makes it
 * easy to map the error back to a specific form field in the UI.
 *
 * @example
 * try {
 *   dmsToDd({ degrees: 91, minutes: 0, seconds: 0, direction: 'N' }, 'latitude')
 * } catch (error) {
 *   if (error instanceof CoordinateValidationError) {
 *     console.log(error.field) // 'degrees'
 *     console.log(error.message) // 'Derajat latitude harus berupa angka antara 0 dan 90.'
 *   }
 * }
 */
export class CoordinateValidationError extends Error {
  /**
   * Name of the rejected input, e.g. `'degrees'`, `'minutes'`, `'seconds'`,
   * `'direction'` or `'dd'`. Useful for highlighting the offending form field.
   */
  readonly field: string

  /**
   * Creates a new {@link CoordinateValidationError}.
   *
   * @param field - Identifier of the rejected input (e.g. `'degrees'`, `'dd'`).
   * @param message - Human-readable (Indonesian) description of the problem.
   *
   * @example
   * const error = new CoordinateValidationError('minutes', 'Menit harus berupa angka antara 0 dan 59.')
   * error.name // 'CoordinateValidationError'
   * error.field // 'minutes'
   */
  constructor(field: string, message: string) {
    super(message)
    this.name = 'CoordinateValidationError'
    this.field = field
    // Keeps `instanceof` working when the class is transpiled down to ES5.
    Object.setPrototypeOf(this, CoordinateValidationError.prototype)
  }
}
