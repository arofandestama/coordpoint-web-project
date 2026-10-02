/**
 * Barrel module for the coordinate conversion library.
 *
 * Exposes the DMS ⇄ DD conversion functions, formatters, validators,
 * shared types, constants and the {@link CoordinateValidationError} error
 * class in a single import point.
 *
 * @example
 * import { dmsToDd, ddToDms, formatDd } from '@/utils/coordinates'
 */
export * from '@/constants/coordinates.constants'
export * from '@/types/coordinate.types'
export * from './validate'
export * from './dmsToDd'
export * from './ddToDms'
