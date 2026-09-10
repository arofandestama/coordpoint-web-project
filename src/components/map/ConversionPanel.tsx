'use client';

/**
 * ConversionPanel — floating card displayed above the map.
 *
 * Contains two tabs:
 * - "DMS to DD": input derajat, menit, detik + arah (N/S dan E/W) → hasil Decimal Degrees.
 * - "DD to DMS": input derajat desimal → hasil Derajat-Menit-Detik dengan arah.
 *
 * Hasil konversi dapat langsung ditambahkan ke peta melalui tombol "Add To Maps".
 */
import { useEffect, useRef, useState } from 'react';
import { Check, Copy, MapPinPlus, RotateCcw, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ddToDms,
  dmsToDd,
  formatDd,
  formatDms,
  CoordinateValidationError,
  type CardinalDirection,
  type DmsCoordinate,
} from '@/lib/coordinates';
import type { LonLat } from '@/lib/ol/map-service';
import { cn } from '@/lib/utils';

/** Payload delivered to the map when the user presses "Add To Maps". */
export interface AddToMapPayload {
  /** Coordinate in `[longitude, latitude]` decimal degrees. */
  lonLat: LonLat;
  /** Human readable coordinate used for toasts, e.g. `49.50278° N, 123.50556° W`. */
  title: string;
}

interface ConversionPanelProps {
  onClose: () => void;
  onAddToMap: (payload: AddToMapPayload) => void;
}

/** Tab identifiers. */
type TabValue = 'dms-to-dd' | 'dd-to-dms';

/** Editable DMS fields (strings so the input stays controlled). */
interface DmsInputState {
  degrees: string;
  minutes: string;
  seconds: string;
  direction: CardinalDirection;
}

/** Successful conversion result ready to be displayed or added to the map. */
interface ConversionOutcome {
  latText: string;
  lonText: string;
  lonLat: LonLat;
}

/** Field-level validation errors keyed by coordinate. */
interface PanelErrors {
  lat?: string;
  lon?: string;
}

const DEFAULT_LAT_DMS: DmsInputState = {
  degrees: '49',
  minutes: '30',
  seconds: '10',
  direction: 'N',
};
const DEFAULT_LON_DMS: DmsInputState = {
  degrees: '123',
  minutes: '30',
  seconds: '20',
  direction: 'W',
};
const DEFAULT_LAT_DD = '49.50278';
const DEFAULT_LON_DD = '-123.50556';

/** Indonesian label for every cardinal direction. */
const DIRECTION_INFO: Record<CardinalDirection, string> = {
  N: 'Utara (N)',
  S: 'Selatan (S)',
  E: 'Timur (E)',
  W: 'Barat (W)',
};

/**
 * Parses a numeric string, tolerating the Indonesian decimal comma.
 *
 * @param value - Raw input value.
 * @returns Parsed number (NaN when empty/invalid — downstream validation reports it).
 */
function parseNumber(value: string): number {
  return Number(value.trim().replace(',', '.'));
}

/**
 * Maps any thrown error into an Indonesian, user-friendly message.
 *
 * @param error - Caught error.
 * @returns Message string for the panel.
 */
function toErrorMessage(error: unknown): string {
  if (error instanceof CoordinateValidationError) return error.message;
  return 'Input tidak valid.';
}

/**
 * Floating conversion panel rendered on top of the map.
 *
 * @param props - {@link ConversionPanelProps} with close and add-to-map callbacks.
 */
