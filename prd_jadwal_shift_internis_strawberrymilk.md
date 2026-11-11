# Product Requirements Document (PRD): Sheyla — Aplikasi Jadwal Shift Asisten Internis-Bedah (Edisi Kawaii Bunny Nurse)

**Nama Produk:** Sheyla (Jadwal Shift Asisten Klinik Internis-Bedah & Dahlia)  
**Target Lokasi / Instansi:** Klinik Spesialis Internis-Bedah, Dahlia, MCU & Family Care — RS Telogorejo Semarang  
**Arsitektur & Hosting:** Static Client-Side Web Application (Vercel)  
**Tema Visual & Design System:** *Kawaii Bunny Nurse & Dreamy Strawberry Milk Wonderland* (`UsagiBerry UI` — Kelinci Perawat, Awan, Bintang, Bulan, Matahari & Susu Stroberi)  
**Fokus Pengguna & Tujuan Utama:** **Afiz** — Mengecek secara instan *"Hari ini (atau tanggal tertentu) Afiz dokternya siapa, masuk jam berapa, dan Lembur (2 Slot) atau tidak"*, baru diikuti fitur cek-cek lainnya.

## 1. Visi Produk & Hierarki Prioritas UX (Core User Journey)

Jadwal asisten perawat di Klinik Internis-Bedah RS Telogorejo berasal dari file Microsoft Excel resmi Kepala Unit General & Clinic Spesialis (`Ns. M. Remy Sevrina, S.Kep`). Karena tabel Excel aslinya sangat rapat dan memanjang, aplikasi web statis **Sheyla** menyederhanakan pengalaman pengguna ke dalam **2 Lapisan Hierarki Prioritas**:

### 1.1. Prioritas Utama (Layar Pertama / Hero Focus: "Afiz Hari Ini Dokternya Siapa & Lembur Tidak?")

Begitu aplikasi dibuka di HP (atau saat memilih tanggal tertentu di kalender), mata pengguna langsung disambut oleh **Kartu Utama Bunny Nurse Afiz** yang menjawab 3 hal paling penting dalam 1 detik tanpa perlu *scrolling* jauh:

1. **Siapa Dokter yang Dipegang Afiz pada Tanggal Tersebut (`Hero Doctor Spotlight`):**
   * Nama dokter ditampilkan paling besar, tebal, dan menonjol di dalam kartu berpita lucu (contoh pada Rabu, 11 Nov 2026: **`🩺 dr. Dadang Sp.OT (9-17)`**; contoh pada Jumat, 27 Nov 2026: **`🩺 dr. Yeffry (C+D)`**).
   * Jika pada tanggal tersebut terdapat lebih dari satu dokter dalam satu slot atau lintas slot, seluruh nama dokter dipajang sebagai kartu utama di bagian paling atas sebelum rincian tugas operasional.
2. **Status Lembur (2 Slot) atau Dinas Reguler (1 Slot) atau Cuti:**
   * **🥛☀️/🌙 Dinas Reguler (1 Slot):** Ditandai dengan ikon **☀️ Matahari Awan** (jika Shift Pagi) atau **🌙 Bulan Sabit Bintang** (jika Shift Siang/Sore).
   * **🍓✨ LEMBUR! (2 Slot di Hari yang Sama):** Jika Afiz ter-plot di 2 slot pada tanggal tersebut (seperti tanggal `13 Nov`, `19 Nov`, `23 Nov`, `25 Nov`, dan `30 Nov 2026`), muncul **Banner Spesial Berkilau "🍓✨ HARI INI AFIZ LEMBUR (2 SLOT)!"** yang langsung memisahkan **☀️ Dokter Slot 1 (Pagi)** dan **🌙 Dokter Slot 2 (Sore/Lembur)** secara berdampingan.
   * **☁️🍵 Sedang Cuti / LP / Libur:** Ditandai dengan ilustrasi awan tidur dan matcha (contoh: Sabtu, `28 Nov 2026` — `Afiz cuti`).
3. **Jam Masuk Efektif (Otomatis Mengikuti 3 Tingkat Prioritas Kolom):**
   * Ditampilkan besar di pojok kartu lengkap dengan lencana penjelasan mengapa jam tersebut dipilih (apakah dari catatan sel tanggal, catatan di dalam kolom hari, atau jam shift induk).

### 1.2. Prioritas Kedua ("Cek-Cek Lainnya" — Sekunder & Eksplorasi)

Setelah informasi utama *"Dokter Afiz Hari Ini & Status Lembur"* terjawab, pengguna baru diarahkan ke fitur pendukung di bagian bawah atau tab pendamping:

* **Rincian Tugas Pendamping Slot:** Melihat tugas non-dokter seperti `TTV EMR internis BEDAH`, `piket stock bedah`, `piket BHP bedah`, `5R1P`, `ceklist suhu inter`, atau catatan pra-tugas (`MCU`, `dr. Neni dl`, `TLJ dl`).
* **Intip Jadwal Perawat Kelinci Lainnya:** Mengganti pilihan perawat (`Lulut`, `Nabila`, `Firda`, `Endang`, `Dewi S`, `Suci P`, `Ovylia`, `Adung`, `Adelina`, `Novisa`, `Mirada`, `Naela`, `Nurul U`, `Dwi Ulfa`, `Latifah`, `Rina A`, `Dian SL`, `Mega`, `Lita`, dll.) yang masing-masing direpresentasikan dengan **Ikon Perawat Kepala Kelinci (🐰 Bunny Nurse)**.
* **Cari Dokter Seluruh Klinik:** Mencari dokter tertentu di luar jadwal Afiz (misal mencari siapa yang mendampingi `Prof. Darmono` atau `dr. Indra` hari ini).
* **Cek Siapa yang Cuti/LP, Simulasi Tukar Slot & Upload Excel Baru:** Memeriksa daftar teman yang sedang libur/kosong untuk diajak tukar slot, serta meng-upload file `.xlsx` baru dari atasan.

## 2. Aturan Bisnis & Logika Parsing Excel (Core Engine Rules)

### 2.1. Hierarki Prioritas Jam Masuk (3-Tier Time Priority Rule)

Mesin pembaca Excel (`SheetJS`) wajib menentukan jam masuk efektif dengan urutan prioritas berikut:

| Tingkat Prioritas | Sumber Data pada Baris/Kolom Excel | Contoh Kasus Nyata di Sheet `internis dkk` | Jam Masuk Efektif yang Ditampilkan |
| :--- | :--- | :--- | :--- |
| **Prioritas 1 (Tertinggi)** | **Catatan Jam pada Sel Tanggal / Nama** (tertulis langsung bersama nama asisten atau di sel pengantar pada kolom tanggal tersebut) | `Naela j.8`, `Rina A jam 8`, `Mega j.8`, `Endang j.8`, `Mirada j.8`, `Dian SL j.9`, `Latifah j.9`, atau penanda `jam 6`, `jam 7`, `jam 8`, `msk jam 8` di kolom tanggal | Mengambil jam dari sel tanggal tersebut (contoh: **Rabu, 25 Nov 2026** pada slot `dr. Indra C+D` terdapat catatan `jam 8` di kolom tanggal, sehingga **Afiz** masuk jam **08.00**, bukan `07.00`). |
| **Prioritas 2 (Menengah)** | **Keterangan Jam di Dalam Kolom Hari (`SENIN` s/d `SABTU`)** pada blok slot tersebut | Tertulis `masuk jam 7`, `masuk jam 8`, `msk j.8`, `masuk jam 9`, `msk j.9`, `masuk jam 10`, `masuk j.11`, `masuk jam 12`, `masuk jam 13`, `Msk jam 13.00`, `masuk j.14`, `masuk jam 15`, `masuk jam 16` di dalam kolom hari | Mengambil jam dari dalam kolom hari walaupun header shift induknya berbeda (contoh: **Senin, 23 Nov 2026** di blok `J.10` kolom Senin tertulis `msk j.8`, maka **Afiz** masuk jam **08.00**). |
| **Prioritas 3 (Fallback Default)** | **Kolom Header Shift Induk (`JAM` di Kolom A)** apabila Prioritas 1 dan Prioritas 2 tidak ada | `Jam 7`, `Jam 8`, `j 9`, `J.10`, `14.00`, `07.14`, `14.21` | Mengikuti jam shift induk (`07.00`, `08.00`, `09.00`, `10.00`, `14.00`, `07.00–14.00`, atau `14.00–21.00`). |

### 2.2. Rekap Validasi Jadwal & Hari Lembur (2 Slot) Milik Afiz (November 2026)

Berdasarkan hasil ekstraksi dari `NOVEMBER MG 1 2026.xlsx` dan `NOVEMBER 2026.xlsx`, berikut peta jadwal **Afiz** yang menjadi acuan utama di aplikasi:

