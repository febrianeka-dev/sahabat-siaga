# Sahabat Siaga — prototipe UI/UX V1

Prototipe edukasi kesiapsiagaan erupsi Semeru dan konsep *Sister Village* Sumberwuluh–Jarit, dirancang untuk dapat dipelajari bersama anak-anak, ibu hamil, lansia, penyandang disabilitas, dan keluarga.

## Status

**Hanya prototipe edukasi, bukan sistem peringatan dini, panduan navigasi evakuasi, atau rute operasional resmi.** Materi perlu diperiksa oleh ahli dan pemerintah desa/BPBD sebelum digunakan untuk pengambilan keputusan keselamatan.

## Halaman

1. **Beranda:** pengantar, 3 langkah siaga, dan akses cepat.
2. **Belajar Siaga:** penjelasan bahaya, checklist tas siaga, tahapan mengungsi.
   Setiap jenis bahaya dilengkapi dua foto dokumentasi asli dari USGS (10 foto total), dengan kredit dan tautan ke pernyataan **Public Domain** pada halaman sumber. Contoh foto berasal dari gunung api lain, **bukan** dokumentasi Semeru. Rincian sumber ada di [`PHOTO_CREDITS.md`](PHOTO_CREDITS.md).
   Instruksi keselamatan kini ditampilkan sebagai dua kartu ilustratif **DO / DON'T**, menggunakan pictogram, kalimat pendek, dan simbol centang/silang agar mudah dipelajari anak bersama pendamping. Teks panduan asli tetap tersedia sebagai fallback tanpa JavaScript.
3. **Pojok Anak:** flipcard, mini-kuis dengan umpan balik, permainan memilih barang tas siaga.
4. **Peta Edukasi:** Leaflet.js menampilkan koridor jalan hasil interpretasi peta penelitian, titik kumpul Sumberwuluh, calon shelter Jarit, dan informasi KRB. **Bukan peta navigasi atau rekomendasi evakuasi resmi**; geometri masih memerlukan validasi lapangan dan instansi berwenang.
5. **Desa Bersaudara:** konsep, mekanisme kerja, manfaat, ilustrasi edukatif, dan contoh pasangan desa lain.
6. **Data Penelitian:** ringkasan agregat, data fasilitas, dan evaluasi kesiapan yang dapat diunduh publik.
7. **Panduan Khusus:** prinsip pendampingan sesuai kebutuhan ibu hamil, anak-anak, lansia, dan penyandang disabilitas.

## Pilihan UI/UX

- **Mobile-first**, tombol besar, navigasi sederhana.
- Palet hijau hutan `#21483D`, krem `#FFFCF5`, dan jingga `#E89054`.
- Teks sederhana dalam bahasa Indonesia, heading yang jelas, pemberitahuan status data.
- Kontrol perbesar teks dan kontras; flipcard dan permainan dapat dioperasikan melalui tombol keyboard.
- Tidak ada akun, pelacakan lokasi, atau pengumpulan data pribadi. Checklist disimpan lokal di browser.
- Tombol pembacaan suara per topik, termasuk bahaya gunung api, tas siaga, langkah evakuasi, dan panduan kelompok rentan. Menggunakan pembaca teks bawaan browser bila tersedia, dengan kontrol jeda/lanjut/berhenti dan kecepatan.

## Teknologi dan pengembangan

Seluruh website adalah HTML, CSS, dan JavaScript statis dalam `dist/`, tanpa backend. Leaflet.js dan peta dasar OpenStreetMap digunakan dengan atribusi. Untuk pemakaian tanpa jaringan, materi tekstual dapat dipelajari dari berkas lokal; peta tile daring belum disiapkan offline. Jangan melakukan prefetch tile dari server publik OpenStreetMap.

Pratinjau lokal:

```bash
python -m http.server 8000 --directory dist
```

Lalu buka `http://localhost:8000`.

### Deploy ke GitHub Pages

Pindahkan sumber proyek ini ke repository GitHub milikmu. Di **Settings → Pages**, pilih **GitHub Actions** sebagai sumber publikasi. Workflow `.github/workflows/pages.yml` menerbitkan konten `dist/` setiap push ke `main`. Project URL biasanya berbentuk `https://USERNAME.github.io/NAMA-REPO/`.

## Data GIS untuk fase berikutnya

Ekspor dataset QGIS/ArcGIS ke GeoJSON berkoordinat WGS84 (EPSG:4326) untuk ditampilkan di Leaflet:

| Layer | Geometri | Atribut minimum |
| --- | --- | --- |
| Titik kumpul | Point | `id`, `nama`, `status_verifikasi`, `sumber`, `tanggal_verifikasi` |
| Calon shelter | Point | Kolom di atas + `aksesibilitas`, `fasilitas`, `kapasitas_terverifikasi` |
| Jalur evakuasi | LineString | Kolom umum + `otoritas_penetap`, `kondisi_terkini`, `catatan` |
| KRB Semeru | Polygon/MultiPolygon | `kelas_krb`, `tahun_peta`, `instansi_penerbit` |

Jangan mempublikasikan koordinat rumah, identitas personal kelompok rentan, atau data pribadi lainnya dalam repository publik.

## Referensi awal

- BNPB, Buku Saku Tanggap Tangkas Tangguh Menghadapi Bencana
- PVMBG / MAGMA Indonesia
- Kementerian Kesehatan, pedoman penanganan kelompok rentan dalam bencana
- W3C, WCAG 2.2
- Leaflet.js dan OpenStreetMap

