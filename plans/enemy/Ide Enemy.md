## 1. Klasifikasi & Spesifikasi Enemy

### 1. Grunt (Tipe 1 - Basic Unit)

Unit garis depan berukuran kecil yang bergerak cepat dan muncul dalam jumlah banyak.
- **Pola Gerakan:** Bergerak turun dari atas layar ke arah bawah (lihat bagian _Pola Formasi & Gerakan_).
- **Mekanisme Serangan:**
    - Menembakkan peluru lurus ke arah bawah (searah gerakan).
    - Menembakkan peluru langsung berarah (_targeted_) ke posisi Player.
- **Parameter Gerakan yang Dapat Diatur:** Lihat bagian _Parameter Gerakan Tipe 1_ di Bagian 2.
- **Parameter Serangan yang Dapat Diatur:**
    - _Fire rate_ (jeda antar tembakan).
    - Jenis pola tembakan (Lurus ke bawah / _Targeted_ ke Player).

### 2. Machine Gun / Interceptor (Tipe 2 - Medium Unit)

Unit penyerang jarak menengah yang mengandalkan rentetan tembakan padat.
- **Pola Gerakan:** Bergerak dari atas menuju titik singgah (_anchoring point_) di bagian atas layar.
- **Mekanisme Serangan:**
    - Melakukan siklus berpola: **Sesi Diam (Aiming)** $\rightarrow$ **Sesi Tembak (Burst Fire)**.
    - Saat sesi diam, unit hanya mengunci arah (_aiming_) ke posisi Player.
    - Saat sesi tembak, unit menghembuskan rentetan peluru berbentuk menyebar (_spread/fan pattern_).
- **Parameter Gerakan yang Dapat Diatur:** Lihat bagian _Parameter Gerakan Tipe 2_ di Bagian 2.
- **Parameter Serangan yang Dapat Diatur:**
    - **Siklus:** Durasi Sesi Diam (_Cooldown_) dan Durasi Sesi Menembak (_Burst Duration_).
    - **Tembakan:** _Fire rate_ saat sesi tembak.
    - **Pola Sebaran Peluru:** Jumlah peluru per gelombang tembakan dan sudut penyebaran (_Spread Angle / Radius_).

### 3. Sharpshooter / Sniper (Tipe 2 - Medium Unit)

Unit penyerang jarak jauh dengan akurasi tinggi dan tembakan berkecepatan tinggi.
- **Pola Gerakan:** Mengikuti aturan gerakan Tipe 2 (_anchoring point_).
- **Mekanisme Serangan:**
    - Memiliki jeda bersiap (_charging/aiming phase_) sebelum melepaskan tembakan cepat (_high-velocity spread shot_) ke arah Player.
- **Parameter Gerakan yang Dapat Diatur:** Mengikuti _Parameter Gerakan Tipe 2_ (Bagian 2).
- **Parameter Serangan yang Dapat Diatur:**
    - Durasi persiapan/jeda sebelum menembak (_Charge Duration_).
    - Jumlah peluru serentak (_Shotgun/Spread Shot Count_).
    - Sudut penyebaran peluru (_Spread Angle / Radius_).

### 4. Missile Cruiser (Tipe 2 - Medium Unit)

Unit spesialis pendukung yang melepaskan proyektil penjejak.
- **Pola Gerakan:** Mengikuti aturan gerakan Tipe 2 (_anchoring point_).
- **Mekanisme Serangan:**
    - Memiliki jeda persiapan sebelum meluncurkan Rudal Penjejak (_Homing Missile_) secara menyebar.
- **Parameter Gerakan yang Dapat Diatur:** Mengikuti _Parameter Gerakan Tipe 2_ (Bagian 2).
- **Parameter Serangan yang Dapat Diatur:**
    - **Unit:** Durasi jeda sebelum peluncuran (_Cooldown_).
    - **Pola Peluncuran:** Jumlah misil per peluncuran dan sudut penyebaran (_Spread Angle_).
    - **Spesifikasi Misil:** Lihat _Tipe Proyektil (Misil Penjejak)_.

### 5. Mothership / Modular Boss (Tipe 3 - Boss Unit)

Kapal induk stasioner berukuran besar yang muncul (dan menetap) di bagian atas layar canvas.

