/**
 * @module map.store
 * @description Vanilla Zustand store holding the CoordPoint map workspace state
 * (conversion panel visibility and the list of markers added to the map).
 *
 * The store is framework-agnostic; the React binding lives in
 * `@/store/useMapStore`.
 */
import { createStore } from 'zustand/vanilla';

import type { MapMarker } from '@/types/geo.types';

/** Shape of the map workspace store. */
export interface MapStoreState {
  /** Whether the floating conversion panel is currently open. */
  panelOpen: boolean;

  /** Markers added to the map, in insertion order. */
  markers: MapMarker[];

  /** Opens the conversion panel. */
  openPanel: () => void;

  /** Closes the conversion panel. */
  closePanel: () => void;

  /** Registers a new marker and returns the stored entity. */
  addMarker: (marker: Omit<MapMarker, 'id'>) => MapMarker;

  /** Removes every registered marker. */
  resetMarkers: () => void;
}

/** Monotonic counter used to build stable marker ids without extra dependencies. */
let markerSequence = 0;

/**
 * Creates a fresh vanilla Zustand store for the map workspace.
 *
 * @returns A vanilla store instance consumable through `useMapStore`.
 *
 * @example
 * const store = createMapStore();
 * store.getState().openPanel();
 * store.getState().addMarker({ lonLat: [106.8456, -6.2088], title: 'Jakarta' });
 */
export function createMapStore() {
  return createStore<MapStoreState>()((set) => ({
    panelOpen: false,
    markers: [],
    openPanel: () => set({ panelOpen: true }),
    closePanel: () => set({ panelOpen: false }),
    addMarker: (marker) => {
      markerSequence += 1;
      const next: MapMarker = { ...marker, id: `marker-${markerSequence}` };
      set((state) => ({ markers: [...state.markers, next] }));
      return next;
    },
    resetMarkers: () => set({ markers: [] }),
  }));
}

/** Vanilla store instance type returned by {@link createMapStore}. */
export type MapStore = ReturnType<typeof createMapStore>;