export function ConversionPanel({ onClose, onAddToMap }: ConversionPanelProps) {
  const [tab, setTab] = useState<TabValue>('dms-to-dd');
  const [latDms, setLatDms] = useState<DmsInputState>(DEFAULT_LAT_DMS);
  const [lonDms, setLonDms] = useState<DmsInputState>(DEFAULT_LON_DMS);
  const [latDd, setLatDd] = useState(DEFAULT_LAT_DD);
  const [lonDd, setLonDd] = useState(DEFAULT_LON_DD);
  const [outcome, setOutcome] = useState<ConversionOutcome | null>(null);
  const [errors, setErrors] = useState<PanelErrors>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  // Keep the freshly produced result visible inside the scrollable panel.
  useEffect(() => {
    if (outcome) {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [outcome]);

  /** Converts the DMS inputs to DD and stores the result. */
  const handleConvertDmsToDd = () => {
    setErrors({});
    setOutcome(null);
    const nextErrors: PanelErrors = {};
    let rawLat: number | null = null;
    let rawLon: number | null = null;

    try {
      rawLat = dmsToDd(
        {
          degrees: parseNumber(latDms.degrees),
          minutes: parseNumber(latDms.minutes),
          seconds: parseNumber(latDms.seconds),
          direction: latDms.direction,
        },
        'latitude',
      );
    } catch (error) {
      nextErrors.lat = toErrorMessage(error);
    }

    try {
      rawLon = dmsToDd(
        {
          degrees: parseNumber(lonDms.degrees),
          minutes: parseNumber(lonDms.minutes),
          seconds: parseNumber(lonDms.seconds),
          direction: lonDms.direction,
        },
        'longitude',
      );
    } catch (error) {
      nextErrors.lon = toErrorMessage(error);
    }

    if (rawLat === null || rawLon === null) {
      setErrors(nextErrors);
      return;
    }

    setOutcome({
      latText: formatDd(rawLat, 'latitude'),
      lonText: formatDd(rawLon, 'longitude'),
      lonLat: [rawLon, rawLat],
    });
  };

  /** Converts the DD inputs to DMS and stores the result. */
  const handleConvertDdToDms = () => {
    setErrors({});
    setOutcome(null);
    const nextErrors: PanelErrors = {};
    let dmsLat: DmsCoordinate | null = null;
    let dmsLon: DmsCoordinate | null = null;

    try {
      dmsLat = ddToDms(parseNumber(latDd), 'latitude');
    } catch (error) {
      nextErrors.lat = toErrorMessage(error);
    }

    try {
      dmsLon = ddToDms(parseNumber(lonDd), 'longitude');
    } catch (error) {
      nextErrors.lon = toErrorMessage(error);
    }

    if (!dmsLat || !dmsLon) {
      setErrors(nextErrors);
      return;
    }

    setOutcome({
      latText: formatDms(dmsLat, 'latitude'),
      lonText: formatDms(dmsLon, 'longitude'),
      lonLat: [parseNumber(lonDd), parseNumber(latDd)],
    });
  };

  /** Resets every field back to the documented example values. */
  const handleReset = () => {
    setLatDms(DEFAULT_LAT_DMS);
    setLonDms(DEFAULT_LON_DMS);
    setLatDd(DEFAULT_LAT_DD);
    setLonDd(DEFAULT_LON_DD);
    setOutcome(null);
    setErrors({});
  };

  /** Copies a value to the clipboard and flashes a check icon. */
  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1600);
    } catch {
      // Clipboard API can fail on insecure contexts — silently ignore.
    }
  };

  /** Hands the converted coordinate over to the map. */
  const handleAddToMap = () => {
    if (!outcome) return;
    onAddToMap({
      lonLat: outcome.lonLat,
      title: `${outcome.latText}, ${outcome.lonText}`,
    });
  };

  return (
    <div
      role="dialog"
      aria-label="Panel konversi koordinat"
      className="thin-scrollbar absolute inset-x-3 top-3 z-10 max-h-[calc(100%-1.5rem)] animate-in overflow-y-auto rounded-2xl border bg-white/95 p-4 shadow-2xl shadow-slate-900/20 backdrop-blur duration-300 fade-in slide-in-from-top-4 sm:inset-x-auto sm:top-4 sm:right-4 sm:w-[400px]"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">
            Konversi Koordinat
          </h2>
          <p className="text-xs text-slate-500">Ubah format DMS ⇄ DD</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Tutup panel konversi"
          className="h-8 w-8 shrink-0 rounded-full text-slate-400 hover:text-slate-900"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as TabValue);
          setOutcome(null);
          setErrors({});
        }}
      >
        <TabsList className="grid w-full grid-cols-2 rounded-xl bg-slate-100 p-1">
          <TabsTrigger
            value="dms-to-dd"
            className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#023e8a] sm:text-sm"
          >
            DMS to DD
          </TabsTrigger>
          <TabsTrigger
            value="dd-to-dms"
            className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#023e8a] sm:text-sm"
          >
            DD to DMS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dms-to-dd" className="mt-4 space-y-4">
          <DmsFieldGroup
            idPrefix="lat-dms"
            label="Latitude"
            maxDegrees={90}
            state={latDms}
            onChange={setLatDms}
            directions={['N', 'S'] as const}
            directionLabel="Arah latitude"
            error={errors.lat}
          />
          <DmsFieldGroup
            idPrefix="lon-dms"
            label="Longitude"
            maxDegrees={180}
            state={lonDms}
            onChange={setLonDms}
            directions={['E', 'W'] as const}
            directionLabel="Arah longitude"
            error={errors.lon}
          />
          <Button
            type="button"
            onClick={handleConvertDmsToDd}
            className="h-11 w-full rounded-xl bg-slate-900 text-sm font-semibold hover:bg-slate-800"
          >
            Konversi ke DD
          </Button>
        </TabsContent>

        <TabsContent value="dd-to-dms" className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lat-dd" className="text-xs font-semibold text-slate-700">
              Latitude (Decimal Degrees)
            </Label>
            <Input
              id="lat-dd"
              type="number"
              inputMode="decimal"
              min={-90}
              max={90}
              step="any"
              value={latDd}
              onChange={(event) => setLatDd(event.target.value)}
              placeholder="Contoh: 49.50278"
              className="h-11 rounded-xl border-slate-200 font-mono focus-visible:ring-[#00b4d8]"
            />
            <p className="text-[11px] text-slate-500">
              Rentang -90 sampai 90 · {describeDdDirection(latDd, 'latitude')}
            </p>
            {errors.lat && <FieldError message={errors.lat} />}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lon-dd" className="text-xs font-semibold text-slate-700">
              Longitude (Decimal Degrees)
            </Label>
            <Input
              id="lon-dd"
              type="number"
              inputMode="decimal"
              min={-180}
              max={180}
              step="any"
              value={lonDd}
              onChange={(event) => setLonDd(event.target.value)}
              placeholder="Contoh: -123.50556"
              className="h-11 rounded-xl border-slate-200 font-mono focus-visible:ring-[#00b4d8]"
            />
            <p className="text-[11px] text-slate-500">
              Rentang -180 sampai 180 · {describeDdDirection(lonDd, 'longitude')}
            </p>
            {errors.lon && <FieldError message={errors.lon} />}
          </div>

          <Button
            type="button"
            onClick={handleConvertDdToDms}
            className="h-11 w-full rounded-xl bg-slate-900 text-sm font-semibold hover:bg-slate-800"
          >
            Konversi ke DMS
          </Button>
        </TabsContent>
      </Tabs>

      {outcome && (
        <div
          ref={resultRef}
          className="mt-4 animate-in rounded-xl border border-[#90e0ef] bg-[#90e0ef]/10 p-4 duration-300 fade-in slide-in-from-bottom-2"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#023e8a]">
              Hasil Konversi
            </span>
            <Badge
              variant="outline"
              className="border-[#90e0ef] bg-white text-[10px] uppercase tracking-wider text-[#023e8a]"
            >
              {tab === 'dms-to-dd' ? 'Decimal Degrees' : 'DMS'}
            </Badge>
          </div>

          <ResultRow
            label="Latitude"
            value={outcome.latText}
            copied={copiedKey === 'lat'}
            onCopy={() => handleCopy('lat', outcome.latText)}
          />
          <ResultRow
            label="Longitude"
            value={outcome.lonText}
            copied={copiedKey === 'lon'}
            onCopy={() => handleCopy('lon', outcome.lonText)}
          />

          <Button
            type="button"
            onClick={handleAddToMap}
            className="mt-4 h-11 w-full gap-2 rounded-xl bg-[#0077b6] text-sm font-semibold text-white hover:bg-[#023e8a]"
          >
            <MapPinPlus className="h-4 w-4" aria-hidden="true" />
            Add To Maps
          </Button>
          <p className="mt-2 text-center text-[11px] text-slate-500">
            Marker akan muncul dan peta dipusatkan otomatis ke titik tersebut.
          </p>
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        onClick={handleReset}
        className="mt-3 h-9 w-full gap-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        Atur ulang ke contoh
      </Button>
    </div>
  );
}