#### A. Struktur Slot Senjata (Modular Turrets)
- **4 Slot Senjata Sekunder (Turret Side Slots):**
    - 2 slot di sisi kiri, 2 slot di sisi kanan.
    - Menggunakan sistem senjata setara **Enemy Tipe 2** (Machine Gun, Sniper, atau Missile Cruiser), namun dibuat lebih intens.
- **1 Slot Senjata Utama (Main Core Weapon):**
    - Terletak di tengah kapal induk dengan mekanik tembakan unik (dapat disesuaikan kemudian).

#### B. Sistem Garasi & Spawner Escort (Bawaan Boss)
Terletak di bagian depan/bawah kapal induk untuk mendistribusikan musuh pendamping.
- **Spawn Enemy Tipe 1 (Grunt):**
    - Muncul dari pintu garasi kapal induk dengan pola gerakan standar.
    - _Toggle enable/disable_ dan frekuensi _spawn_ dapat diatur.
    - Titik keluar dari garasi dan sudut luncuran awal dapat diatur (lihat _Parameter Gerakan Boss_).
- **Spawn Enemy Tipe 2 (Escort Units):**
    - Memiliki **3 Slot Formasi** terbatas di depan Boss. Ini bisa diatur bossnya hanya mau pake satu slot (tengah), dua slot (kiri dan kanan), atau tiga (kiri, tengah dan kanan).
    - **Mekanisme Penempatan (Slotting):** Musuh mengisi slot yang kosong. Jika ke-3 slot terisi, _spawner_ berhenti bekerja.
    - **Mekanisme Timer Spawn:**
        - **Inisialisasi:** Pada awal munculnya Boss, seluruh slot terisi penuh secara bersamaan (_simultaneous spawn_).
        - **Respawn:** _Countdown timer_ penggantian unit baru dihitung secara mandiri untuk slot yang kosong **setelah** unit di slot tersebut hancur. Unit yang masih bertahan tidak memicu _timer_.

#### C. Aturan Khusus Saat Boss Aktif
- **Override System:** Saat Boss muncul, _spawner_ musuh standar di _wave_ normal dihentikan (termasuk logika penempatan Tipe 2 dari atas layar). Seluruh gerakan dan kemunculan musuh sepenuhnya dikendalikan oleh kapal induk.
- **Syarat Kemunculan:** Boss hanya muncul pada kurun waktu tertentu (_scheduled wave_) dan **wajib** menunggu seluruh musuh biasa di layar habis (baik hancur maupun keluar dari batas canvas).
- **Pasca Hancur:** Setelah Boss hancur, sistem _spawner wave_ normal (Tipe 1 & 2) kembali aktif seperti biasa.


## 2. Pola Formasi & Gerakan (Movement Patterns)

### Pola Gerakan Tipe 1 (Grunt)

- **Rain Pattern:** Muncul secara acak dari batas atas layar dan meluncur lurus ke bawah.
- **Horizontal Wall:** Muncul bersamaan membentuk garis horizontal melintang dan bergerak turun ke bawah secara serentak.
- **Vertical Line (Stream):** Muncul berurutan dalam satu baris vertikal:
    - Lurus ke bawah.
    - Diagonal ke bawah (sudut Kanan Atas $\rightarrow$ Kiri Bawah, atau Kiri Atas $\rightarrow$ Kanan Bawah).

> **Catatan Arah Peluru:** Untuk serangan Grunt yang tidak mengunci posisi Player, arah luncuran peluru selalu sejajar/searah dengan sudut gerakan Grunt.

#### Parameter Gerakan Tipe 1 (Grunt)

Berlaku untuk seluruh pola Tipe 1 kecuali yang disebutkan khusus:

- **Kecepatan Gerak Umum (_Move Speed_):** Kecepatan turun unit dalam satuan pixel/detik.
- **Sudut Gerak (_Move Angle_):** Sudut luncuran untuk pola diagonal (default $45^\circ$, dapat diubah bebas dari $0^\circ$ sampai $80^\circ$). Sudut $0^\circ$ sama dengan lurus ke bawah.
- **Arah Diagonal (_Diagonal Direction_):** Kiri ke kanan atau kanan ke kiri.
- **Titik Spawn Horizontal (_Spawn X Range_):** Rentang koordinat X tempat unit boleh muncul (min dan max), khusus untuk Rain Pattern.
- **Interval Spawn Rain (_Rain Spawn Interval_):** Jeda rata-rata antar unit Rain yang muncul, dan variasi acaknya (_jitter_).
- **Jumlah Unit per Formasi (_Formation Count_):**
    - Horizontal Wall: jumlah unit dalam satu garis.
    - Vertical Line: jumlah unit dalam satu baris.
