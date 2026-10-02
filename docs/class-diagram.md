# Class Diagram — CoordPoint

Rencana relasi class/function untuk studi kasus konversi koordinat DMS ⇄ DD.
Diagram ini juga dirender langsung pada landing page (bagian **Dokumentasi**) dan
disimpan sebagai sumber mermaid di `src/constants/diagrams.constants.ts`.

## Diagram

![Class Diagram — CoordPoint](images/class-diagram.png)

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
| `CoordinateTypes` | `src/types/coordinate.types.ts` |
| `CoordinateValidator` | `src/utils/coordinates/validate.ts` |
| `DmsToDdConverter` | `src/utils/coordinates/dmsToDd.ts` |
| `DdToDmsConverter` | `src/utils/coordinates/ddToDms.ts` |
| `MapService` | `src/common/mapService.ts` |
| `MapWorkspace` | `src/components/map/MapWorkspace.tsx` |
| `ConversionPanel` | `src/components/map/ConversionPanel.tsx` |
| `FloatingButton` | `src/components/map/FloatingButton.tsx` |
