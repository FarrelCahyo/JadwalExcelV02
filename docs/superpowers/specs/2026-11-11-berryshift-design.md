# Sheyla (`UsagiBerry UI`) — Design Document

**Tanggal:** 2026-11-11  
**Produk:** Sheyla — Aplikasi Web Jadwal Shift Asisten Klinik Internis-Bedah & Dahlia (Edisi Kawaii Bunny Nurse)  
**Target Pengguna Utama:** Afiz & Rekan Asisten Perawat Klinik Internis-Bedah RS Telogorejo Semarang  
**Target Deployment:** Static Client-Side Web Application (Vercel)

---

## 1. Intent & Tujuan Utama (The Why)

Jadwal asisten perawat di Klinik Spesialis Internis-Bedah RS Telogorejo dibagikan oleh Kepala Unit (`Ns. M. Remy Sevrina, S.Kep`) dalam bentuk file Microsoft Excel (`.xlsx`) dengan tabel yang sangat lebar, rapat, dan memiliki aturan jam masuk bertingkat (catatan di sel tanggal, catatan di kolom hari, dan jam shift induk).

**Sheyla** hadir sebagai aplikasi web statis *mobile-first* yang sangat lucu, feminin, dan menggemaskan (*Kawaii Bunny Nurse & Dreamy Strawberry Milk Wonderland* / `UsagiBerry UI`) yang bekerja dengan sistem **Upload Excel**:
1. Pengguna meng-upload file `.xlsx` jadwal resmi langsung di browser.
2. Begitu di-upload, layar pertama (**Tab 1: Hari Ini Afiz**) langsung menjawab dalam **1 detik tanpa perlu scrolling jauh**:
   - **Siapa dokter yang dipegang Afiz** pada tanggal tersebut (`Hero Doctor Spotlight`).
   - **Status dinas hari itu:** Dinas Reguler Pagi (☀️), Dinas Reguler Sore (🌙), **🍓✨ LEMBUR (2 Slot di hari yang sama)** dengan pemisahan Slot 1 & Slot 2 berdampingan, atau **☁️🍵 Cuti / LP / Libur**.
   - **Jam masuk efektif** yang dihitung otomatis menggunakan **3 Tingkat Prioritas Kolom** beserta lencana penjelas sumber jamnya.
3. Setelah informasi utama Afiz terjawab, pengguna dapat mengeksplorasi fitur sekunder: rincian tugas klinik (`TTV EMR`, `5R1P`, `piket BHP/stock`), mengintip jadwal rekan perawat kelinci lainnya, mencari dokter seluruh klinik harian, mengecek siapa yang Cuti/LP & simulasi tukar slot, serta melihat daftar PIC Bulanan dan pengingat presentasi kasus.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **100% Berbasis Upload Excel di Browser:** Membaca dan mem-parsing file `.xlsx` yang di-upload pengguna secara langsung di sisi klien (*client-side*), mendukung upload 1 file maupun beberapa file sekaligus (misal menggabungkan jadwal Minggu 1 + Minggu 2–5 dalam satu bulan).
- **Persistensi Lokal (`localStorage`):** Menyimpan hasil pembacaan Excel dan simulasi tukar slot di `localStorage` browser HP agar pengguna tidak perlu meng-upload ulang setiap kali membuka halaman, dilengkapi tombol **Upload File Baru / Tambah File** dan **Hapus / Reset Data**.
- **Akurasi Parsing 100% pada Sheet `internis dkk`:** Mendeteksi batas blok slot dari garis *border* sel XML Excel (`xl/styles.xml` + `xl/worksheets/sheet*.xml`) dan menerapkan **3-Tier Time Priority Rule** secara deterministik.
- **Visual `UsagiBerry UI` yang Sangat Menggemaskan:** Mengimplementasikan sistem ilustrasi SVG tematik (**🐰 Bunny Nurse** dengan berbagai ekspresi, **☀️ Sunny Cloud**, **🌙 Dreamy Moon**, **🥛🍓 Strawberry Milk Bottle**, pita, awan bergelombang, dan kilau bintang) sesuai palet warna dan tipografi PRD.

