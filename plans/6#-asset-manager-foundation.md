# 6# — Fondasi Asset Manager (placeholder → atlas spritesheet)

**Status:** menunggu eksekusi (sudah di-ACC arah & keputusannya)
**Branch:** `COW's-Branch`
**Tujuan:** satu pintu untuk semua aset ber-key, dengan pemisahan *logical key → manifest → resolve → `{ texture, frame }`*, supaya migrasi dari placeholder hasil `generateTexture` ke atlas spritesheet nanti **cuma mengubah config**, bukan membongkar entity/weapon/bullet manager.

---

## 1. Keputusan yang sudah final

| # | Keputusan | Nilai |
| - | --------- | ----- |
| 1 | Scope fase | A + B + B2 + C saja (tanpa abstraksi `file` provider tambahan) |
| 2 | `resolve()` | Fungsi **murni & static**, tanpa `scene` (mudah dites) |
| 3 | Animasi | Disertakan 1 anim placeholder — lihat §5 |
| 4 | `utils/textures.ts` | **Dihapus**, resep pindah jadi private const di `AssetManager` |
| 5 | Hitbox | **Di luar scope**. Hitbox sudah config-driven (`config.bodyRadius`), ukuran sprite tidak boleh memengaruhi body |

---

## 2. Kenapa desainnya begini (4 seam anti-bongkar)

1. **Logical key ≠ physical key.** `AssetKeys.Player = 'player'` tetap dipakai konsumen selamanya. Yang berubah saat migrasi hanya isi `AssetManifest`.
2. **Provider.** `AssetManifest` punya field `source: 'file' | 'generated'`. Placeholder `generateTexture` adalah salah satu sumber, bukan satu-satunya jalur. Migrasi atlas = tambah `'atlas'`, ubah tabel.
3. **`frame` sejak hari pertama.** `AssetRef = { texture, frame? }`. Semua entity menerima `AssetRef`, bukan `string`. Saat atlas datang, frame tinggal diisi — tidak ada perubahan signature di 5 file.
4. **Animasi didaftarkan manager.** `ensureAnimations()` ada sekarang; entity memanggil `play()` lewat kunci dari config.

---

## 3. Batasan teknis yang WAJIB dipatuhi (hasil verifikasi kode)

### 3.1 `Group.classType` — peluru TIDAK boleh ganti signature

`PlayerBullet` dan `EnemyBullet` diinstansiasi oleh Phaser `Group` lewat `group.create(x, y, texture, frame)`, jadi signature constructor-nya **terkunci** `(scene, x, y, texture, frame)`.

- `Bullet.ts:17-26` sudah punya `frame?: string | number` → `super(scene, x, y, texture, frame)`.
- `PlayerBullet.ts:20` dan `EnemyBullet.ts:55` sudah menerima `frame?`.
- Artinya **seam `frame` di peluru sudah ada**; yang perlu diubah hanya *call site*-nya:
  - `PlayerWeapon.ts:41` → `group.create(x, y, ref.texture, ref.frame)`
  - `EnemyBulletManager.ts:54` → sama
- `defaultKey: AssetKeys.PlayerBullet` (`PlayerWeapon.ts:36`) dan `AssetKeys.EnemyBullet` (`EnemyBulletManager.ts:49`) diganti menjadi `AssetRef` hasil `AssetManager.resolve(...)`, atau tetap key + resolve di tempat create. **Pilih: simpan `AssetRef`** agar satu kali resolve.

### 3.2 Entity non-pool — boleh terima `AssetRef`

`BaseEntity.ts:18-20` sekarang `constructor(scene, x, y, texture: string, config)` → `super(scene, x, y, texture)`. Ini **satu-satunya** tempat yang perlu diubah, lalu semua turunannya ikut:

| File | Baris | Perubahan |
| ---- | ----- | --------- |
| `src/game/entities/BaseEntity.ts` | 18, 20 | `texture: string` → `asset: AssetRef`; `super(scene, x, y, asset.texture, asset.frame)` |
| `src/game/entities/player/Player.ts` | 37, 43 | param `texture` → `asset: AssetRef`; teruskan `asset` |
| `src/game/entities/enemy/Enemy.ts` | 13, 15 | sama |
| `src/game/entities/enemy/DummyEnemy.ts` | 15, 17 | sama |
| `src/game/scenes/Game.ts` | 193, 199 | `new Player(..., AssetManager.resolve(AssetKeys.Player), ...)`, `new DummyEnemy(..., AssetManager.resolve(AssetKeys.Enemy))` |

### 3.3 Hitbox tidak disentuh

`BaseEntity.ts:32-39` memakai `config.bodyRadius` untuk radius, dan `this.width / 2` hanya untuk offset penempatan circle. Offset itu self-adjusting → ganti ukuran sprite tidak menggeser/mengubah hitbox. **Tidak ada perubahan di sini.**

Catatan (bukan task): `PlayerBullet.ts:28` memakai `PlayerConfig.weapon.bulletRadius` untuk body, sementara tekstur placeholder memakai angka yang sama. Setelah migrasi atlas, body tetap config — aman.

---

## 4. Perubahan file