- **Jarak Antar Unit (_Spacing_):**
    - Horizontal Wall: jarak horizontal antar unit.
    - Vertical Line: jarak vertikal antar unit.
- **Delay Antar Unit dalam Stream (_Stream Delay_):** Jeda waktu antara unit pertama dan unit berikutnya dalam satu baris, sehingga membentuk barisan yang berurutan.
- **Interval Antar Formasi (_Formation Interval_):** Jeda antara satu formasi dan formasi berikutnya.
- **Titik Despawn (_Despawn Y_):** Posisi bawah layar tempat unit dihapus.

#### Ringkasan Parameter Gerakan Tipe 1

| Pola | Parameter yang Dapat Diatur |
|---|---|
| **Rain** | Move Speed, Spawn X Range, Rain Spawn Interval (+ jitter), Move Angle (opsional) |
| **Horizontal Wall** | Move Speed, Formation Count, Spacing, Formation Interval |
| **Vertical Line (Lurus)** | Move Speed, Formation Count, Stream Delay, Spacing, Formation Interval |
| **Vertical Line (Diagonal)** | Move Speed, Move Angle, Diagonal Direction, Formation Count, Stream Delay, Formation Interval |

### Pola Gerakan Tipe 2 (Medium Units)

- **Anchoring Point Mechanics:**
    - Terdapat **6 titik hinggap (_node_) tetap** di area atas canvas.
    - Unit muncul dari luar layar atas dan bergerak menuju salah satu _node_ yang kosong.
    - **Sistem Booking:** _Node_ yang sedang dituju oleh suatu unit langsung berstatus _booked_ (tidak boleh dituju unit lain).
    - **Fallback / Overflow:** Jika ke-6 _node_ sudah terisi/dipesan, unit Tipe 2 yang baru muncul akan terus bergerak lurus melintasi layar ke bawah tanpa berhenti.

#### Parameter Gerakan Tipe 2 (Medium Units)

- **Kecepatan Masuk (_Entry Speed_):** Kecepatan unit saat keluar dari atas layar menuju node.
- **Koordinat Node (_Node Position_):** Posisi X dan Y dari masing-masing dari 6 node, sehingga tata letak anchoring dapat diatur bebas.
- **Jumlah Node Aktif (_Active Node Count_):** Dapat dikurangi dari 6 jika ingin area atas lebih sepi.
- **Strategi Pemilihan Node (_Node Selection_):**
    - Acak (_random_).
    - Berurutan dari kiri ke kanan atau kanan ke kiri.
    - Node terdekat dari posisi spawn.
- **Durasi Hinggap (_Hold Time_):** Berapa lama unit berada di node setelah tiba (sebelum sesi aiming/tembak berikutnya atau sebelum keluar). Perlu diputuskan apakah unit tetap diam selamanya, atau keluar setelah durasi tertentu.
- **Kecepatan Overflow (_Overflow Speed_):** Kecepatan turun unit saat tidak mendapat node.
- **Sudut Overflow (_Overflow Angle_):** Sudut luncuran unit overflow (default lurus ke bawah).
- **Jeda Booking (_Booking Timeout_):** Batas waktu sebuah node tetap berstatus _booked_ jika unit yang memesan belum tiba (untuk mencegah node macet).

#### Ringkasan Parameter Gerakan Tipe 2

| Parameter | Fungsi |
|---|---|
| Entry Speed | Kecepatan dari luar layar ke node |
| Node Position (x6) | Tata letak titik hinggap |
| Active Node Count | Jumlah node yang dipakai |
| Node Selection | Aturan memilih node kosong |
| Hold Time | Lama diam di node |
| Booking Timeout | Mencegah node terkunci selamanya |
| Overflow Speed & Angle | Gerakan saat semua node penuh |
| Hover Sway / Exit Behavior | Variasi visual (opsional) |

### Parameter Gerakan Boss (Mothership)

