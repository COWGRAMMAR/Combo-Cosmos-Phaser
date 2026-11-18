# Asset System — Fondasi (Plan #6)

Dokumen ini untuk yang nanti mengganti placeholder Phaser dengan aset asli (PNG / atlas sprite sheet).
Tujuannya: migrasi aset **tidak** membongkar entity, pool peluru, atau scene.

- **Status:** fondasi selesai (`plans/6#-asset-manager-foundation.md`)
- **Belum ada:** loader atlas, audio, ikon power-up berbasis tekstur
- **Validasi:** `node "node_modules\typescript\bin\tsc" --noEmit` (exit 0)

---

## 1. Masalah yang diselesaikan

Sebelum plan #6, aset tersebar:

- `Boot.ts` memanggil `this.load.image('background', 'assets/bg.png')` (path literal).
- `Preloader.ts` memanggil `this.load.setPath('assets')` lalu `load.image('logo', 'logo.png')`.
- `AssetKeys.ts` hanya mengenal 4 key; `background` dan `logo` tidak terdaftar.
- Placeholder dibuat oleh free function `utils/textures.ts` yang dipanggil langsung oleh scene.
- Scene tahu urutan aset; tidak ada tempat tunggal untuk bertanya "key ini teksturnya apa?".

Sekarang semua jalur lewat satu pintu: **logical key → manifest → `resolve()` → `{ texture, frame? }`**.

---

## 2. Arsitektur

```
config/AssetKeys.ts        nama key logis (stabil, tidak berubah saat migrasi)
        │
config/AssetManifest.ts    data murni: entri file / placeholder / animasi
        │
systems/AssetManager.ts    preload · ensurePlaceholders · ensureAnimations · resolve
        │
        ├─ scene (composition root)  → AssetManager.preloadBoot/preloadMain/ensure*
        └─ AssetRef { texture, frame? } → BaseEntity / PlayerWeapon / EnemyBulletManager
```

### Empat seam anti-rework

| Seam | Isi | Kenapa penting |
|---|---|---|
| 1. Logical key ≠ physical key | `AssetKeys.Player` tetap `'player'` selamanya | Migrasi hanya mengubah isi manifest, bukan pemanggil |
| 2. Provider (`source`) | Entri punya `source: 'file' \| 'generated'` | Placeholder dan file asli memakai jalur berbeda tanpa mengubah kontrak |
| 3. `frame` sejak awal | `AssetRef = { texture, frame? }`, bukan `string` | Atlas nanti cukup mengisi `frame`; signature entity/pool tidak berubah |
| 4. Animasi lewat manager | `ensureAnimations()` membaca tabel manifest | Menambah/mengganti frame animasi tidak menyentuh entity |

### Kenapa `AssetManager` static & tanpa state

Data aset sebenarnya hidup di `TextureManager` dan `AnimationManager` milik Phaser (global per game).
Menyimpan state sendiri akan menduplikasi kebenaran, jadi class ini hanya berisi fungsi statis.
Idempotensi dijaga lewat `textures.exists()` dan `anims.exists()`.

---

## 3. Peta file

```
src/game/
├─ config/
│  ├─ AssetKeys.ts        # 7 key logis + tipe AssetKey
│  └─ AssetManifest.ts    # AssetManifest (boot/main/placeholders/animations) + AnimKeys
├─ systems/
│  └─ AssetManager.ts     # API tunggal aset; juga menyimpan resep placeholder
├─ types/
│  └─ AssetRef.ts         # { readonly texture: string; readonly frame?: string | number }
└─ scenes/
   ├─ Boot.ts             # AssetManager.preloadBoot(this)
   ├─ Preloader.ts        # preloadMain + ensurePlaceholders + ensureAnimations
   ├─ MainMenu.ts         # AssetKeys.Background, AssetKeys.Logo
   └─ GameOver.ts         # AssetKeys.Background
```

`utils/textures.ts` **sudah dihapus**; resepnya pindah ke `PLACEHOLDER_RECIPES` di `AssetManager`.

---

## 4. API

