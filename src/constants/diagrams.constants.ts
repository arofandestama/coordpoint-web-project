/**
 * Mermaid diagram sources for the CoordPoint documentation section.
 * These strings are rendered client-side by `MermaidDiagram` and are also
 * kept as standalone Mermaid blocks in the `docs/` folder.
 */

export const CLASS_DIAGRAM = `classDiagram
    direction LR

    class CoordinateTypes {
        <<module>>
        Axis
        DirectionLatitude
        DirectionLongitude
        DmsCoordinate
    }

    class CoordinateValidator {
        <<module>>
        +assertValidDms(dms, axis) void
        +assertValidDd(dd, axis) void
        +CoordinateValidationError
    }

    class DmsToDdConverter {
        <<module>>
        +dmsToDd(dms, axis) number
        +formatDd(dd, axis, precision) string
    }

    class DdToDmsConverter {
        <<module>>
        +ddToDms(dd, axis) DmsCoordinate
        +formatDms(dms, axis) string
    }

    class MapService {
        <<class>>
        -map
        -markerSource
        +createMap(target) ol_Map
        +addMarker(lonLat) void
        +flyTo(lonLat, zoom) void
        +pulseAt(lonLat) void
        +onCenterChange(cb) void
        +destroy() void
    }

    class FloatingButton {
        <<component>>
        +onClick() void
    }

    class ConversionPanel {
        <<component>>
        +activeTab
        +onAddToMap(payload) void
    }

    class MapWorkspace {
        <<component>>
        +service
        +handleAddToMap(payload) void
    }

    DmsToDdConverter --> CoordinateTypes: uses
    DdToDmsConverter --> CoordinateTypes: uses
    DmsToDdConverter --> CoordinateValidator: validates input
    DdToDmsConverter --> CoordinateValidator: validates input
    ConversionPanel ..> DmsToDdConverter: DMS to DD tab
    ConversionPanel ..> DdToDmsConverter: DD to DMS tab
    MapWorkspace --> MapService: controls map
    MapWorkspace --> ConversionPanel: renders
    MapWorkspace --> FloatingButton: renders
    ConversionPanel --> MapService: requests via onAddToMap`;

export const SEQUENCE_DIAGRAM = `sequenceDiagram
    actor User as Pengguna
    participant FB as FloatingButton
    participant CP as ConversionPanel
    participant V as Validator
    participant C as Converter
    participant MS as MapService
    participant OL as OpenLayers Map

    User->>FB: Klik tombol konversi
    FB->>CP: Buka panel konversi
    User->>CP: Isi input DMS (derajat, menit, detik, arah)
    User->>CP: Klik "Konversi ke DD"
    CP->>V: assertValidDms(dms, axis)
    alt Input tidak valid
        V-->>CP: CoordinateValidationError
        CP-->>User: Tampilkan pesan error
    else Input valid
        V-->>CP: valid
        CP->>C: dmsToDd(dms, axis)
        C-->>CP: dd (decimal degrees)
        CP->>C: formatDd(dd, axis)
        C-->>CP: "49.50278° N"
        CP-->>User: Tampilkan hasil DD
        User->>CP: Klik "Add To Maps"
        CP->>MS: addMarker(lonLat)
        MS->>OL: Tambah Feature + Icon marker
        CP->>MS: flyTo(lonLat)
        MS->>OL: view.animate(center, zoom)
        OL-->>User: Peta berpusat di marker baru
    end`;