### Non-Goals
- **Tidak Membutuhkan Backend Database / Server Eksternal:** Seluruh pemrosesan dilakukan di browser tanpa server database atau autentikasi login.
- **Tidak Mengubah File Excel Asli di Server:** Simulasi tukar slot bersifat lokal di aplikasi dan dapat di-export/diunduh sebagai rekap Excel/teks, tanpa mengubah file sumber milik Kepala Unit.

### Anti-Goals (Hal yang Harus Dihindari)
- **Jangan Membundel Data Jadwal Hardcoded sebagai Sumber Utama:** Tiga file `.xlsx` di repositori hanya menjadi referensi pengujian struktur; aplikasi yang berjalan menampilkan data dari file `.xlsx` yang di-upload pengguna.
- **Jangan Menimbun Layar Utama dengan Tabel Mentah:** Layar pertama tidak boleh menampilkan tabel grid raksasa yang memaksa Afiz melakukan *zoom/scroll* horizontal untuk mencari namanya.
- **Jangan Menggunakan Tampilan Generik / Kaku:** Hindari tampilan korporat kaku; seluruh kartu, lencana, tombol, dan *empty state* harus mengikuti estetika *Kawaii Bunny Nurse & Dreamy Strawberry Milk*.

---

## 3. Constraints (Batasan Teknis)

- **Target Hosting:** Vercel (Static Output dari Vite).
- **Format Input:** File `.xlsx` standar Microsoft Excel yang memiliki sheet bernama `internis dkk` (pencarian nama sheet dilakukan secara *case-insensitive*, atau otomatis memilih sheet yang relevan jika nama sedikit berbeda).
- **Responsivitas:** Dirancang *mobile-first* (lebar optimal 360px–480px di layar HP dengan navigasi bawah melayang / *floating cloud bottom bar*, namun tetap tampil cantik dan proporsional di layar tablet/desktop).

---

## 4. Approaches Considered & Pemilihan Arsitektur

1. **Pendekatan A — Vite + React + TypeScript + Tailwind CSS + SheetJS & XML Border Parser *(Dipilih)***
   - **Alasan Pemilihan:** Memberikan performa UI paling responsif saat berpindah tanggal, memilih perawat, mencari dokter, dan melakukan simulasi tukar slot. Memudahkan pembuatan komponen ilustrasi SVG `UsagiBerry UI` yang modular serta *deploy* instan ke Vercel.
2. **Pendekatan B — HTML + CSS + Vanilla JS Murni**
   - **Trade-off:** Tanpa *build step*, tetapi pengelolaan *state* kompleks (multi-file merge, simulasi tukar slot, kalender interaktif, dan filter lintas komponen) lebih sulit dirawat.
3. **Pendekatan C — Next.js Full-Stack dengan Cloud DB**
   - **Trade-off:** Terlalu berat (*overkill*) untuk aplikasi jadwal statis berbasis upload file Excel lokal.

---

## 5. Spesifikasi Teknis & Alur Fitur (The How)

### 5.1. Mesin Parser Excel (`internis dkk` Engine)

Karena *SheetJS Community Edition* terkadang tidak mengekspor properti `border` secara lengkap di semua lingkungan, mesin parser menggunakan kombinasi **pembacaan ZIP/XML langsung (`JSZip` / `DecompressionStream` untuk `xl/styles.xml` & sheet XML) + `SheetJS` (`xlsx`)**:

1. **Deteksi Baris Tanggal (Baris 3):**
   - Kolom `A3` = `JAM`, Kolom `B3:G3` = `SENIN` s/d `SABTU`.
   - Kolom `H3` dan seterusnya berisi nomor seri tanggal Excel (contoh `46334` = `2026-11-08`) atau string tanggal.
   - Setiap kolom tanggal dipetakan ke hari dalam seminggu: Senin → Kolom `B`, Selasa → Kolom `C`, Rabu → Kolom `D`, Kamis → Kolom `E`, Jumat → Kolom `F`, Sabtu → Kolom `G`. Kolom hari Minggu tetap disimpan untuk kalender tetapi ditandai sebagai Hari Minggu.

