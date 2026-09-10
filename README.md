# CoordPoint — Konversi Koordinat DMS ⇄ DD & Peta Geodesi

Aplikasi web modern berbasis **Next.js 16 (React 19) + TypeScript + OpenLayers** untuk melakukan konversi presisi tinggi dari koordinat **DMS (Degree, Minutes, Seconds)** ke **DD (Decimal Degrees)** dan sebaliknya, dilengkapi visualisasi peta OpenStreetMap, 3D modelling bumi interaktif, unit test Jest 100% lulus, dan standar dokumentasi JSDoc.

---

## ⚡ 1. VERSI RINGKAS (QUICK START GUIDE)

Petunjuk praktis untuk pengguna yang ingin langsung mencoba aplikasi dan pengujian:

* **1. Clone & Masuk Folder**: `git clone <repo-url> && cd coordpoint`
* **2. Install Dependencies**: `npm install` (atau `bun install`)
* **3. Jalankan Dev Server**: `npm run dev` → Akses `http://localhost:3000`
* **4. Jalankan Unit Test (Jest)**: `npm test` (40/40 test case lulus)
* **5. Jalankan Type Check & Lint**: `npx tsc --noEmit` & `npx eslint .`
* **6. Build Produksi**: `npx next build`

---

## 📖 2. PANDUAN LENGKAP & DETAIL

---

### 📋 Prasyarat Sistem

Sebelum memulai instalasi, pastikan lingkungan sistem Anda memenuhi spesifikasi berikut:

* **Node.js**: `v18.17.0` atau versi lebih baru (Direkomendasikan Node.js LTS `v20.x`).
* **Package Manager**: `npm` (`v9.x` atau lebih baru) atau `bun` (`v1.1.x`).
* **Git**: `v2.x` untuk melakukan pengklonaan repositori.
* **Browser**: Browser modern yang mendukung WebGL 2.0 (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari).

---

### 📦 Langkah Instalasi & Pengoperasian

#### 1. Kloning Repositori
Buka terminal shell dan jalankan perintah:
```bash
git clone https://github.com/arofandestama/coordpoint-web.git
cd coordpoint
```

#### 2. Instalasi Dependensi
Instal seluruh modul dependensi yang dibutuhkan:
```bash
npm install
```

#### 3. Menjalankan Server Pengkodingan (Development Server)
Jalankan server lokal Next.js dengan perintah:
```bash
npm run dev
```
Buka browser Anda dan navigasikan ke `http://localhost:3000`.

---

### 🧪 Panduan Lengkap Pengujian (Unit Testing)

Aplikasi CoordPoint dilengkapi dengan pengujian unit komprehensif menggunakan **Jest 30** dan **React Testing Library** yang mencakup 40 kasus uji matematis geodesi.

#### Menjalankan Test Suite
Untuk mengeksekusi pengujian otomatis, jalankan:
```bash
npm test
```

#### Menjalankan Mode Pantau (Watch Mode)
Untuk pengkodingan interaktif dan mengeksekusi tes setiap kali ada perubahan berkas:
```bash
npm run test:watch
```

#### Hasil Pengujian yang Diharapkan
```text
PASS src/__tests__/dd-to-dms.test.ts
PASS src/__tests__/format.test.ts
PASS src/__tests__/dms-to-dd.test.ts
PASS src/__tests__/roundtrip.test.ts

Test Suites: 4 passed, 4 total
Tests:       40 passed, 40 total
Snapshots:   0 total
Time:        0.727 s
```

#### Rincian Cakupan Berkas Pengujian (`src/__tests__/`)

| Berkas Pengujian | Fungsi Utama | Kasus Uji (Test Cases) |
| :--- | :--- | :--- |
| `dms-to-dd.test.ts` | Transformasi DMS ke Decimal Degrees | Pengujian arah N/S/E/W, batas max lat ±90° & lon ±180°, serta penanganan throw error validasi. |
| `dd-to-dms.test.ts` | Transformasi Decimal Degrees ke DMS | Pengujian perataan detik, carry-over 60" ke menit dan derajat, serta penanganan nilai negatif. |
| `format.test.ts` | Standar Format Output | Pengujian keluaran teks human-readable seperti `49.50278° N` dan `49°30'10.01" N`. |
| `roundtrip.test.ts` | Invariansi Matematis (Round-trip) | Pengujian bahwa `dmsToDd(ddToDms(x))` mengembalikan koordinat `x` yang presisi tanpa distorsi. |

