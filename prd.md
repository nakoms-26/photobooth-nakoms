# Dokumen Kebutuhan Produk (PRD) - Snapkoms

## 1. Ringkasan Proyek

**Nama:** Snapkoms
**Jenis:** Aplikasi Web (Photobooth Digital)
**Deskripsi:** Snapkoms adalah aplikasi photobooth digital modern berbasis web yang memungkinkan pengguna untuk mengambil foto langsung dari browser mereka, menambahkan bingkai dan stiker yang menyenangkan, lalu mengekspor kenangan mereka sebagai strip foto (PNG) atau bumerang animasi (GIF). Aplikasi ini menampilkan antarmuka Neo-Brutalism/Arcade (mesin dingdong) yang unik dan menarik, dilengkapi dengan efek suara yang imersif.

## 2. Tujuan & Sasaran

- Menyediakan pengalaman photobooth yang mulus tanpa perlu instalasi aplikasi, dapat diakses melalui web browser modern mana pun.
- Memberikan pengalaman pengguna (UX) yang menarik melalui antarmuka bergaya mesin arcade yang digamifikasi dan efek suara retro.
- Memungkinkan pengguna untuk menyesuaikan foto mereka sepenuhnya dengan berbagai bingkai dan stiker yang dapat diseret/diubah ukurannya.
- Mendukung ekspor media modern, khususnya strip foto PNG resolusi tinggi dan GIF animasi yang berulang (looping).

## 3. Target Pengguna

- Pengunjung acara, mahasiswa, dan grup pertemanan yang ingin mengabadikan kenangan singkat dan menyenangkan.
- Pengguna yang menyukai estetika retro, Y2K, atau arcade.
- Penyelenggara acara yang membutuhkan solusi photobooth digital gratis dan mudah diakses.

## 4. Tumpukan Teknologi (Tech Stack)

- **Framework:** Next.js (App Router)
- **Library Utama:** React (v19)
- **Styling:** Tailwind CSS (v4) dengan komponen UI Neo-Brutalism kustom (`neo-box`, `neo-btn`) dan font kustom (`Chillax`, `Geist`).
- **Ikon:** Lucide React
- **Pemrosesan Media:**
  - HTML5 Canvas API (untuk pengambilan foto dan rendering hasil penggabungan).
  - `gifshot` (untuk menghasilkan GIF animasi dari frame yang ditangkap).
- **Efek Visual:** `canvas-confetti` untuk animasi perayaan saat sesi selesai.
- **Audio:** Web Audio API / HTML5 Audio (Pengelola efek suara kustom).

## 5. Fitur Utama & Kebutuhan

### 5.1. Halaman Utama (Status IDLE)

- **Bagian Hero (Hero Section):** Judul yang menarik, deskripsi, dan Tombol Panggilan Bertindak (CTA) yang jelas untuk memulai sesi.
- **Sorotan Fitur:** Gambaran cepat tentang keunggulan (100% Gratis, Ekspor PNG+GIF, Multi-template).
- **Cara Kerja:** Panduan visual 4 langkah (Buka Kamera -> Ambil Foto -> Pilih Frame -> Download).
- **Navigasi Responsif:** Header statis (sticky) dengan branding dan tombol navigasi.

### 5.2. Antarmuka Mesin Arcade

- **Desain Cangkang (Shell Design):** Wadah persisten untuk status aplikasi, dirancang menyerupai mesin arcade retro.
- **Header:** Branding, indikator status "Siap", modal Daftar Harga (menunjukkan bahwa fitur ini gratis), dan modal Bantuan/Instruksi.
- **Kontrol:** Tombol untuk membisukan/membunyikan suara (Mute/Unmute), Tombol Reset Sesi.
- **Footer/Dek:** Instruksi kontekstual berdasarkan status saat ini dan tombol aksi utama (contoh: "Mulai Foto").

### 5.3. Studio Pengambilan Kamera (Camera Capture Studio)