2. **Segmentasi Blok Slot (Baris 4 s/d Baris 100):**
   - Batas setiap blok slot ditentukan dari garis *border* atas (`top border`) pada Kolom `B` atau Kolom `A`, dan garis *border* bawah (`bottom border`) pada Kolom `B` (menghasilkan 28 blok slot standar pada file referensi, misal `(4,5)`, `(6,6)`, `(7,8)`, ..., `(98,98)`, `(99,99)`, `(100,100)`).
   - *Fallback:* Jika file Excel yang di-upload kehilangan format *border*, parser mendeteksi baris yang memiliki daftar nama perawat di kolom tanggal sebagai jangkar tiap slot.
   - **Blok 100 (`EVALUASI BPJS dan Print resume / PIKET 5R1P` — `semua asisten`):** Ditandai sebagai *Tugas Bersama Seluruh Asisten* (tidak dihitung sebagai slot lembur individual agar tidak menyebabkan setiap perawat terdeteksi 2 slot setiap hari).

3. **Ekstraksi Nama Perawat & Catatan Sel Tanggal (Prioritas 1):**
   - Pada setiap blok slot `(r_start..r_end)` dan kolom tanggal `Col`:
     - Sel-sel yang tidak kosong di `(r_start..r_end, Col)` diperiksa.
     - Pola jam di dalam sel tanggal diekstrak dengan regex: `/(?:masuk|msk)?\s*(?:jam|j\.?)\s*(\d{1,2}(?:[.:]\d{2})?)/i` (contoh: `Rina A jam 8` → Nama: `Rina A`, Jam Prio 1: `08.00`; sel terpisah `jam 8` di `Y8` atau `jam 6` di `N17` → Jam Prio 1 untuk slot tersebut pada tanggal itu; catatan pra-tugas seperti `MCU`, `dr.Neni dl`, `TLJ dl`, `latihan lomba` disimpan sebagai *catatan khusus tanggal*).
     - Nama perawat dinormalisasi (contoh: `Adelin a` → `Adelina`, `Siti ANifah` → `Siti Anifah`, `Novica` → `Novisa` tetap dikenali dengan pencocokan nama yang toleran).

4. **Ekstraksi Dokter, Tugas Klinik & Jam Kolom Hari (Prioritas 2):**
   - Pada blok slot `(r_start..r_end)` dan kolom hari yang sesuai (`B`..`G`):
     - Semua teks sel digabungkan dan dipecah menjadi segmen token.
     - **Jam Prioritas 2:** Segmen yang cocok dengan pola `/(?:masuk|msk|ajm)\s*(?:jam|j\.?)?\s*(\d{1,2}(?:[.:]\d{2})?)|(?:^|\s)(?:jam|j\.?)\s*(\d{1,2}(?:[.:]\d{2})?)/i` (termasuk typo di Excel asli seperti `masuk ajm 13` atau `masuk 10`) diekstrak sebagai **Jam Masuk Prioritas 2**.
     - **Daftar Dokter (`doctors`):** Segmen yang mengandung `dr.`, `drg.`, `drr.`, `Prof.` (termasuk keterangan seperti `lanjutkan dr.Dadang sore` atau `siapkan dr.Hirlan`) diekstrak sebagai daftar dokter pada slot tersebut, lengkap dengan badge lokasi bila ada (`C+D`, `C`, `D`, `Dahlia`, `9-17`, `sore`, `siang`).
     - **Daftar Tugas Pendamping (`tasks`):** Segmen operasional lainnya (`TTV EMR internis BEDAH`, `5R1P`, `piket BHP bedah`, `piket stock bedah`, `ceklist suhu inter`, `rekap edukasi`, `Duta CS`, `KOORDINATOR FAMILY CARE PAGI/SIANG`, `PIC BPJS cluster & STOCK`, `SECA`, `uroflo`, dll.) disimpan sebagai rincian tugas klinik.

5. **Ekstraksi Jam Shift Induk (Prioritas 3):**
   - Diambil dari Kolom `A` yang di-*merge* atau diwariskan dari baris atasnya (`Jam 7` → `07.00`, `Jam 8` → `08.00`, `j 9` → `09.00`, `J.10` → `10.00`, `14.00` → `14.00`, `07.14` → `07.00–14.00`, `14.21` → `14.00–21.00`).