### 4.1 BARU — `src/game/types/AssetRef.ts`

```ts
/** Referensi aset hasil resolve: tekstur + frame opsional. */
export interface AssetRef
{
    /** Key tekstur yang sudah terdaftar di TextureManager. */
    readonly texture: string;
    /** Nama/indeks frame di dalam tekstur (kosong = frame default). */
    readonly frame?: string | number;
}
```

Lapisan `types/` → aman diimpor entity (tidak melanggar arah dependensi).

### 4.2 UBAH — `src/game/config/AssetKeys.ts`

Tambah 3 key (tetap flat `as const`):

```ts
Background: 'background',
Logo: 'logo',
/** Frame kedua placeholder player; dihapus saat migrasi atlas. */
PlayerIdleAlt: 'player-idle-alt',
```

`Background` & `Logo` menutup celah literal `'background'`/`'logo'` yang sekarang dipakai di 4 tempat.

### 4.3 BARU — `src/game/config/AssetManifest.ts`

Data murni `as const`. Key diambil dari `AssetKeys` lewat **`import type`** saja (type-only import, tanpa dependency runtime → `config/` tetap bebas side effect sesuai aturan 8).

```ts
export type AssetSource = 'file' | 'generated';

/** Entri aset yang dimuat dari file statis. */
export interface AssetFileEntry { readonly key: AssetKey; readonly source: 'file'; readonly path: string; }
/** Entri aset placeholder yang digenerate runtime. */
export interface AssetGeneratedEntry { readonly key: AssetKey; readonly source: 'generated'; readonly frameCount: 1 | 2; }

export const AssetManifest = {
    /** Dimuat di Boot. */
    boot: [ { key: AssetKeys.Background, source: 'file', path: 'assets/bg.png' } ],
    /** Dimuat di Preloader. */
    main: [ { key: AssetKeys.Logo, source: 'file', path: 'assets/logo.png' } ],
    /** Digenerate saat Preloader.create(). */
    placeholders: [
        { key: AssetKeys.Player,      source: 'generated', frameCount: 2 },
        { key: AssetKeys.PlayerIdleAlt, source: 'generated', frameCount: 1 },
        { key: AssetKeys.Enemy,       source: 'generated', frameCount: 1 },
        { key: AssetKeys.PlayerBullet,source: 'generated', frameCount: 1 },
        { key: AssetKeys.EnemyBullet, source: 'generated', frameCount: 1 },
    ],
    animations: {
        playerIdle: {
            key: 'player-idle',
            frames: [
                { texture: AssetKeys.Player },
                { texture: AssetKeys.PlayerIdleAlt },
            ],
            frameRate: 2,
            repeat: -1,
        },
    },
} as const;

/** Kunci animasi yang dipakai entity. */
export const AnimKeys = { PlayerIdle: AssetManifest.animations.playerIdle.key } as const;
```

> Catatan migrasi: saat atlas datang, `animations.playerIdle.frames` menjadi `[{ texture: '<atlas>', frame: 'player-idle-0' }, ...]` dan `PlayerIdleAlt` dihapus. **Kode entity tidak berubah.**

### 4.4 BARU — `src/game/systems/AssetManager.ts`

Class static, tanpa state (state aset sebenarnya ada di Phaser `TextureManager` global).

| Method | Perilaku |
| ------ | -------- |
| `preloadBoot(scene)` | Loop `AssetManifest.boot` → `scene.load.image(entry.key, entry.path)` |
| `preloadMain(scene)` | Loop `AssetManifest.main` → sama |
| `ensurePlaceholders(scene)` | Loop `AssetManifest.placeholders`; guard `scene.textures.exists(key)`; panggil resep private per key |
| `ensureAnimations(scene)` | Loop `AssetManifest.animations`; guard `scene.anims.exists(key)`; `scene.anims.create({ key, frames, frameRate, repeat })` |
| `resolve(key: AssetKey): AssetRef` | **Murni**: `{ texture: key, frame: entry?.frame }`. Sekarang nyaris identitas — justru itulah choke point-nya |
| `has(key: AssetKey): boolean` | `scene`-free tidak bisa; **drop** — pakai `resolve` + cek di tempat perlu |

Resep placeholder = private const di file ini (pindahan dari `utils/textures.ts`), semuanya lewat `scene.make.graphics({}, false)` + `generateTexture` + `graphics.destroy()`, memakai `TEXTURE_SIZE = 48` dan warna dari `PlayerConfig`/`EnemyConfig` seperti sekarang. Wajib ber-JSDoc Bahasa Indonesia.

Import yang diizinkan: `config/` (AssetKeys, AssetManifest, PlayerConfig, EnemyConfig), `types/AssetRef`, `phaser`. Tidak import `entities/` atau `scenes/`.

### 4.5 HAPUS — `src/game/utils/textures.ts`

Resep pindah ke §4.4. Satu-satunya pemanggil (`Preloader.ts:62`) diganti `AssetManager.ensurePlaceholders(this)`.

### 4.6 UBAH — `src/game/scenes/Boot.ts`

- `:17` `this.load.image('background', 'assets/bg.png')` → `AssetManager.preloadBoot(this)`.