| Tanggal | Status Dinas | Jam Masuk Efektif & Prioritas | Dokter yang Dipegang Afiz (Fokus Utama) | Tugas Pendamping Klinik |
| :--- | :--- | :--- | :--- | :--- |
| **02 Nov (Sen)** | 🌙 Reguler (1 Slot) | **12.00 WIB** *(Prio 2: Kolom Hari `masuk jam 12`)* | **dr. Tan Hengky C+D, dr. Rheza Sp.OT, dr. Marsella** | — |
| **03–06 Nov (Sel–Jum)** | 🌙 Reguler (1 Slot) | **12.00 WIB** *(Prio 2: Kolom Hari `masuk jam 12`)* | **dr. Tan Hengky, dr. Gizi, Prof. Darmono, dr. Budi R, dr. Ardy S** | 5R1P |
| **07 Nov (Sab)** | ☀️ Reguler (1 Slot) | **07.00 WIB** *(Prio 2: Kolom Hari `msk jam 7`)* | **dr. Lie Michele** | MCU, PIKET 5R1P |
| **09 Nov (Sen)** | 🌙 Reguler (1 Slot) | **11.00 WIB** *(Prio 2: Kolom Hari `masuk j.11`)* | **dr. Witjitra, dr. Meilina, dr. Suhardiyono, Prof. Darmono sore** | — |
| **10 Nov (Sel)** | 🌙 Reguler (1 Slot) | **14.00 WIB** *(Prio 3: Shift Induk `14.00`)* | **dr. Agus C+D, dr. Antonius, dr. Wahyu Sp.BTKV** | piket BHP bedah |
| **11–12 Nov (Rab–Kam)** | ☀️ Reguler (1 Slot) | **09.00 WIB** *(Prio 2: Kolom Hari `msk j.9`)* | **dr. Dadang Sp.OT (9-17)** | TTV EMR internis BEDAH, piket stock bedah |
| **13 Nov (Jum)** | 🍓✨ **LEMBUR (2 Slot)** | **Slot 1: 09.00 WIB** *(Prio 3)*<br>**Slot 2: 14.00 WIB** *(Prio 2: `masuk j.14`)* | **Slot 1:** Prof. Darmono, dr. Witjitra C, dr. Firsza<br>**Slot 2:** dr. Nur Anna, dr. Benedictus | **Slot 1:** Keliling ceklist suhu<br>**Slot 2:** piket BHP bedah |
| **14 Nov (Sab)** | ☀️ Reguler (1 Slot) | **07.00 WIB** *(Prio 2: Kolom Hari `msk j.7`)* | **dr. Dadang Sp.OT (9-17)** | TTV EMR / Duta CS, piket stock bedah |
| **16, 17, 18, 20 Nov** | ☀️ Reguler (1 Slot) | **09.00 / 10.00 WIB** *(Prio 2 & 3)* | **dr. Bambang Singgih, dr. Agnes** | piket 5R1P |
| **19 Nov (Kam)** | 🍓✨ **LEMBUR (2 Slot)** | **Slot 1: 09.00 WIB** *(Prio 2)*<br>**Slot 2: 15.00 WIB** *(Prio 2: `masuk jam 15`)* | **Slot 1:** dr. Bambang Singgih, dr. Agnes<br>**Slot 2:** dr. Zairullah Faza, Prof. Darmono sore, dr. Tania | **Slot 1:** piket 5R1P<br>**Slot 2:** TTV EMR internis |
| **21 Nov (Sab)** | ☀️ Reguler (1 Slot) | **10.00 WIB** *(Prio 2: Kolom Hari `msk jam 10`)* | **dr. Bambang Singgih, dr. Irwan** | — |
| **23 Nov (Sen)** | 🍓✨ **LEMBUR (2 Slot)** | **Slot 1: 08.00 WIB** *(Prio 2: `msk j.8`)*<br>**Slot 2: 13.00 WIB** *(Prio 2: `Msk jam 13.00`)* | **Slot 1:** dr. Andy, dr. KunSemedi, dr. Novalia Sp.KJ<br>**Slot 2:** Prof. Zainal | **Slot 1:** TTV EMR bedah<br>**Slot 2:** TTV bedah, 5R1P bedah inter |
| **24 Nov (Sel)** | ☀️ Reguler (1 Slot) | **10.00 WIB** *(Prio 2: Kolom Hari `msk jam 10`)* | **dr. Hirlan siang, dr. Dwi Ngesti** | TTV EMR / Duta CS |
| **25 Nov (Rab)** | 🍓✨ **LEMBUR (2 Slot)** | **Slot 1: 08.00 WIB** *(Prio 1: `jam 8`)*<br>**Slot 2: 13.00 WIB** *(Prio 2: `masuk jam 13`)* | **Slot 1:** dr. Indra (C+D)<br>**Slot 2:** Prof. Zainal | **Slot 1:** 5R1P TTV EMR gizi<br>**Slot 2:** rekap edukasi, TTV Anamnesa |
| **26 Nov (Kam)** | ☀️ Reguler (1 Slot) | **07.00 WIB** *(Prio 3: Shift Induk `Jam 7`)* | **dr. Indra (C+D)** | 5R1P TTV EMR gizi |
| **27 Nov (Jum)** | ☀️ Reguler (1 Slot) | **07.00 WIB** *(Prio 3: Shift Induk `Jam 7`)* | **dr. Yeffry (C+D)** | ceklist suhu inter, 5R1P, rekap edukasi |
| **28 Nov (Sab)** | ☁️🍵 **CUTI** | **Libur Cuti** | *Tidak ada dokter (Tercatat `Afiz cuti` di baris bawah)* | — |
| **30 Nov (Sen)** | 🍓✨ **LEMBUR (2 Slot)** | **Slot 1: 08.00 WIB** *(Prio 3)*<br>**Slot 2: 14.00 WIB** *(Prio 2: `masuk jam 14`)* | **Slot 1:** dr. Antonius D+C, dr. Kurniawan, dr. Ardian C+D<br>**Slot 2:** dr. Diana | **Slot 1:** —<br>**Slot 2:** BPJS, PIKET 5r1p |