6. **Penentuan Status Harian & Deteksi Lembur (2 Slot):**
   - Untuk setiap perawat pada suatu tanggal:
     - **Cuti / LP:** Diperiksa dari baris bawah (`Baris 101–104`) pada kolom tanggal tersebut (contoh `Afiz cuti`, `Endang LP`, `Maria cuti baptis`).
     - **Jumlah Slot Aktif (di luar baris `semua asisten`):**
       - `0 slot` + tercatat Cuti/LP → Status **☁️🍵 Cuti / LP**.
       - `0 slot` tanpa catatan Cuti/LP → Status **☁️🍵 Libur / Off Tidak Terplot**.
       - `1 slot` → Status **☀️ Dinas Reguler Pagi** (jika jam masuk efektif `< 11.00`) atau **🌙 Dinas Reguler Siang/Sore** (jika jam masuk efektif `>= 11.00`).
       - `>= 2 slot` → Status **🍓✨ LEMBUR (2 Slot)**! Slot diurutkan berdasarkan jam masuk efektif (Slot 1 Pagi & Slot 2 Sore/Lembur).

7. **Ekstraksi Catatan Bawah, Pengingat & PIC Bulanan (Baris 101–125):**
   - Mengekstrak informasi pengingat (`Selasa dan Rabu: Presentasi kasus siap j.12`), catatan handover alkes/obat, serta tabel **PIC Bulanan Internis & Dahlia** (`Laporan Bulanan`, `Stock Opname`, `Inventaris/K3`, `Ceklist Suhu`) beserta nama Kepala Unit.

8. **Penggabungan Multi-File Upload:**
   - Jika pengguna meng-upload lebih dari 1 file (misal `NOVEMBER MG 1 2026.xlsx` lalu `NOVEMBER 2026.xlsx`), data digabungkan per tanggal (`YYYY-MM-DD`). Jika ada tanggal yang beririsan (misal 8 Nov ada di kedua file), data dari file yang mencakup tanggal lebih lengkap/terbaru mengambil alih secara mulus.

---

### 5.2. Desain Antarmuka & Pengalaman Pengguna (`UsagiBerry UI`)

1. **Layar Sambutan Upload (Saat Belum Ada Data Excel):**
   - Ilustrasi besar **🐰🍓 Bunny Nurse Afiz** memegang botol susu stroberi di atas awan empuk.
   - Area *Drag & Drop / Pilih File Excel (`.xlsx`)* berbentuk kartu awan bergelombang dengan pita pink (`🎀`).
   - Mendukung pemilihan satu atau beberapa file `.xlsx` sekaligus, menampilkan animasi loading gelembung susu stroberi saat mem-parsing, lalu langsung membuka jadwal.

2. **Header Langit Susu Stroberi (Selalu Tampil di Atas):**
   - Maskot **🐰 Bunny Nurse** dengan topi suster berlogo stroberi, judul **Sheyla**, badge nama file Excel yang sedang aktif, tombol cepat **📂 Upload / Tambah Excel**, serta pemilih **Perawat Aktif** (default: **👑🐰 Afiz**, namun bisa diganti ke rekan perawat kelinci lain dengan 1 tap).

