'use client';

/**
 * FloatingButton — round call-to-action pinned to the top-right corner of
 * the map, right below the live coordinate readout in the header. Opens the
 * coordinate conversion panel.
 */
import { MapPinPlus } from 'lucide-react';

interface FloatingButtonProps {
  /** Invoked when the user presses the button. */
  onClick: () => void;
}

/**
 * Blue floating action button displayed under the coordinate readout.
 *
 * @param props - {@link FloatingButtonProps} with the click handler.
 */
export function FloatingButton({ onClick }: FloatingButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Buka panel konversi koordinat"
      className="absolute right-3 top-3 z-10 flex h-11 items-center gap-2 rounded-full bg-[#0077b6] px-4 text-white shadow-lg shadow-[#023e8a]/40 transition-all duration-200 hover:scale-105 hover:bg-[#023e8a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00b4d8] focus-visible:ring-offset-2 active:scale-95"
    >
      <MapPinPlus className="h-5 w-5" aria-hidden="true" />
      <span className="hidden text-sm font-semibold sm:inline">
        Konversi Koordinat
      </span>
    </button>
  );
}