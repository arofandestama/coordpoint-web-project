/**
 * MapService — bridge between React components and an OpenLayers map.
 *
 * Encapsulates every direct OpenLayers interaction so that UI components
 * stay declarative: they ask the service to create the map, drop markers,
 * fly the view to a coordinate and subscribe to center changes.
 *
 * @example
 * const service = new MapService();
 * service.createMap(containerEl);
 * service.addMarker([106.8456, -6.2088]);
 * service.flyTo([106.8456, -6.2088]);
 */
import OlMap from 'ol/Map';
import View from 'ol/View';
import Overlay from 'ol/Overlay';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Icon, Style } from 'ol/style';

/** Geographic coordinate expressed as `[longitude, latitude]` in decimal degrees. */
export type LonLat = [number, number];

/** Handler invoked with the map center (lon/lat DD) every time the view stops moving. */
export type CenterChangeHandler = (lonLat: LonLat) => void;

/** Default map center: Jakarta, Indonesia. */
export const DEFAULT_CENTER: LonLat = [106.8456, -6.2088];

/** Default zoom level used when the map is created. */
export const DEFAULT_ZOOM = 10;

/** Zoom level applied when the view flies to a newly added marker. */
export const MARKER_FOCUS_ZOOM = 13;

/** Inline SVG used as the marker pin (ocean-blue teardrop with a white dot). */
const MARKER_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="52" viewBox="0 0 36 52">',
  '<path d="M18 1C8.6 1 1 8.6 1 18c0 11.4 14.2 29.1 16.3 31.6a1 1 0 0 0 1.4 0C20.8 47.1 35 29.4 35 18 35 8.6 27.4 1 18 1z" fill="#0077b6" stroke="#ffffff" stroke-width="2"/>',
  '<circle cx="18" cy="18" r="6" fill="#ffffff"/>',
  '</svg>',
].join('');