## 3. Design System: "Kawaii Bunny Nurse & Dreamy Strawberry Milk Wonderland" (`UsagiBerry UI`)

Design system ini dirancang khusus agar **sangat lucu, feminin, dan menggemaskan (girly kawaii aesthetic)** dengan menggabungkan maskot **Perawat Kepala Kelinci (Bunny Nurse)** serta elemen langit dan susu stroberi: **Awan (☁️), Bintang (⭐), Bulan Sabit (🌙), Matahari Ceria (☀️), dan Botol Susu Stroberi (🥛🍓)**.

### 3.1. Karakter & Sistem Ikonografi Tematik (Kawaii Icon System)

| Elemen Visual | Wujud Ilustrasi / Ikon SVG | Fungsi Semantik di Dalam Aplikasi |
| :--- | :--- | :--- |
| **🐰 Bunny Nurse (Perawat Kelinci)** | Kepala kelinci putih bertelinga panjang (*lop bunny*) yang memakai **Topi Suster Putih berlogo Hati/Stroberi Pink** dan pipi merona (*blush*) | Digunakan sebagai ikon avatar untuk **Afiz** (dengan mahkota/pita stroberi spesial) serta seluruh tombol *chip* pemilihan perawat Internis-Bedah dan lencana asisten pendamping dokter. |
| **☀️ Matahari Ceria & Awan (`Sunny Cloud`)** | Matahari kuning pastel tersenyum yang mengintip di balik awan putih empuk | Penanda visual untuk **Shift Pagi** (jam masuk `06.00` s/d `10.00`). |
| **🌙 Bulan Sabit Tidur & Bintang (`Dreamy Moon`)** | Bulan sabit kuning-merah muda lembut dengan mata terpejam manis di atas awan dan bintang kecil | Penanda visual untuk **Shift Siang / Sore** (jam masuk `11.00` s/d `16.00`). |
| **🥛🍓 Botol Susu Stroberi & Percikan Susu (`Milk Splash`)** | Botol susu kaca bergambar stroberi dengan cipratan susu krim putih-pink dan gelembung hati | Menghiasi header utama, latar kartu dokter, dan indikator **Lembur (2 Botol Susu / Double Berry Milk)**. |
| **☁️✨ Awan Empuk, Bintang & Pita (`Clouds, Stars & Ribbons`)** | Awan bergelombang (*scalloped cloud borders*), taburan bintang berkelip, dan pita pink di atas kartu utama | Menjadi pembatas antar seksi, bingkai kartu **Dokter Afiz Hari Ini**, dan animasi latar yang hidup namun tidak mengganggu keterbacaan teks. |

### 3.2. Palet Warna (Color Tokens — 4 Varian Rasa)

Palet utama menggunakan kombinasi **Strawberry Milk Pastel** dengan aksen **Sunny Butter** (Matahari/Bintang), **Dreamy Lavender** (Bulan Sore), dan **Matcha Cream** (Cuti/Libur):

