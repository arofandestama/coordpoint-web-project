/**
 * @module mapConfig.constants
 * @description Global OpenLayers map configuration constants.
 */
import type { LonLat } from '@/types/geo.types';

/** Default map center: Jakarta, Indonesia. */
export const DEFAULT_CENTER: LonLat = [106.8456, -6.2088];

/** Default zoom level used when the map is created. */
export const DEFAULT_ZOOM = 10;

/** Zoom level applied when the view flies to a newly added marker. */
export const MARKER_FOCUS_ZOOM = 13;