| Method | Fungsi | Dipanggil dari |
|---|---|---|
| `AssetManager.preloadBoot(scene)` | Daftarkan `AssetManifest.boot` ke loader | `Boot.preload()` |
| `AssetManager.preloadMain(scene)` | Daftarkan `AssetManifest.main` ke loader | `Preloader.preload()` |
| `AssetManager.ensurePlaceholders(scene)` | Buat tekstur placeholder yang belum ada | `Preloader.create()` |
| `AssetManager.ensureAnimations(scene)` | Daftarkan animasi global (idempotent) | `Preloader.create()` setelah `ensurePlaceholders` |
| `AssetManager.resolve(key)` | `AssetKey` → `AssetRef` | scene / systems (composition root) |

### Urutan wajib di Preloader

```ts
AssetManager.ensurePlaceholders(this);
AssetManager.ensureAnimations(this); // frame animasi harus sudah ada
```

### Aturan dependensi (penting)

`doc/struktur-file.md` melarang `entities/` meng-import `systems/`. Karena itu:

- **entities** (`Player`, `Enemy`, `DummyEnemy`, `PlayerWeapon`) menerima `AssetRef` sebagai parameter.
- **scene** (`Game.ts`) yang memanggil `AssetManager.resolve(...)` dan meneruskannya.
- **systems** (`EnemyBulletManager`) boleh memanggil `AssetManager` langsung.

```ts
// Game.ts (composition root)
this.weapon = new PlayerWeapon(this, AssetManager.resolve(AssetKeys.PlayerBullet));
this.player = new Player(this, x, y, AssetManager.resolve(AssetKeys.Player), config, input, this.weapon);
this.dummy  = new DummyEnemy(this, x, y, AssetManager.resolve(AssetKeys.Enemy));
```

### Menambah aset baru (placeholder)

1. Tambah key di `config/AssetKeys.ts`.
2. Daftarkan entri di `config/AssetManifest.ts` (`source: 'generated'`, `frameCount: 1`).
3. Tambah resep di `PLACEHOLDER_RECIPES` (`AssetManager.ts`).
4. Pakai lewat `AssetManager.resolve(...)` di composition root.

Kalau nanti asetnya datang dari file, cukup ubah entri manifest menjadi
`{ key, source: 'file', path: 'assets/nama.png' }` — pemanggil tidak berubah.

### Menambah animasi

Tambahkan entri di `AssetManifest.animations`, ekspos key-nya lewat `AnimKeys`, lalu
`this.play(AnimKeys.X)` di entity. Contoh yang ada: `player-idle` (2 frame, 2 fps, repeat -1).

---

## 5. Siapa mengonsumsi apa

| Konsumen | Key | Cara |
|---|---|---|
| `Game.ts` → `Player` | `AssetKeys.Player` | `resolve()` → constructor `AssetRef` |
| `Game.ts` → `DummyEnemy` | `AssetKeys.Enemy` | `resolve()` → constructor `AssetRef` |
| `Game.ts` → `PlayerWeapon` | `AssetKeys.PlayerBullet` | `resolve()` → constructor `AssetRef` → `group.create(x, y, texture, frame)` |
| `EnemyBulletManager` | `AssetKeys.EnemyBullet` | `resolve()` internal di constructor |
| `Preloader` | `AssetKeys.Background` | `add.image(...)` |
| `MainMenu` | `AssetKeys.Background`, `AssetKeys.Logo` | `add.image(...)` |
| `GameOver` | `AssetKeys.Background` | `add.image(...)` |
| `Player` | `AnimKeys.PlayerIdle` | `this.play(...)` |

Catatan: `PlayerBullet`/`EnemyBullet` dibuat oleh Phaser `Group`, jadi constructor-nya terkunci
pada `(scene, x, y, texture, frame)`. `frame` diteruskan lewat `group.create(...)`, bukan lewat `AssetRef`
di dalam bullet.

---

## 6. Peta migrasi ke aset asli

### 6.1 Ringkasan per aset

| Key | Placeholder sekarang | Bentuk aset asli yang disarankan | Dampak kode |
|---|---|---|---|
| `Player` + `PlayerIdleAlt` | 2 tekstur 48×48, animasi `player-idle` | 1 atlas dengan frame `idle-0`, `idle-1`, dst. | Hapus `PlayerIdleAlt`, ubah `frames` animasi ke `{ texture: '<atlas>', frame: 'idle-0' }` |
| `Enemy` | lingkaran kuning 48×48 | sprite musuh (boleh dari atlas yang sama) | Tidak ada |
| `PlayerBullet` | lingkaran radius `PlayerConfig.weapon.bulletRadius` | sprite peluru kecil | Tidak ada |
| `EnemyBullet` | lingkaran radius `EnemyConfig.bullet.radius` | sprite peluru musuh | Tidak ada |
| `Background` | `public/assets/bg.png` | artwork final (ukuran sama atau di-scale di scene) | Tidak ada |
| `Logo` | `public/assets/logo.png` | logo final | Tidak ada |