- **Posisi Boss (_Boss Anchor Position_):** Koordinat tempat boss menetap di atas layar.
- **Kecepatan Masuk Boss (_Boss Entry Speed_):** Kecepatan boss turun dari luar layar hingga mencapai posisi tetap.
- **Gerak Boss (_Boss Sway_, opsional):** Gerak horizontal pelan saat menetap. Default: diam.
- **Titik Keluar Garasi (_Garage Spawn Point_):** Koordinat pintu garasi tempat Grunt keluar.
- **Sudut Luncuran Grunt dari Garasi (_Garage Exit Angle_):** Arah awal Grunt saat keluar dari garasi.
- **Koordinat Slot Escort (_Escort Slot Position_):** Posisi X dan Y dari masing-masing dari 3 slot formasi escort (kiri, tengah, kanan).
- **Slot Aktif (_Active Escort Slots_):** Pilihan satu, dua, atau tiga slot yang digunakan.
- **Durasi Respawn Escort (_Escort Respawn Timer_):** Waktu tunggu sebelum slot kosong diisi ulang (sudah dijelaskan di Bagian 1.B).
- **Interval Spawn Grunt Garasi (_Garage Spawn Interval_):** Frekuensi kemunculan Grunt dari garasi.

---

## 3. Tipe Proyektil (Bullet System)

### 1. Peluru Biasa (Standard Bullet)

Diterapkan pada: Grunt, Machine Gun, Sniper, dan Turret Standar Boss.
- **Parameter Configurable:**
    - Warna & Sprite Peluru.
    - Kecepatan Luncur (_Linear Velocity_).
    - Hitbox & Hit Damage.

### 2. Misil Penjejak (Homing Missile)

Diterapkan pada: Missile Cruiser dan Turret Misil Boss.
- **Parameter Configurable:**
    - **Steer / Rotation Force:** Tingkat kelincahan belok misil saat mengejar target.
    - **Speed:** Kecepatan dorong/gerak misil.
    - **Homing Duration:** Batas waktu (dalam detik) misil aktif melacak Player sebelum kehilangan kuncian dan meluncur lurus.

---

## 4. Metode Serangan Senjata Utama Mothership

### 1. Spiral Barrage (Pola Badai Spiral)

Pola klasik _bullet hell_ yang menciptakan efek visual indah dan memaksa player terus bergerak melingkar.
- **Proyektil yang Digunakan:** Peluru Biasa (Kecepatan Sedang/Lambat).
- **Mekanisme Tembakan:**
    - Boss menembakkan peluru satu per satu atau beberapa jalur sekaligus dengan sudut firing yang berputar secara kontinu ($360^\circ$).
    - **Variasi Fase:**
        - _Single Spiral:_ 1 garis rotasi berputar searah jarum jam.
        - _Double/Cross Spiral:_ 2 atau 4 garis berputar berlawanan arah (menciptakan pola jaring/interferensi).
- **Mengapa Menarik:** Menguji kemampuan player membaca celah sempit (_micro-dodging_) di antara sela-sela spiral.
- **Parameter yang Dapat Diatur:**
    - **Degrees per Shot (Sudut Rotasi):** Berapa derajat pergeseran arah tembakan setiap peluru dipicu (contoh: $10^\circ - 15^\circ$).
    - **Rotation Speed & Direction:** Kecepatan putaran moncong tembakan dan arahnya (Searah / Berlawanan jarum jam).
    - **Spiral Arms (Jumlah Jalur Spiral):** Jumlah garis spiral yang keluar bersamaan (1, 2, atau 4 jalur).
    - **Fire Rate (Cadence):** Jeda waktu antar peluru dalam satu jalur spiral (dalam detik / millisecond).
    - **Bullet Speed:** Kecepatan luncur peluru spiral.

### 2. Radial Pulse & Aimed Sniping (Pola Gelombang Cincin & Tembakan Terarah)

Pola kombinasi antara jebakan area dan tekanan langsung ke player.
- **Proyektil yang Digunakan:** Peluru Biasa.
- **Mekanisme Tembakan:**
    - **Tahap 1 (Radial Ring):** Boss melepaskan gelombang peluru melingkar $360^\circ$ sekaligus (misal: 24–36 peluru bergerak keluar bersamaan) dengan kecepatan lambat. Ini membentuk "dinding" melingkar.
    - **Tahap 2 (Targeted Burst):** Di sela-sela gelombang melingkar tersebut, Boss melepaskan rentetan peluru cepat (_aimed shot_) langsung ke arah posisi Player.
