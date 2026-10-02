/**
 * @module geo.types
 * @description Global geographic types and DTOs shared across the CoordPoint map workspace.
 */

/**
 * Geographic coordinate expressed as `[longitude, latitude]` in decimal degrees.
 */
export type LonLat = [number, number];

/**
 * Handler invoked with the map center (lon/lat DD) every time the view stops moving.
 */
export type CenterChangeHandler = (lonLat: LonLat) => void;

/**
 * A marker that has been registered on the map, mirroring the OpenLayers feature.
 *
 * @example
 * const monas: MapMarker = {
 *   id: 'marker-1',
 *   lonLat: [106.82711, -6.17539],
 *   title: '6.17539° S, 106.82711° E',
 * }
 */
export interface MapMarker {
  /** Stable unique identifier used as the React list key. */
  id: string;

  /** Coordinate in `[longitude, latitude]` decimal degrees. */
  lonLat: LonLat;

  /** Human readable coordinate used for lists and toasts. */
  title: string;
}