/** Data-URI version of {@link MARKER_SVG} so no external asset is required. */
const MARKER_ICON_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(MARKER_SVG)}`;

/**
 * Creates the OpenLayers style used by every marker on the map.
 *
 * @returns An icon style anchored at the bottom tip of the pin.
 */
function createMarkerStyle(): Style {
  return new Style({
    image: new Icon({
      src: MARKER_ICON_URI,
      anchor: [0.5, 1],
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      width: 36,
      height: 52,
    }),
  });
}

/**
 * Builds the DOM element that renders a short "ping" animation at a marker
 * location right after it is added to the map.
 *
 * @returns A styled `div` element ready to be attached to an {@link Overlay}.
 */
function createPulseElement(): HTMLDivElement {
  const element = document.createElement('div');
  element.setAttribute('aria-hidden', 'true');
  element.className =
    'pointer-events-none relative flex h-12 w-12 items-center justify-center';
  element.innerHTML = [
    '<span class="absolute inline-flex h-12 w-12 animate-ping rounded-full bg-[#90e0ef] opacity-60"></span>',
    '<span class="relative inline-flex h-3 w-3 rounded-full bg-[#0077b6] ring-2 ring-white"></span>',
  ].join('');
  return element;
}

/**
 * Imperative wrapper around an OpenLayers `Map` instance.
 *
 * The service owns the tile layer, the marker vector layer and the view
 * animation helpers. React components only talk to this class.
 */
export class MapService {
  private map: OlMap | null = null;
  private markerSource: VectorSource = new VectorSource();
  private markerLayer: VectorLayer<VectorSource>;
  private centerHandlers = new Set<CenterChangeHandler>();
  private pulseTimeouts = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    this.markerLayer = new VectorLayer({
      source: this.markerSource,
      style: createMarkerStyle(),
      zIndex: 20,
    });
    this.handleMoveEnd = this.handleMoveEnd.bind(this);
  }

  /**
   * Creates the OpenStreetMap map inside the given container element.
   *
   * @param target - DOM element that will host the map canvas.
   * @param options - Optional overrides for the initial center and zoom.
   * @returns The created OpenLayers map instance.
   */
  createMap(
    target: HTMLElement,
    options: { center?: LonLat; zoom?: number } = {},
  ): OlMap {
    this.map = new OlMap({
      target,
      layers: [
        new TileLayer({ source: new OSM({ attributions: '© OpenStreetMap contributors' }) }),
        this.markerLayer,
      ],
      view: new View({
        center: fromLonLat(options.center ?? DEFAULT_CENTER),
        zoom: options.zoom ?? DEFAULT_ZOOM,
      }),
    });
    this.map.on('moveend', this.handleMoveEnd);
    return this.map;
  }

  /**
   * Adds a marker (point feature with an icon style) at the given coordinate.
   * The coordinate is expected in `[longitude, latitude]` decimal degrees.
   *
   * @param lonLat - Destination coordinate in decimal degrees.
   * @returns The created OpenLayers feature, or `null` when the map is not initialised.
   */
  addMarker(lonLat: LonLat): Feature<Point> | null {
    if (!this.map) return null;
    const feature = new Feature<Point>({
      geometry: new Point(fromLonLat(lonLat)),
    });
    this.markerSource.addFeature(feature);
    return feature;
  }

  /**
   * Smoothly animates the map view so the given coordinate becomes the center,
   * zooming in to at least {@link MARKER_FOCUS_ZOOM}.
   *
   * @param lonLat - Destination coordinate in decimal degrees.
   * @param zoom - Optional explicit zoom level (defaults to "at least marker focus zoom").
   */
  flyTo(lonLat: LonLat, zoom?: number): void {
    if (!this.map) return;
    const view = this.map.getView();
    const currentZoom = view.getZoom() ?? DEFAULT_ZOOM;
    view.animate({
      center: fromLonLat(lonLat),
      zoom: zoom ?? Math.max(currentZoom, MARKER_FOCUS_ZOOM),
      duration: 900,
    });
  }

  /**
   * Shows a short radial "ping" animation at the given coordinate.
   * The overlay removes itself after the animation finishes.
   *
   * @param lonLat - Coordinate in decimal degrees.
   */
  pulseAt(lonLat: LonLat): void {
    if (!this.map) return;
    const overlay = new Overlay({
      position: fromLonLat(lonLat),
      positioning: 'center-center',
      element: createPulseElement(),
      stopEvent: false,
    });
    this.map.addOverlay(overlay);
    const timeout = setTimeout(() => {
      this.map?.removeOverlay(overlay);
      this.pulseTimeouts.delete(timeout);
    }, 2400);
    this.pulseTimeouts.add(timeout);
  }

  /**
   * Subscribes to center changes. The handler fires whenever the view stops
   * moving (OpenLayers `moveend` event) and receives the center in lon/lat DD.
   *
   * @param handler - Callback invoked with the new center coordinate.
   * @returns An unsubscribe function.
   */
  onCenterChange(handler: CenterChangeHandler): () => void {
    this.centerHandlers.add(handler);
    return () => {
      this.centerHandlers.delete(handler);
    };
  }

  /**
   * Current map center expressed in decimal degrees.
   *
   * @returns `[longitude, latitude]` or `null` when unavailable.
   */
  getCenterLonLat(): LonLat | null {
    const center = this.map?.getView().getCenter();
    return center ? (toLonLat(center) as LonLat) : null;
  }

  /**
   * Underlying OpenLayers map instance (read-only access for advanced use).
   *
   * @returns The map instance or `null` before {@link createMap} is called.
   */
  getMap(): OlMap | null {
    return this.map;
  }

  /**
   * Detaches the map from its DOM target, clears pending animations and
   * removes every event subscription. Safe to call multiple times.
   */
  destroy(): void {
    this.pulseTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.pulseTimeouts.clear();
    this.centerHandlers.clear();
    if (this.map) {
      this.map.un('moveend', this.handleMoveEnd);
      this.map.setTarget(undefined);
      this.map = null;
    }
  }

  /** Internal `moveend` listener that notifies {@link onCenterChange} subscribers. */
  private handleMoveEnd(): void {
    const lonLat = this.getCenterLonLat();
    if (!lonLat) return;
    this.centerHandlers.forEach((handler) => handler(lonLat));
  }
}