- **Mengapa Menarik:** Player harus mencari celah di gelombang cincin sambil terus _dodging_ dari tembakan cepat yang mengincarnya.
- **Parameter yang Dapat Diatur:**
    - **Pulse Wave Count:** Jumlah peluru dalam 1 gelombang lingkaran $360^\circ$ (contoh: 18, 24, atau 36 peluru).
    - **Pulse Interval:** Jeda antar gelombang lingkaran yang dilepaskan.
    - **Pulse Bullet Speed:** Kecepatan peluru gelombang lingkaran (biasanya cenderung lambat).
    - **Snipe Burst Count:** Jumlah peluru cepat yang diincar ke player per satu gelombang tembakan (contoh: 3–5 peluru).
    - **Snipe Fire Rate:** _Fire rate_ saat melepaskan tembakan cepat terarah.
    - **Snipe Bullet Speed:** Kecepatan luncur peluru terarah (harus lebih cepat dari peluru _pulse_).

### 3. Missile Swarm Barrage (Pola Hujan Misil Salvo)

Pola penyerangan menggunakan keunggulan sifat fisik Misil.
- **Proyektil yang Digunakan:** Misil Penjejak.
- **Mekanisme Tembakan:**
    - Boss menembakkan misil dalam jumlah banyak (misal: 8–12 misil) secara serentak ke berbagai sudut (menyebar ke atas/samping dulu).
    - Misil diatur dengan **Homing Duration** pendek (misal: 2–3 detik) dan **Rotation Force** yang tinggi.
- **Efek Visual:** Misil akan menyebar memutar dari tengah Boss, lalu membengkok tajam mengunci posisi Player secara bersamaan sebelum akhirnya kehilangan kuncian dan meluncur lurus.
- **Mengapa Menarik:** Menciptakan kepanikan visual (_chaos_) karena misil datang dari berbagai sudut sebelum bergerak sejajar.
- **Parameter yang Dapat Diatur:**
    - **Salvo Size:** Jumlah misil yang diluncurkan dalam satu gelombang salvo (contoh: 6–12 misil).
    - **Launch Spread Angle:** Sudut sebaran awal peluncuran misil saat keluar dari moncong Boss ($60^\circ - 180^\circ$).
    - **Salvo Cooldown:** Jeda waktu antar gelombang salvo misil.
    - **Homing Parameters (Menggunakan Properti Misil):**
        - _Steer / Rotation Force_ (Kecepatan belok).
        - _Speed_ (Kecepatan dorong).
        - _Homing Duration_ (Durasi pelacakan).

### 4. Curtain Wave / Alternating Walls (Pola Hujan Dinding Bergantian)

Pola yang menguji refleks gerakan horizontal player.
- **Proyektil yang Digunakan:** Peluru Biasa (Kecepatan Lambat).
- **Mekanisme Tembakan:**
    - Boss menembakkan serangkaian garis peluru horizontal melintang (seperti tirai) dengan sela/celah kosong (_gap_) di titik tertentu.
    - Tembakan gelombang 1 memiliki celah di sebelah **Kiri**.
    - Tembakan gelombang 2 memiliki celah di sebelah **Kanan**.
    - Ditembakkan secara bergantian dan terus-menerus.
- **Mengapa Menarik:** Mengubah medan tempur menjadi _rhythm game_, di mana player harus melakukan zig-zag melintasi celah tirai yang bergerak turun.
- **Parameter yang Dapat Diatur:**
    - **Wall Density:** Jumlah peluru yang membentuk satu garis dinding horizontal (contoh: 10–15 peluru per baris).
    - **Gap Width (Lebar Celah):** Ukuran ruang kosong pada dinding tempat player melintas (dalam _pixel_ atau unit layar).
    - **Gap Position Shift:** Jarak perpindahan posisi celah antara gelombang 1 (Kiri/Tengah) dan gelombang 2 (Kanan/Tengah).
    - **Wave Spawn Interval:** Waktu jeda antar munculnya garis dinding (misal: tiap 1 detik).
    - **Wall Bullet Speed:** Kecepatan luncur seluruh peluru penyusun dinding.

### Rekomendasi Penerapan (Fase Boss / Pattern Cycling)

Agar Senjata Utama ini tidak membosankan, gunakan sistem **Phase / Cycle Pattern**:
1. **Cycle 1:** Spiral Barrage (Memberi tekanan visual konstan).
2. **Cycle 2:** Radial Pulse + Targeted Burst (Memaksa gerakan presisi).
3. **Cycle 3 (Desperation Mode / Darah Boss < 30%):** Gabungan **Spiral Barrage (Peluru Biasa)** dengan **Missile Swarm (Misil)** secara bersamaan.