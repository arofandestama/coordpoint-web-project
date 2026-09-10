'use client';

/**
 * @module MapCanvas
 * @description Renders the OpenLayers tile canvas container and bridges events with {@link MapService}.
 *
 * @see {@link MapService}
 */
import { useEffect, useRef } from 'react';

import { MapService, type LonLat } from '@/lib/ol/map-service';

interface MapCanvasProps {
  /** Called once, right after the map has been created. */
  onReady: (service: MapService) => void;
  /** Called every time the map view stops moving. */
  onCenterChange: (lonLat: LonLat) => void;
}

/**
 * Full-area canvas hosting the OpenStreetMap tile layer.
 *
 * @param props - {@link MapCanvasProps} with the ready/center callbacks.
 */
export function MapCanvas({ onReady, onCenterChange }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Keep callbacks in refs so the map is created exactly once.
  const onReadyRef = useRef(onReady);
  const onCenterChangeRef = useRef(onCenterChange);
  useEffect(() => {
    onReadyRef.current = onReady;
    onCenterChangeRef.current = onCenterChange;
  }, [onReady, onCenterChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const service = new MapService();
    service.createMap(container);
    onReadyRef.current(service);
    const unsubscribe = service.onCenterChange((lonLat) =>
      onCenterChangeRef.current(lonLat),
    );

    return () => {
      unsubscribe();
      service.destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Peta OpenStreetMap interaktif"
      className="absolute inset-0 h-full w-full"
    />
  );
}