- **Integrasi Webcam:** Meminta izin dan melakukan streaming video dari kamera perangkat pengguna.
- **Pemilihan Tata Letak (Layout):** Pengguna dapat memilih antara mengambil 3 pose atau 4 pose.
- **Sistem Hitung Mundur:** Hitung mundur otomatis 3 detik antara setiap pengambilan foto.
- **Umpan Balik Visual:** Efek kilat (flash) saat memotret dan pratinjau sementara dari foto yang diambil.

### 5.4. Kompositor Bingkai (Frame Compositor)

- **Pemilihan Template:** Pengguna dapat memilih dari berbagai bingkai desain kustom (contoh: retro, minimalis, warna-warni) yang membungkus foto mereka.
- **Integrasi Stiker:** Pengguna dapat memilih stiker (doodle, bintang, hati) dari "Pemilih Stiker" dan menempatkannya pada komposisi foto.
- **Filter (Opsional/Masa Depan):** Penyesuaian warna atau filter retro yang diterapkan pada foto asli.

### 5.5. Studio Hasil & Unduh

- **Ekspor PNG:** Merender kanvas akhir yang dikomposisikan (foto + bingkai + stiker) menjadi gambar PNG resolusi tinggi yang dapat diunduh.
- **Pembuatan GIF:** Memproses foto-foto asli yang diambil menjadi GIF animasi yang berulang menggunakan `gifshot` dan menyediakan tautan unduhan.
- **Perayaan:** Memicu efek confetti setelah mencapai halaman hasil untuk meningkatkan pengalaman bermain.

## 6. Alur Pengguna (User Flow)

1. **Masuk (Entry):** Pengguna mendarat di halaman utama (IDLE) dan membaca tentang aplikasi.
2. **Memulai (Initiation):** Pengguna mengklik "Mulai Foto" (Masukkan Koin). Efek suara diputar.
3. **Persiapan (Setup):** Kabinet arcade muncul. Pengguna memberikan izin kamera dan memilih tata letak (3 atau 4 foto).
4. **Pengambilan Gambar (Capture):** Sistem menghitung mundur dan mengambil foto secara berurutan.
5. **Pengeditan (Editing):** Pengguna diperlihatkan foto mereka. Mereka memilih bingkai dan menambahkan stiker.
6. **Penyelesaian (Finalization):** Pengguna mengklik "Selesai dan Export".
7. **Unduh (Download):** Sistem menghasilkan PNG dan GIF. Confetti meletus. Pengguna mengunduh file mereka dan dapat memilih untuk memulai sesi baru.

## 7. Kebutuhan Non-Fungsional

- **Performa:** Inisialisasi kamera yang cepat dan transisi yang mulus antara status aplikasi tanpa memuat ulang halaman (page reload).
- **Responsivitas:** Antarmuka arcade dan halaman utama harus beradaptasi dengan sempurna pada layar ponsel, tablet, dan desktop.
- **Aksesibilitas:** Kontras yang jelas (dibantu oleh desain neo-brutalism), tipografi yang mudah dibaca, dan elemen interaktif yang intuitif.
- **Privasi:** Semua pengambilan dan pemrosesan foto (pembuatan PNG/GIF) harus terjadi di sisi klien (client-side) di dalam browser. Tidak ada foto yang boleh diunggah ke server eksternal tanpa izin eksplisit.

## 8. Rencana Pengembangan Masa Depan (Backlog)

- Integrasi pengunggahan hasil foto secara *stateless* (tanpa memerlukan database) ke server khusus (`asset.bem-unsoed.com` menggunakan endpoint `upload.php`). Aplikasi akan langsung menerima tautan (link) publik dari respons unggahan untuk keperluan berbagi atau pembuatan kode QR.
- Pembuatan kode QR untuk pengunduhan seluler yang cepat jika dimainkan pada pengaturan kios (kiosk) fisik.
- Konfigurasi tanda air (watermark) kustom untuk acara-acara tertentu.
