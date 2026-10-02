'use client';

/**
 * @module useMapStore
 * @description React hook adapter for the vanilla {@link createMapStore} store.
 */
import { useStore } from 'zustand';

import { createMapStore, type MapStoreState } from '@/store/map.store';

/** Application-wide singleton map workspace store. */
export const mapStore = createMapStore();

/**
 * Reads a slice of the map workspace store from React.
 *
 * @param selector - Pure function selecting the desired slice of state.
 * @returns The selected slice; the component re-renders whenever it changes.
 *
 * @example
 * const panelOpen = useMapStore((state) => state.panelOpen);
 */
export function useMapStore<T>(selector: (state: MapStoreState) => T): T {
  return useStore(mapStore, selector);
}