---

### 📏 Standar Clean Code & JSDoc Documentation

Aplikasi ini menggunakan standar penulisan **Clean Code TypeScript React** dan dokumentasi **JSDoc resmi** ([https://jsdoc.app/about-getting-started](https://jsdoc.app/about-getting-started)):

* **JSDoc Annotations**: Seluruh fungsi dan komponen menggunakan tag `@module`, `@function`, `@component`, `@param`, `@returns`, `@throws`, dan `@example`.
* **ESLint Compliance**: Bebas dari tipe `any`, mematuhi aturan strict mode React, dan lulus pengujian `npx eslint .`.
* **Desain Tampilan**: Scrollbar disembunyikan secara bersih di seluruh browser (`::-webkit-scrollbar { display: none; }`) tanpa mengganggu fungsi scroll.

---

### 🚀 Best Practices Optimasi Performa 3D WebGL (Earth Modeling)

Untuk memastikan pengolahan grafik 3D di browser berjalan sangat cepat tanpa mengalami **Input Delay** (~453ms):

1. **Kompresi Asset 3D (`.glb`)**:
   - Model `earth.glb` berukuran **58.5 MB** dapat dikompresi menggunakan **Draco Mesh Compression** (`gltf-pipeline -i earth.glb -o earth-draco.glb -d`) untuk mengurangi ukuran berkas hingga >90% (< 3 MB).
2. **Pengurangan Draw Calls**:
   - Menghapus elemen dekorasi berat di sekitar globe (misal orbit torus & starfield vertex) sehingga komponen Three.js hanya menjalankan **1 single draw call** yang sangat ringan.
3. **React Memoization**:
   - Membungkus komponen canvas 3D dengan `React.memo` agar Three.js tidak melakukan re-render ulang saat state komponen induk (Landing Page) berubah.
4. **Optimasi Frame Loop & DPR**:
   - Membatasi Device Pixel Ratio ke `dpr={[1, 1.5]}` dan menggunakan opsi WebGL `powerPreference: 'high-performance'` untuk menjamin rotasi 60 FPS pada layar retina.
5. **Non-blocking Event Listener**:
   - Menggunakan `requestAnimationFrame` dan membaca properti `clientWidth`/`clientHeight` sebagai pengganti `getBoundingClientRect()` pada listener `onMouseMove` untuk mencegah *forced synchronous reflow*.

---

### 🛠️ Perintah Utama (Summary Commands)

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan development server pada `http://localhost:3000` |
| `npm test` | Menjalankan 40 unit test Jest |
| `npm run test:watch` | Menjalankan Jest dalam mode interaktif (watch mode) |
| `npx tsc --noEmit` | Pengecekan validasi tipe TypeScript |
| `npx eslint .` | Pengecekan standar clean code ESLint |
| `npx next build` | Kompilasi build produksi Next.js |


---

## 📂 Struktur Folder

```
coordpoint/
├── docs/
│   ├── class-diagram.md          # Class diagram (Mermaid) + penjelasan relasi
│   └── sequence-diagram.md       # Sequence diagram (Mermaid) alur aplikasi
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout (font, metadata, Toaster)
│   │   ├── page.tsx              # Entry: LandingPage ⇄ MapWorkspace
│   │   └── globals.css           # Tailwind 4 + theme + utilitas scrollbar
│   ├── components/
│   │   ├── docs/
│   │   │   └── MermaidDiagram.tsx  # Renderer Mermaid (lazy import)
│   │   ├── landing/
│   │   │   └── LandingPage.tsx     # Landing page (hero, fitur, dokumentasi)
│   │   ├── map/                    # Komponen aplikasi peta (reusable)
│   │   │   ├── MapWorkspace.tsx    # Shell aplikasi: header + peta + panel
│   │   │   ├── MapCanvas.tsx       # Container render OpenLayers
│   │   │   ├── ConversionPanel.tsx # Form konversi DMS⇄DD + Add To Maps
│   │   │   └── FloatingButton.tsx  # Tombol mengambang pembuka panel
│   │   └── ui/                     # Komponen shadcn/ui
│   ├── lib/
│   │   ├── coordinates/            # ⭐ Library konversi murni (testable)
│   │   │   ├── types.ts            #   Tipe & CoordinateValidationError
│   │   │   ├── validate.ts         #   assertValidDms / assertValidDd
│   │   │   ├── dms-to-dd.ts        #   dmsToDd / formatDd
│   │   │   ├── dd-to-dms.ts        #   ddToDms / formatDms
│   │   │   └── index.ts            #   Barrel export
│   │   ├── docs/
│   │   │   └── diagrams.ts         # Sumber Mermaid untuk landing page
│   │   └── ol/
│   │       └── map-service.ts      # MapService (jembatan React ↔ OpenLayers)
│   └── __tests__/                  # Unit test Jest
├── jest.config.ts
└── README.md
```

Komponen dipisah per-tanggung-jawab (**reusable & mudah dibaca**):
library konversi sengaja *pure* (tanpa React/DOM) agar mudah diuji,
sedangkan seluruh interaksi OpenLayers dibungkus satu class `MapService`.

---

## 📐 Dokumentasi Perancangan

Dokumentasi perancangan melengkapi activity diagram & component diagram yang
sudah ada dengan **class diagram** dan **sequence diagram**:

- [`docs/class-diagram.md`](docs/class-diagram.md) — relasi class/function
- [`docs/sequence-diagram.md`](docs/sequence-diagram.md) — life cycle proses konversi → Add To Maps

Keduanya juga dirender interaktif pada landing page, bagian **Dokumentasi**.

### Class Diagram (ringkas)

```mermaid
classDiagram
    direction LR
    class CoordinateValidator {
        <<module>>
        +assertValidDms(dms, axis) void
        +assertValidDd(dd, axis) void
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
        +createMap(target) ol_Map
        +addMarker(lonLat) void
        +flyTo(lonLat, zoom) void
    }
    class ConversionPanel {
        <<component>>
        +onAddToMap(payload) void
    }
    DmsToDdConverter --> CoordinateValidator: validates input
    DdToDmsConverter --> CoordinateValidator: validates input
    ConversionPanel ..> DmsToDdConverter: DMS to DD tab
    ConversionPanel ..> DdToDmsConverter: DD to DMS tab
    ConversionPanel --> MapService: requests via onAddToMap
```

---

## 🧭 Cara Menggunakan Aplikasi

1. Dari landing page, tekan **Buka Peta**.
2. Peta OpenStreetMap terbuka dengan tombol mengambang biru di kanan atas
   (tepat di bawah readout koordinat).
3. Tekan tombol tersebut → panel **Konversi Koordinat** muncul.
4. Pilih tab:
   - **DMS to DD** → isi Derajat/Menit/Detik + arah N/S & E/W → **Konversi ke DD**.
   - **DD to DMS** → isi derajat desimal (negatif = S/W) → **Konversi ke DMS**.
5. Hasil ditampilkan dengan satuan arah, mis. `49.50278° N` atau `49°30'10.01" N`.
6. Tekan **Add To Maps** → marker muncul dan peta berpusat ke titik tersebut.

---

## 🧹 Clean Code

- **TypeScript strict** — tanpa `any`, tipe eksplisit untuk semua API publik.
- **JSDoc** — seluruh fungsi library & service terdokumentasi (`@param`, `@returns`, `@throws`, `@example`).
- **ESLint** — `npm run lint` bersih tanpa error/warning.
- **Pure functions** — library konversi tidak bergantung React/DOM sehingga 100% ter-cover unit test.
- **Komponen kecil & fokus** — satu tanggung jawab per komponen (`MapCanvas`, `FloatingButton`, `ConversionPanel`).

---

## 📄 Lisensi

Data peta © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
