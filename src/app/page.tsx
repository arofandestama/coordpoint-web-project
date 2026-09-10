'use client';

/**
 * Home — single-route application with two client views:
 * 1. LandingPage — marketing/dokumentasi page (dark-ocean theme).
 * 2. MapWorkspace — the actual OpenLayers map application.
 *
 * The map workspace is loaded lazily on the client only (OpenLayers needs a
 * real browser DOM), keeping the landing page fast to load.
 */
import { useState } from 'react';
import dynamic from 'next/dynamic';

import LandingPage from '@/components/landing/LandingPage';

/** Client-only lazy view for the OpenLayers application. */
const MapWorkspace = dynamic(
  () => import('@/components/map/MapWorkspace'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-dvh items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div
            aria-hidden="true"
            className="h-10 w-10 animate-spin rounded-full border-2 border-[#00b4d8] border-t-transparent"
          />
          <p className="text-sm text-slate-500">Memuat aplikasi peta…</p>
        </div>
      </div>
    ),
  },
);

/** Available views of the application. */
type View = 'landing' | 'app';

/**
 * Entry page — switches between the landing page and the map workspace.
 */
export default function Home() {
  const [view, setView] = useState<View>('landing');

  if (view === 'app') {
    return <MapWorkspace onBack={() => setView('landing')} />;
  }

  return <LandingPage onLaunch={() => setView('app')} />;
}
