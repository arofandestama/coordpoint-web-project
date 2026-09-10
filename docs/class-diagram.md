# Class Diagram — CoordPoint

Rencana relasi class/function untuk studi kasus konversi koordinat DMS ⇄ DD.
Diagram ini juga dirender langsung pada landing page (bagian **Dokumentasi**) dan
disimpan sebagai sumber mermaid di `src/lib/docs/diagrams.ts`.

## Diagram

```mermaid
classDiagram
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
    ConversionPanel --> MapService: requests via onAddToMap
```

## Penjelasan Relasi

| Sumber | Target | Makna |
| --- | --- | --- |
| `DmsToDdConverter` / `DdToDmsConverter` | `CoordinateTypes` | Menggunakan tipe bersama (`Axis`, `DmsCoordinate`, dsb.) |
| `DmsToDdConverter` / `DdToDmsConverter` | `CoordinateValidator` | Memvalidasi input sebelum konversi; kegagalan melempar `CoordinateValidationError` |
| `ConversionPanel` | `DmsToDdConverter` | Tab **DMS to DD** memanggil `dmsToDd()` + `formatDd()` |
| `ConversionPanel` | `DdToDmsConverter` | Tab **DD to DMS** memanggil `ddToDms()` + `formatDms()` |
| `MapWorkspace` | `MapService` | Mengontrol peta: `createMap`, `addMarker`, `flyTo`, `pulseAt` |
| `MapWorkspace` | `ConversionPanel` / `FloatingButton` | Merender komponen UI dan menghubungkan callback |
| `ConversionPanel` | `MapService` | Request "Add To Maps" dikirim via callback `onAddToMap` |

## Pemetaan ke Struktur Folder

| Simbol pada diagram | Lokasi file |
| --- | --- |
| `CoordinateTypes` | `src/lib/coordinates/types.ts` |
| `CoordinateValidator` | `src/lib/coordinates/validate.ts` |
| `DmsToDdConverter` | `src/lib/coordinates/dms-to-dd.ts` |
| `DdToDmsConverter` | `src/lib/coordinates/dd-to-dms.ts` |
| `MapService` | `src/lib/ol/map-service.ts` |
| `MapWorkspace` | `src/components/map/MapWorkspace.tsx` |
| `ConversionPanel` | `src/components/map/ConversionPanel.tsx` |
| `FloatingButton` | `src/components/map/FloatingButton.tsx` |
