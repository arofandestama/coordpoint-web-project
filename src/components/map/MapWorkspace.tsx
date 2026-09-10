'use client';

/**
 * @module MapWorkspace
 * @description Application workspace hosting the interactive OpenLayers map canvas, header readouts, and conversion panel overlay.
 *
 * @see {@link MapService}
 * @see {@link ConversionPanel}
 */
import { useCallback, useRef, useState } from 'react';
import { ArrowLeft, Crosshair, Info, MapPin } from 'lucide-react';

import { ConversionPanel, type AddToMapPayload } from '@/components/map/ConversionPanel';
import { FloatingButton } from '@/components/map/FloatingButton';
import { MapCanvas } from '@/components/map/MapCanvas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { formatDd } from '@/lib/coordinates';
import { MapService, type LonLat } from '@/lib/ol/map-service';

interface MapWorkspaceProps {
  /** Returns the user to the landing page. */
  onBack: () => void;
}

/**
 * Full-screen map application with conversion panel and marker management.
 *
 * @param props - {@link MapWorkspaceProps} with the back-navigation handler.
 */
export default function MapWorkspace({ onBack }: MapWorkspaceProps) {
  const serviceRef = useRef<MapService | null>(null);
  const [center, setCenter] = useState<LonLat | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [markerCount, setMarkerCount] = useState(0);
  const { toast } = useToast();

  /** Stores the MapService created by the canvas. */
  const handleReady = useCallback((service: MapService) => {
    serviceRef.current = service;
  }, []);

  /** Mirrors the map center into the header readout. */
  const handleCenterChange = useCallback((lonLat: LonLat) => {
    setCenter(lonLat);
  }, []);

  /** Adds a marker, animates the view to it and notifies the user. */
  const handleAddToMap = useCallback(
    (payload: AddToMapPayload) => {
      const service = serviceRef.current;
      if (!service) return;
      service.addMarker(payload.lonLat);
      service.flyTo(payload.lonLat);
      service.pulseAt(payload.lonLat);
      setMarkerCount((count) => count + 1);
      toast({
        title: 'Marker berhasil ditambahkan',
        description: payload.title,
      });
    },
    [toast],
  );

  return (
    <div className="flex h-dvh flex-col bg-white">
      <header className="z-20 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white/90 px-3 backdrop-blur sm:px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-10 gap-1.5 rounded-full px-3 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Beranda
        </Button>
        <Separator orientation="vertical" className="hidden h-6 sm:block" />
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-tight">CoordPoint</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {markerCount > 0 && (
            <Badge className="gap-1 border border-[#90e0ef] bg-[#90e0ef]/20 font-mono text-[#023e8a] hover:bg-[#90e0ef]/30">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {markerCount} marker
            </Badge>
          )}
          <div
            aria-live="polite"
            className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 md:flex"
          >
            <Crosshair
              className="h-3.5 w-3.5 text-[#00b4d8]"
              aria-hidden="true"
            />
            <span className="font-mono text-xs text-slate-600">
              {center
                ? `${formatDd(center[1], 'latitude')}, ${formatDd(center[0], 'longitude')}`
                : 'Memuat peta…'}
            </span>
          </div>
        </div>
      </header>

      <main className="relative flex-1 overflow-hidden">
        <MapCanvas onReady={handleReady} onCenterChange={handleCenterChange} />

        {!panelOpen && (
          <>
            <FloatingButton onClick={() => setPanelOpen(true)} />
            <div className="pointer-events-none absolute bottom-14 left-4 z-10 hidden items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs text-slate-500 shadow-sm backdrop-blur sm:flex">
              <Info className="h-3.5 w-3.5 text-[#00b4d8]" aria-hidden="true" />
              Tekan tombol untuk konversi DMS ⇄ DD
            </div>
          </>
        )}

        {panelOpen && (
          <ConversionPanel
            onClose={() => setPanelOpen(false)}
            onAddToMap={handleAddToMap}
          />
        )}
      </main>
    </div>
  );
}