### 4.7 UBAH — `src/game/scenes/Preloader.ts`

- `:51` hapus `this.load.setPath('assets')`.
- `:53` `this.load.image('logo', 'logo.png')` → `AssetManager.preloadMain(this)`.
- `:24` `add.image(..., 'background')` → `AssetKeys.Background`.
- `:62` `createPlaceholderTextures(this)` → `AssetManager.ensurePlaceholders(this)` lalu `AssetManager.ensureAnimations(this)`.

### 4.8 UBAH — literal key di scene lain

| File | Baris | Perubahan |
| ---- | ----- | --------- |
| `src/game/scenes/MainMenu.ts` | 25 | `'background'` → `AssetKeys.Background` |
| `src/game/scenes/MainMenu.ts` | 27 | `'logo'` → `AssetKeys.Logo` |
| `src/game/scenes/GameOver.ts` | 25 | `'background'` → `AssetKeys.Background` |

### 4.9 UBAH — `src/game/entities/player/Player.ts`

Tambah di constructor setelah `super(...)`:
```ts
this.play(AnimKeys.PlayerIdle);
```
`Player` boleh import `config/` (arah dependensi sah). Animasi hanya mengganti frame; logika `setAlpha` untuk dash/invuln (`:225, :267, :276, :281`) tidak terpengaruh karena alpha ≠ frame.

### 4.10 UBAH — `doc/struktur-file.md`

- `utils/` → hapus `textures.ts`.
- `systems/` → tambah `AssetManager.ts`.
- `config/` → tambah `AssetManifest.ts`.
- `types/` → tambah `AssetRef.ts`.

---

## 5. Animasi placeholder yang dipakai

**`player-idle`** — 2 frame, `frameRate: 2` (500 ms/frame), `repeat: -1`.
Frame 0 = segitiga player sekarang; frame 1 = `player-idle-alt`, segitiga sama dengan warna sedikit lebih terang (bob/brightness halus). Efek visual sangat kecil dan memang cuma untuk membuktikan pipeline `ensureAnimations` bukan dead code.

Alasan tidak pakai tint/alpha: animasi frame-based tidak bertabrakan dengan `setAlpha` yang sudah dipakai blink invulnerability & dash.

Alternatif yang **tidak** dipilih: menggambar 2 frame di satu `CanvasTexture` (paling mirip atlas, tapi menambah API baru `createCanvas`/`refresh` untuk kode yang akan dihapus saat migrasi).

---

## 6. Urutan eksekusi

1. `types/AssetRef.ts` (baru)
2. `config/AssetKeys.ts` (+3 key)
3. `config/AssetManifest.ts` (baru)
4. `systems/AssetManager.ts` (baru, termasuk resep pindahan)
5. `entities/BaseEntity.ts` → `AssetRef`
6. `Player.ts`, `Enemy.ts`, `DummyEnemy.ts` → `AssetRef`
7. `PlayerWeapon.ts`, `EnemyBulletManager.ts` → resolve + pakai `frame`
8. `Game.ts` call site
9. `Boot.ts`, `Preloader.ts`, `MainMenu.ts`, `GameOver.ts`
10. `Player.ts` → `play(AnimKeys.PlayerIdle)`
11. hapus `utils/textures.ts`
12. `doc/struktur-file.md`
13. JSDoc Bahasa Indonesia di semua file yang disentuh
14. Type-check

---

## 7. Verifikasi

- `node "node_modules\typescript\bin\tsc" --noEmit` → exit 0.
- `grep` memastikan **tidak ada lagi** literal `'background'` / `'logo'` di `src/`, dan tidak ada sisa import `utils/textures`.
- Build (`npm run build`) **menunggu izin user** — rule: jangan build tanpa konfirmasi.
- Smoke test manual (kalau dev server bisa jalan): Preloader progress bar tetap penuh, MainMenu menampilkan bg+logo, player tampak berkedip halus (anim), peluru tetap tampil & menembak, dummy enemy bisa ditembak.

---

## 8. Di luar scope (sengaja)

- Atlas loader / `load.atlas` / `load.spritesheet` — belum ada asetnya.
- Migrasi `Shield`/`Shockwave`/`PlayerLaser`/ikon power-up dari Graphics ke texture ber-key (plans `3#`/`4#`/`5#` domain).
- Hitbox / body sizing (sudah config-driven).
- `kind: 'atlas'` di manifest — ditambah saat migrasi.
- Audio.

## 9. Risiko

| Risiko | Mitigasi |
| ------ | -------- |
| `Group.classType` menolak `AssetRef` | Sudah dipastikan peluru tetap `(scene,x,y,texture,frame)`; hanya `frame` yang diteruskan |
| Animasi gagal karena frame alt belum tergenerate | `ensurePlaceholders` selalu dipanggil sebelum `ensureAnimations` |
| Tekstur placeholder menimpa aset asli saat migrasi bertahap | Semua resep tetap dijaga `scene.textures.exists(key)` |
| `AssetManifest` mengimpor `AssetKeys` melanggar aturan 8 | Hanya `import type` — nol dependency runtime |