3. **🐰🍓 Tab 1 — Hari Ini Afiz (Layar Utama / Default):**
   - **Pemilih Tanggal Cepat (Horizontal Cloud Date Strip):** Deretan kapsul tanggal seluruh bulan yang menampilkan ikon status mini di setiap tanggal (`☀️` Pagi, `🌙` Sore, `🍓✨` Lembur 2 Slot dengan badge berkilau, `🍵` Cuti/Off), tombol cepat `Hari Ini`, `Besok`, dan filter loncat ke **Hari Lembur Afiz Saja (🍓✨)**.
   - **Kartu Utama (`Hero Doctor Spotlight Card`):**
     - Bingkai awan putih (`#FFFFFF`) bertepi `#FBCFE8` dengan hiasan pita pink di bagian atas.
     - **Lencana Status Dinas & Jam Masuk Efektif** berukuran besar di bagian atas kartu, lengkap dengan *pill* keterangan asal jam (contoh: `✨ Prioritas 1: Catatan Sel Tanggal "jam 8"`, `📋 Prioritas 2: Kolom Hari "msk j.9"`, atau `🕒 Prioritas 3: Shift Induk "Jam 7"`).
     - **Jika Dinas Reguler (1 Slot):** Menampilkan daftar dokter yang dipegang dengan tipografi `Quicksand Bold` berukuran besar dan kontras tinggi (`#4A1525`), badge ruang/lokasi (`C+D`, `9-17`, dll.), serta catatan pra-tugas bila ada (`MCU`, `dr. Neni dl`).
     - **Jika 🍓✨ LEMBUR (2 Slot):** Menampilkan **Banner Berkilau Double Berry Milk ("🍓✨ HARI INI AFIZ LEMBUR 2 SLOT!")** dan membagi kartu utama menjadi 2 panel berdampingan/bertumpuk jelas: **☀️ Slot 1 (Pagi — Jam & Dokter)** dan **🌙 Slot 2 (Sore/Lembur — Jam & Dokter)**.
     - **Jika ☁️🍵 Cuti / Libur:** Menampilkan ilustrasi Bunny Nurse tidur di atas awan matcha beserta keterangan cuti/LP dari baris bawah Excel.
   - **Bagian Sekunder di Bawah Kartu Utama:**
     - **Rincian Tugas Operasional Klinik:** Kartu checklist manis untuk tugas pendamping slot (`TTV EMR internis BEDAH`, `5R1P`, `piket stock bedah`, dll.) + pengingat *Presentasi Kasus Siap Jam 12.00* khusus jika hari yang dipilih adalah **Selasa atau Rabu**.
     - **Kalender Bulanan Visual Afiz:** Grid kalender sebulan penuh dengan kode warna pastel (Kuning Matahari, Lavender Bulan, Pink Stroberi Lembur, Mint Matcha Cuti).
     - **Deretan Perawat Kelinci Lainnya (`Bunny Nurse Chips`):** Barisan avatar kelinci untuk mengintip jadwal teman (`Lulut`, `Nabila`, `Firda`, `Endang`, `Dewi S`, `Suci P`, `Ovylia`, `Adung`, `Adelina`, `Novisa`, `Mirada`, `Naela`, `Nurul U`, `Dwi Ulfa`, `Latifah`, `Rina A`, `Dian SL`, `Mega`, `Lita`, dll.).

4. **🩺☁️ Tab 2 — Cek Dokter Lain (Direktori Klinik Harian):**
   - Kolom pencarian instan nama dokter (misal ketik `Darmono`, `Indra`, `Dadang`, `Yeffry`) pada tanggal terpilih.
   - Menampilkan kartu seluruh dokter yang praktik hari itu beserta **🐰 Perawat Kelinci** yang bertugas mendampingi, jam masuk efektif asistennya, dan tugas pendamping di slot tersebut.

5. **🌙🍵 Tab 3 — Cek Cuti, LP & Simulasi Tukar Slot:**
   - **Daftar Teman Cuti / LP / Tidak Terplot Hari Ini:** Memudahkan Afiz melihat siapa teman yang sedang Cuti, LP, atau tidak terplot pada tanggal tersebut.
   - **Simulasi Tukar Slot Interaktif:** Pengguna dapat memilih tanggal, memilih Slot Afiz (atau perawat A) dan menukarnya sementara dengan perawat B. Perubahan simulasi langsung ditandai dengan badge `🔄 Simulasi Tukar`, tersimpan di `localStorage`, dapat dibatalkan kapan saja, dan dapat disalin sebagai pesan WhatsApp siap kirim ke teman/koordinator.

6. **🥛📂 Tab 4 — Upload Excel & PIC Bulanan:**
   - Panel pengelolaan file Excel (upload file `.xlsx` baru, gabungkan beberapa file mingguan/bulanan, lihat daftar file yang sudah dimuat, export/unduh rekap jadwal Afiz ke CSV/Excel, atau hapus data tersimpan).
   - Kartu **Daftar PIC Bulanan Internis & Dahlia** (`Laporan Bulanan`, `Stock Opname`, `Inventaris/K3`, `Ceklist Suhu`) dan catatan pengingat resmi dari Kepala Unit (`Ns. M. Remy Sevrina, S.Kep`).

---

## 6. What's Left to the Builder (Keputusan Implementasi Builder)

- Detail animasi mikro CSS (`floating clouds`, `twinkling stars`, `strawberry milk bubble transitions`) selama tetap ringan (60fps di HP) dan tidak mengganggu keterbacaan nama dokter.
- Tata letak responsif antara layar sempit (<400px) dan layar desktop (menampilkan panel berdampingan di layar lebar).
- Format teks ringkasan *Copy to WhatsApp* untuk berbagi jadwal harian Afiz atau pengajuan simulasi tukar slot.