| Token Warna | Kode HEX Default | Peran Visual |
| :--- | :--- | :--- |
| **Strawberry Milk Sky (`--bg-milk`)** | `#FFF5F8` | Latar belakang utama dengan motif *polka-dot* stroberi halus dan awan melayang. |
| **Fluffy Cloud White (`--bg-card`)** | `#FFFFFF` | Permukaan kartu utama menyerupai awan putih bersih dengan tepi bergelombang/membulat `#FBCFE8`. |
| **Berry Milkshake (`--bg-frosting`)** | `#FFE2EE` | Latar *header* langit susu stroberi, pita judul, dan *highlight* kartu dokter Afiz. |
| **Sweet Ichigo Pink (`--berry-primary`)** | `#FF4D79` | Warna aksen utama untuk tombol aktif, pita Bunny Nurse, dan lencana jam masuk. |
| **Sunny Starlight (`--sun-yellow`)** | `#FFF3C4` / `#B45309` | Warna kartu dan lencana **☀️ Shift Pagi (Matahari & Awan)** serta kilau bintang. |
| **Moonlight Berry (`--moon-lavender`)** | `#F3E8FF` / `#7E22CE` | Warna lencana **🌙 Shift Sore (Bulan Sabit & Bintang)** yang manis dan kontras dengan pagi. |
| **Double Strawberry Jam (`--lembur-pink`)** | `#FFD6E4` / `#E11D48` | Warna kartu spesial **🍓✨ LEMBUR (2 Slot)** dengan bingkai garis putus-putus berkilau bintang. |
| **Matcha Cloud (`--matcha-mint`)** | `#DCFCE7` / `#15803D` | Warna kartu **☁️🍵 Cuti / LP (Istirahat)** yang adem. |
| **Cocoa Berry Ink (`--berry-dark`)** | `#4A1525` | Warna teks utama (*deep strawberry chocolate*) agar nama dokter sangat jelas dibaca. |

### 3.3. Tipografi & Bentuk Komponen (`Cloud & Bubble Shapes`)

* **Font Utama:** `Quicksand` (Bold 700) untuk angka jam, nama dokter utama, dan judul berornamen pita; dipadukan dengan `Plus Jakarta Sans` (Medium/SemiBold) untuk daftar tugas klinik.
* **Bentuk Kartu Awan & Buble (`28px–32px`):** Kartu utama **"Dokter Afiz Hari Ini"** memiliki hiasan pita (`🎀`) di bagian atas dan siluet awan empuk di sudut kartu.
* **Kartu Dokter Spesialis (`Doctor Spotlight Pill-Card`):** Setiap dokter yang dipegang Afiz ditampilkan dalam kartu putih berbintang dengan ikon **🐰🩺 Bunny Nurse + Stetoskop** dan badge lokasi (`C+D`, `Dahlia`, `R. Laktasi C1`).

## 4. Struktur Navigasi Mobile (Hierarki Utama vs. Sekunder)

1. **🐰🍓 Tab 1 — Hari Ini Afiz (Layar Utama / Default):**
   * **Bagian 1 (Paling Atas & Menonjol):** Pemilih Tanggal Cepat (`Hari Ini`, `Besok`, atau deretan tanggal berikon ☀️/🌙/🍓✨/🍵) + **Banner Status Lembur / Reguler**.
   * **Bagian 2 (Inti Utama):** **Kartu Besar "🩺 Dokter Afiz Hari Ini"** (menampilkan nama dokter dengan ukuran besar, jam masuk efektif hasil prioritas 1/2/3, dan jika **Lembur 2 Slot** langsung menampilkan **☀️ Dokter Slot Pagi** & **🌙 Dokter Slot Sore**).
   * **Bagian 3 (Sekunder di Bawahnya):** Rincian tugas operasional klinik (`TTV EMR`, `5R1P`, `piket stock/BHP`), kalender visual sebulan penuh milik Afiz, serta **Deretan Perawat Kelinci Lainnya** jika ingin mengintip jadwal teman.
2. **🩺☁️ Tab 2 — Cek Dokter Lain (Direktori Klinik Harian):**
   * Pencarian cepat dokter di seluruh klinik Internis-Bedah & Dahlia pada tanggal terpilih, lengkap dengan ikon **🐰 Perawat Kelinci** yang bertugas mendampingi masing-masing dokter.
3. **🌙🍵 Tab 3 — Cek Cuti, LP & Simulasi Tukar:**
   * Melihat siapa teman yang sedang Cuti/LP atau kosong hari ini, serta fitur simulasi tukar slot sementara.
4. **🥛📂 Tab 4 — Upload Excel & PIC Bulanan:**
   * Tempat meng-upload file `.xlsx` baru dari atasan (diproses statis di browser via `SheetJS`), mengunduh rekap Excel, dan melihat daftar **PIC Bulanan** serta pengingat **Presentasi Kasus Selasa & Rabu jam 12.00**.