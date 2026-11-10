# Asset System — Alur Sederhana (Penjelasan Manusia & AI)

Dokumen ini menjelaskan **kenapa** dan **bagaimana** aset bergerak dari file/gambar sampai muncul di layar,
tanpa istilah teknis berat. Untuk detail API, nama method, dan peta migrasi atlas, lihat
[`doc/asset-system.md`](./asset-system.md).

- **Status sistem:** fondasi selesai (plan #6), semua aset masih **placeholder**
- **Audiens:** kontributor manusia yang baru masuk, dan AI agent yang akan mengubah kode aset
- **Perilaku kode saat ini:** `node "node_modules\typescript\bin\tsc" --noEmit` → exit 0

---

## 1. Tiga kata kunci yang harus dipahami dulu

| Istilah di dokumen ini | Maksudnya | Nama teknis (kalau mau cari di kode) |
|---|---|---|
| **Nama panggilan** | Nama pendek yang dipakai kode untuk menyebut sebuah gambar, misal `"player"`. Tidak pernah berubah walau gambarnya diganti | `AssetKeys` |
| **Gudang gambar** | Tempat penyimpanan gambar siap pakai di memori browser. Kosong setiap halaman di-refresh | Phaser `TextureManager` |
| **Kartu alamat** | Lembar kecil berisi "gambar namanya X, frame-nya nomor Y". Dibawa-bawa oleh objek game | `AssetRef` |

Inti seluruh sistem ini cuma satu: **kode memegang nama panggilan, bukan nama file.**
Nanti saat aset asli datang, yang diubah hanya daftar yang menerjemahkan nama panggilan → file asli.

---

## 2. Perjalanan sebuah gambar (dari diam sampai bergerak)

### Langkah 1 — Gambar ada di dua tempat berbeda

**a. Gambar yang punya file asli**

Ada di folder `public/assets/` (`bg.png`, `logo.png`). File ini ikut terkirim ke browser saat web dibuka.
Kalau file diganti isinya (nama tetap), game otomatis memakai yang baru setelah refresh.

**b. Gambar yang tidak punya file sama sekali**

Pemain, musuh, dan peluru saat ini **tidak punya file**. Gambarnya dibuat sendiri oleh Phaser saat game mulai:
Phaser menggambar bentuk sederhana (segitiga merah, lingkaran kuning) ke kanvas tak terlihat, lalu "memfoto"
kanvas itu, dan foto itulah yang disimpan sebagai gambar. Inilah yang disebut **placeholder**.

Konsekuensinya: kalau kode placeholder dihapus sebelum aset asli ada, objek game akan tampil kosong/tidak terlihat.

### Langkah 2 — Semua gambar harus masuk gudang dulu

Gambar tidak bisa ditempel ke layar langsung dari file. Harus dimasukkan dulu ke **gudang gambar** di memori.
Gudang ini satu untuk seluruh game dan dipakai bersama oleh semua scene.

Karena gudang ada di memori, isinya **hilang setiap refresh**. Itu sebabnya pemuatan harus diulang dari awal
setiap kali halaman dibuka — itu tugas Boot dan Preloader.

### Langkah 3 — Urutan pemuatan (penting, jangan dibalik)

```
Boot        → minta browser mengunduh background
Preloader   → unduh logo
            → gambar placeholder (pemain, musuh, 2 peluru, 1 frame tambahan)
            → daftarkan animasi pemain  (harus setelah placeholder jadi)
MainMenu / Game → pakai nama panggilan untuk mengambil gambar dari gudang
```

Animasi didaftarkan **setelah** placeholder dibuat, karena animasi hanya menyebut nama gambar —
kalau gambarnya belum ada, animasi akan gagal.

### Langkah 4 — Memakai gambar = menempel berulang kali

Saat pemain dibuat, game mengambil gambar `"player"` dari gudang lalu menempelkannya ke objek pemain.
Setelah itu, tiap detik Phaser menggambar ulang layar sekitar 60 kali: setiap objek aktif "ditempel" lagi
di posisi terbarunya.

Gambar aslinya tetap **satu** di gudang. Yang banyak adalah objek yang menempelkannya.
Itu sebabnya 50 peluru di layar tidak berarti 50 gambar terpisah di memori.

### Langkah 5 — Ganti aset asli nanti = ubah daftar saja

Karena kode hanya menyebut nama panggilan, migrasi ke aset asli tidak menyentuh pemain, musuh, peluru,
maupun scene. Yang berubah hanya **buku inventaris** (dari file mana gambar diambil) dan **petugas gudang**
(cara mengunduhnya). Semua pemanggil tetap memakai nama panggilan yang sama.

---

## 3. Peran tiap file (versi sederhana)

| File | Analogi | Tugasnya |
|---|---|---|
| `src/game/config/AssetKeys.ts` | **Daftar nama panggilan resmi** | Menyimpan semua nama gambar di satu tempat supaya tidak ada salah ketik (`"backgroud"`) yang membuat gambar gagal muncul |
| `src/game/config/AssetManifest.ts` | **Buku inventaris** | Untuk setiap nama panggilan: asalnya dari file atau digambar sendiri, alamat filenya, dan daftar animasi. Murni catatan, tidak melakukan apa pun |
| `src/game/types/AssetRef.ts` | **Kartu alamat** | Benda kecil berisi `{ texture, frame? }` yang dibawa objek game. Objek tidak perlu tahu cara mencari gambarnya |
| `src/game/systems/AssetManager.ts` | **Petugas gudang** | Satu-satunya yang boleh: mengunduh file, menggambar placeholder, mendaftarkan animasi, dan menyerahkan kartu alamat |
| `src/game/scenes/Boot.ts` | **Pintu masuk pertama** | "Unduh yang tahap boot" |
| `src/game/scenes/Preloader.ts` | **Pintu masuk kedua** | "Unduh tahap main, siapkan placeholder, daftarkan animasi" — berurutan |
| `src/game/scenes/MainMenu.ts`, `GameOver.ts` | **Pemakai** | Menempel background/logo memakai nama panggilan |
| `src/game/scenes/Game.ts` | **Pemberi kartu alamat** | Meminta kartu alamat ke petugas gudang, lalu menyerahkannya ke pemain, musuh, dan senjata |
| `src/game/entities/player/PlayerWeapon.ts` | **Pemakai kartu** | Menerima kartu alamat peluru, lalu memakainya setiap kali membuat peluru dari pool |
| `src/game/systems/EnemyBulletManager.ts` | **Pemakai kartu** | Mengambil sendiri kartu alamat peluru musuh (sistem boleh memanggil petugas gudang) |

Catatan: `src/game/utils/textures.ts` **sudah dihapus**. Dulu dia "tukang gambar lepas" yang dipanggil
langsung dari scene; sekarang pekerjaannya masuk ke petugas gudang supaya hanya ada satu pintu.

---

## 4. Aturan main (untuk manusia dan AI)

### 4.1 Jangan pernah menyebut nama file gambar langsung

```ts
// SALAH — nama file tersebar di banyak tempat, migrasi jadi mimpi buruk
this.add.image(x, y, 'background');
this.load.image('logo', 'assets/logo.png');

// BENAR — semua lewat nama panggilan
this.add.image(x, y, AssetKeys.Background);
AssetManager.preloadMain(this);
```

### 4.2 Siapa boleh memanggil `AssetManager`

| Boleh | Tidak boleh |
|---|---|
| `scenes/` (Boot, Preloader, Game, MainMenu, GameOver) | `entities/` — dilarang oleh aturan dependensi di `doc/struktur-file.md` |
| `systems/` (contoh: `EnemyBulletManager`) | `config/` dan `types/` — keduanya lapisan data murni |
| `ui/` bila nanti butuh ikon | — |

Karena `entities/` dilarang, entity **menerima** `AssetRef` dari luar:

```ts
// Game.ts (composition root)
const asset = AssetManager.resolve(AssetKeys.Player);
this.player = new Player(this, x, y, asset, config, input, this.weapon);
```

### 4.3 Menambah gambar placeholder baru (4 langkah)

1. Tambah nama panggilan di `AssetKeys.ts`.
2. Daftarkan di `AssetManifest.ts` dengan `source: 'generated'` dan `frameCount: 1`.
3. Tambah resep gambarnya di `PLACEHOLDER_RECIPES` (`AssetManager.ts`).
4. Pakai lewat `AssetManager.resolve(...)` di scene.

### 4.4 Menambah aset dari file asli (tanpa placeholder)

1. Taruh file di `public/assets/`.
2. Daftarkan di `AssetManifest.ts` dengan `source: 'file'` dan `path` lengkap.
3. Panggil preload-nya dari `preloadBoot` atau `preloadMain` (pilih tahap yang sesuai).
4. Pakai lewat nama panggilan.

### 4.5 Menambah animasi

Tambahkan entri di `AssetManifest.animations`, ekspos lewat `AnimKeys`, lalu `this.play(AnimKeys.X)`.
Animasi yang ada sekarang: `player-idle` (2 frame, 2 fps, berulang) — efeknya pemain berdenyut halus.

### 4.6 Menghapus gambar placeholder

Hapus entri dari `AssetManifest.placeholders`, lalu hapus resepnya di `AssetManager`.
Jangan hapus resep lebih dulu, karena `ensurePlaceholders` akan kehilangan cara menggambarnya
dan objek terkait tampil kosong.

---

## 5. Apa yang BUKAN bagian dari sistem ini

Ini digambar langsung oleh Phaser setiap frame, **tidak** lewat gudang gambar:

- lingkaran shield (`entities/effects/Shield.ts`)
- gelombang kejut (`entities/effects/Shockwave.ts`)
- sinar laser (`entities/player/PlayerLaser.ts`)
- ikon/tanda power-up (`systems/power-ups/PowerUpSpawnManager.ts`)
- semua teks dan panel UI (`Hud`, `Pause`, `MainMenu`, `DebugOverlay`)

Kalau mau memigrasikan bagian-bagian itu ke gambar asli, itu pekerjaan terpisah — bukan "sekadar ganti file",
karena bentuknya berubah-ubah tiap frame (radius shield, lebar laser, dan seterusnya).

---

## 6. Hitbox tidak ikut ukuran gambar

Ukuran tabrakan (hitbox) diatur terpisah dari ukuran gambar:

- radius diambil dari `config.bodyRadius` (per entity),
- posisinya otomatis di tengah karena dihitung dari ukuran objek.

Jadi kalau nanti gambar asli jauh lebih besar atau lebih kecil, tabrakan **tidak** ikut berubah dan
tidak perlu disesuaikan ulang. Jangan pernah memakai ukuran gambar sebagai hitbox.

---

## 7. Kesalahan yang paling sering terjadi

| Gejala | Penyebab umum | Cara memeriksa |
|---|---|---|
| Objek tampil kotak hijau/hitam | Nama gambar tidak ada di gudang | Pastikan key ada di `AssetKeys` + terdaftar di `AssetManifest` + preload dipanggil |
| Animasi tidak jalan | Animasi didaftarkan sebelum placeholder dibuat | Urutan di `Preloader.create()`: `ensurePlaceholders` dulu, baru `ensureAnimations` |
| Placeholder menimpa aset asli | Guard `textures.exists` hilang | Jangan hapus guard di `ensurePlaceholders` |
| `tsc` error "string not assignable to AssetRef" | Entity dipanggil dengan string, bukan hasil `resolve()` | Bungkus dengan `AssetManager.resolve(...)` |
| Perubahan tidak muncul setelah edit gambar | Browser cache / belum refresh | Refresh halaman; gudang gambar kosong setiap refresh |

---

## 8. Urutan baca yang disarankan

1. Dokumen ini (alur & aturan main).
2. `doc/asset-system.md` (API lengkap + peta migrasi atlas).
3. `src/game/config/AssetManifest.ts` (inventaris nyata).
4. `src/game/systems/AssetManager.ts` (implementasi petugas gudang).
