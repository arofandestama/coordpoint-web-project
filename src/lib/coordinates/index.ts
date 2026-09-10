/**
 * Barrel module for the coordinate conversion library.
 *
 * Exposes the DMS ⇄ DD conversion functions, formatters, validators,
 * shared types, constants and the {@link CoordinateValidationError} error
 * class in a single import point.
 *
 * @example
 * import { dmsToDd, ddToDms, formatDd } from '@/lib/coordinates'
 */
export * from './types'
export * from './validate'
export * from './dms-to-dd'
export * from './dd-to-dms'