interface DmsFieldGroupProps {
  idPrefix: string;
  label: string;
  maxDegrees: number;
  state: DmsInputState;
  onChange: (next: DmsInputState) => void;
  directions: readonly CardinalDirection[];
  directionLabel: string;
  error?: string;
}

/**
 * Group of DMS inputs (derajat, menit, detik) plus a cardinal-direction toggle.
 *
 * @param props - {@link DmsFieldGroupProps} controlling one coordinate axis.
 */
function DmsFieldGroup({
  idPrefix,
  label,
  maxDegrees,
  state,
  onChange,
  directions,
  directionLabel,
  error,
}: DmsFieldGroupProps) {
  const patch = (partial: Partial<DmsInputState>) =>
    onChange({ ...state, ...partial });

  const unitFields: Array<{
    key: keyof Pick<DmsInputState, 'degrees' | 'minutes' | 'seconds'>;
    unit: string;
    text: string;
    step: string;
    max?: number;
  }> = [
    { key: 'degrees', unit: '°', text: 'Derajat', step: '1', max: maxDegrees },
    { key: 'minutes', unit: '′', text: 'Menit', step: '1', max: 59 },
    { key: 'seconds', unit: '″', text: 'Detik', step: '0.01', max: 59.99 },
  ];

  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold text-slate-700">{label}</legend>
      <div className="grid grid-cols-3 gap-2">
        {unitFields.map((field) => (
          <div key={field.key} className="space-y-1">
            <Label
              htmlFor={`${idPrefix}-${field.key}`}
              className="text-[11px] font-medium text-slate-500"
            >
              {field.text}
            </Label>
            <div className="relative">
              <Input
                id={`${idPrefix}-${field.key}`}
                type="number"
                inputMode="decimal"
                min={0}
                max={field.max}
                step={field.step}
                value={state[field.key]}
                onChange={(event) => patch({ [field.key]: event.target.value })}
                className="h-10 rounded-lg border-slate-200 pr-6 font-mono focus-visible:ring-[#00b4d8]"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
              >
                {field.unit}
              </span>
            </div>
          </div>
        ))}
      </div>
      <DirectionToggle
        value={state.direction}
        options={directions}
        ariaLabel={directionLabel}
        onChange={(direction) => patch({ direction })}
      />
      {error && <FieldError message={error} />}
    </fieldset>
  );
}