### 6.2 Langkah migrasi (urutan yang aman)

1. **Tambahkan provider atlas.** `AssetSource` saat ini hanya `'file' | 'generated'`.
   Perluas menjadi `'file' | 'generated' | 'atlas'`, lalu di `AssetManager.loadEntries`
   tambahkan `scene.load.atlas(key, imagePath, jsonPath)` untuk entri atlas.
2. **Isi `path`/frame di manifest** untuk key yang sudah punya aset asli, misalnya
   `{ key: AssetKeys.PlayerBullet, source: 'atlas', path: 'assets/atlas-game.png', frame: 'bullet-player' }`.
3. **Hapus entri dari `AssetManifest.placeholders`** untuk key yang sudah punya file.
   Ini otomatis mematikan `ensurePlaceholders` untuk key tersebut, tapi guard `textures.exists`
   tetap menjaga keamanan kalau entri lupa dihapus.
4. **Ganti frame animasi** ke atlas:
   `frames: [{ texture: '<atlas>', frame: 'idle-0' }, { texture: '<atlas>', frame: 'idle-1' }]`.
5. **Hapus key sementara** seperti `PlayerIdleAlt` beserta resepnya setelah tidak dipakai.
6. **Ganti `Background`/`Logo`** dari `source: 'file'` ke file final (nama path boleh sama,
   isi file diganti) atau ke atlas bila dipaketkan.
7. Jalankan `node "node_modules\typescript\bin\tsc" --noEmit`, lalu smoke test:
   preloader, menu, pemain beranimasi, peluru pemain & musuh, game over.

### 6.3 Apa yang TIDAK perlu diubah saat migrasi

- Signature `BaseEntity`, `Player`, `Enemy`, `DummyEnemy` (sudah menerima `AssetRef`).
- Constructor `PlayerBullet`/`EnemyBullet` (tetap `texture, frame`).
- `PlayerWeapon`/`EnemyBulletManager` (sudah menyimpan `AssetRef` dan meneruskan `frame`).
- Ukuran hitbox (lihat bagian 8).

---

## 7. Yang TIDAK termasuk sistem ini

Ini masih digambar langsung dengan Graphics/Shape setiap frame, **bukan** aset ber-key:

- `entities/effects/Shield.ts` (lingkaran shield, radius berubah per frame)
- `entities/effects/Shockwave.ts` (ring meluas)
- `entities/player/PlayerLaser.ts` (rectangle beam)
- Ikon/tanda power-up di `PowerUpSpawnManager` (`add.circle`)
- Semua teks & panel UI (`Hud`, `Pause`, `MainMenu`, `DebugOverlay`)

Migrasinya akan butuh animasi/`RenderTexture` dan masuk ke plan terpisah (ranah plan #3/#4/#5),
bukan bagian dari fondasi ini.

---

## 8. Hitbox terpisah dari ukuran sprite

`BaseEntity` memakai `config.bodyRadius`:

```ts
body.setCircle(
    config.bodyRadius,
    this.width / 2 - config.bodyRadius,
    this.height / 2 - config.bodyRadius
);
```

Offset dihitung dari `this.width`/`this.height`, jadi saat tekstur asli lebih besar/kecil,
body tetap **terpusat** dan radiusnya tetap mengikuti config. Tidak ada ukuran sprite yang
boleh dipakai sebagai hitbox. `TEXTURE_SIZE = 48` di `AssetManager` hanya ukuran kanvas placeholder.

---

## 9. Checklist verifikasi

- `node "node_modules\typescript\bin\tsc" --noEmit` → exit 0
- Tidak ada literal `'background'`/`'logo'` di `src/` selain definisi di `AssetKeys.ts`
- Tidak ada import dari `utils/textures`
- Preloader menampilkan progress bar, MainMenu menampilkan background + logo
- Pemain berdenyut halus (animasi `player-idle`), peluru keluar dari pool tanpa objek baru
