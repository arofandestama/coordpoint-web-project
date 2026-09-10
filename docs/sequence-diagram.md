# Sequence Diagram — CoordPoint

Alur (life cycle) proses konversi koordinat dari interaksi pengguna hingga
marker muncul di peta OpenLayers. Diagram ini juga dirender pada landing page
(bagian **Dokumentasi**).

## Skenario: Konversi DMS → DD lalu Add To Maps

```mermaid
sequenceDiagram
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
    end
```

## Penjelasan Tahapan

1. **Buka panel** — pengguna menekan floating button; `MapWorkspace` merender `ConversionPanel`.
2. **Input** — pengguna mengisi derajat/menit/detik dan memilih arah (N/S untuk latitude, E/W untuk longitude), atau memilih tab **DD to DMS** dan memasukkan derajat desimal.
3. **Validasi** — `assertValidDms` / `assertValidDd` memastikan rentang angka (latitude 0–90°, longitude 0–180°, menit & detik 0–59). Kegagalan melempar `CoordinateValidationError` yang ditampilkan sebagai pesan error inline.
4. **Konversi & format** — `dmsToDd` menghasilkan decimal degrees (S/W bernilai negatif), `formatDd` membungkusnya dengan arah (`49.50278° N`). Sebaliknya `ddToDms` + `formatDms` menghasilkan `49°30'10.01" N`.
5. **Add To Maps** — `MapService.addMarker()` menambahkan Feature + Icon pada vector layer, `flyTo()` menganimasikan `view.animate()` sehingga peta berpusat pada marker baru, dan `pulseAt()` menampilkan animasi ping singkat.