interface DirectionToggleProps {
  value: CardinalDirection;
  options: readonly CardinalDirection[];
  ariaLabel: string;
  onChange: (direction: CardinalDirection) => void;
}

/**
 * Segmented control for picking a cardinal direction (N/S or E/W).
 *
 * @param props - {@link DirectionToggleProps} with value, options and handler.
 */
function DirectionToggle({
  value,
  options,
  ariaLabel,
  onChange,
}: DirectionToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1"
    >
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option)}
            className={cn(
              'h-9 rounded-md text-sm font-semibold transition-colors',
              active
                ? 'bg-[#0077b6] text-white shadow-sm'
                : 'text-slate-500 hover:bg-white hover:text-slate-900',
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

interface ResultRowProps {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}

/**
 * Single result line with a copy-to-clipboard button.
 *
 * @param props - {@link ResultRowProps} with label, value and copy state.
 */
function ResultRow({ label, value, copied, onCopy }: ResultRowProps) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-[#90e0ef]/50 bg-white px-3 py-2">
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="truncate font-mono text-sm font-semibold text-slate-900">
          {value}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onCopy}
        aria-label={`Salin ${label}: ${value}`}
        className="h-8 w-8 shrink-0 rounded-full text-slate-400 hover:text-[#023e8a]"
      >
        {copied ? (
          <Check className="h-4 w-4 text-[#0077b6]" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}

/**
 * Small red helper text shown under an invalid field.
 *
 * @param props - message to display.
 */
function FieldError({ message }: { message: string }) {
  return (
    <p role="alert" className="text-[11px] font-medium text-red-600">
      {message}
    </p>
  );
}

/**
 * Describes the direction implied by the sign of a decimal degree input.
 *
 * @param value - Raw string from the DD input.
 * @param axis - Coordinate axis of the input.
 * @returns Indonesian direction label or an empty string when unparsable.
 */
function describeDdDirection(value: string, axis: 'latitude' | 'longitude'): string {
  const parsed = parseNumber(value);
  if (Number.isNaN(parsed)) return '';
  const direction: CardinalDirection =
    axis === 'latitude' ? (parsed < 0 ? 'S' : 'N') : parsed < 0 ? 'W' : 'E';
  return `Arah: ${DIRECTION_INFO[direction]}`;
}
