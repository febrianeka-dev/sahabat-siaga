# Sumber dan izin foto — Belajar Siaga

Sebanyak **10 foto dokumentasi nyata** digunakan untuk mendampingi lima jenis bahaya gunung api pada laman **Belajar Siaga** (dua foto per kategori). Masing-masing berasal dari halaman multimedia **U.S. Geological Survey (USGS)** yang secara eksplisit menyatakan **“Sources/Usage: Public Domain.”** Foto dipakai untuk tujuan edukasi, dengan kredit fotografer/lembaga dan tautan sumber asli di bawah setiap foto.

**Penting:** Seluruh foto ini menggambarkan kejadian atau fenomena dari gunung api **selain Semeru**. Foto tidak boleh diklaim sebagai dokumentasi kejadian di Desa Sumberwuluh, Semeru, atau Indonesia. Kondisi, proses, dan besarnya bahaya berbeda-beda menurut gunung serta kejadiannya.

| Kategori | File aset web | Dokumentasi | Kredit | Sumber asli dan pernyataan izin |
| --- | --- | --- | --- | --- |
| Awan panas / arus piroklastik | `apg-st-helens-aug-1980.webp` | Erupsi Gunung St. Helens, 7 Agustus 1980 | Peter W. Lipman / USGS | [USGS — Pyroclastic flow, Aug 7](https://www.usgs.gov/media/images/pyroclastic-flow-aug-7-1980-eruption-stretches-moun) |
| Awan panas / arus piroklastik | `apg-st-helens-may-1980.webp` | Erupsi Gunung St. Helens, 18 Mei 1980 | J. G. Rosenbaum / USGS | [USGS — May 18, 1980 eruption](https://www.usgs.gov/media/images/may-18-1980-eruption-mount-st-helens) |
| Lahar | `lahar-muddy-river-1980.webp` | Tanda tinggi endapan lahar di Muddy River setelah erupsi St. Helens 1980 | Cascades Volcano Observatory / USGS | [USGS — Lahar](https://www.usgs.gov/media/images/lahar) |
| Lahar | `lahar-toutle-bridge-1980.webp` | Jembatan rusak akibat lahar di North Fork Toutle River, St. Helens, 1980 | Richard Waitt / USGS | [USGS — Mount St Helens Lahar](https://www.usgs.gov/media/images/mount-st-helens-lahar) |
| Hujan abu | `ash-hilo-2026.webp` | Endapan abu di Hilo akibat erupsi Kīlauea, 10 Maret 2026 | Hawaiian Volcano Observatory / USGS | [USGS — Ashfall in Hilo](https://www.usgs.gov/media/images/march-10-2026-kilauea-episode-43-ashfall-hilo) |
| Hujan abu | `ash-nikiski-2009.webp` | Endapan abu di Nikiski setelah erupsi Redoubt, 28 Maret 2009 | Kristi L. Wallace / USGS | [USGS — Ash fall accumulation](https://www.usgs.gov/media/images/ash-fall-accumulation-redoubt-volcano-nikiski-after-march-28-2009-eruption-plume) |
| Lava dan material pijar | `lava-kilauea-tube.webp` | Aliran lava dari saluran lava di lereng selatan Kīlauea | Jeffrey Judd / USGS | [USGS — Kilauea Lava Flow](https://www.usgs.gov/media/images/kilauea-lava-flow-1) |
| Lava dan material pijar | `lava-kilauea-fissure-2018.webp` | Aliran lava dari Fissure 8, Kīlauea, 14 Juni 2018 | Hawaiian Volcano Observatory / USGS | [USGS — Fissure 8 Cone Building](https://www.usgs.gov/media/images/kilauea-volcano-fissure-8-cone-building) |
| Gas vulkanik | `gas-kilauea-vent-2010.webp` | Asap/uap dari ventilasi vulkanik pada medan lava Kīlauea, 25 Februari 2010 | USGS Volcano Hazards Program | [USGS — Fume from Volcanic Vent](https://www.usgs.gov/media/images/fume-volcanic-vent) |
| Gas vulkanik | `gas-halemaumau-plume.webp` | Kepulan gas dari ventilasi kawah Halemaʻumaʻu, Kīlauea | Tim R. Orr / USGS | [USGS — Halema'uma'u Vent Gas Plume](https://www.usgs.gov/media/images/halemaumau-vent-gas-plume-1) |

## Pengolahan gambar

- Berkas asli diambil dari tautan **Original** di masing-masing halaman USGS.
- Untuk mengurangi konsumsi data warga saat membuka website di ponsel, gambar disimpan lokal pada `dist/assets/hazards/` dalam format **WebP** dan sisi terpanjang dibatasi hingga 900 piksel, tanpa watermark atau elemen menyesatkan.
- Setiap gambar memiliki `alt` deskriptif dan `loading="lazy"` sehingga pemuatan gambar bisa ditunda sampai diperlukan.
- Tidak ada ketergantungan pada hotlink gambar atau server gambar USGS saat pengunjung membuka halaman.

Catatan: Berada di domain publik pada rekaman sumber ini tidak secara otomatis berarti setiap konten/foto dari situs USGS berstatus sama. Periksa kembali halaman sumber bila mengganti foto pada versi berikutnya.

## Ilustrasi dan foto referensi — Desa Bersaudara

| Aset | Keterangan | Pemegang hak/lisensi | Tautan sumber |
| --- | --- | --- | --- |
| `dist/assets/sister-village/sister-village-story-2026.webp` | Kartun konseptual tentang evakuasi inklusif antardesa; **bukan rekaman kejadian atau peta lokasi** | Ilustrasi dibuat dengan alat AI untuk proyek Sahabat Siaga, 2026 | Aset dibuat khusus untuk website ini |
| `dist/assets/sister-village/balerante-2020-giri-wijayanto.jpg` | Foto kegiatan warga dan pelajar di **Desa Balerante, Kemalang, Klaten** pada 2020. **Bukan** foto evakuasi maupun foto desa penyangga Kebondalem Lor | **Giri Wijayanto**, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) (atribusi wajib; lisensi share-alike berlaku bila foto diadaptasi) | [Wikimedia Commons — Nasionalisme di Lereng Merapi](https://commons.wikimedia.org/wiki/File:Nasionalisme_di_Lereng_Merapi.jpg) |

Foto Balerante disimpan sebagai salinan resolusi 960 piksel dari berkas Wikimedia Commons tanpa penyuntingan isi; tampilan `object-fit: cover` dapat memotong tepi foto di dalam kartu responsif. Kredit dan lisensi disertakan langsung pada caption. Foto ini **bukan domain publik tanpa hak cipta**, melainkan berlisensi terbuka yang memperbolehkan penggunaan ulang dengan syarat atribusi dan share-alike. Untuk pasangan Ngargomulyo–Tamanagung, tidak ditemukan foto lokasi spesifik dengan izin penggunaan ulang yang cukup jelas, sehingga kartu menggunakan ilustrasi yang dinyatakan bukan foto.
