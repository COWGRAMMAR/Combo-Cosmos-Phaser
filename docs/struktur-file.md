# Struktur File — Combo-Cosmos-Phaser

- **Status:** Fase 0 (fondasi class) + InputManager + Fase 1 (bullet foundation) + Fase 2–4 (survival, efek & power-up, dash) + Fase screen/scale/layer/game loop + HUD power-up + Grunt Tipe 1 (pola single/wall/stream, rain berbasis pola, hit flash & ledakan) selesai
- **Tanggal:** 2026-11-18
- **Scope dokumen:** **hanya struktur folder/file**. Rencana class, field, method, dan urutan implementasi ada di `plans/2#-entities-class.md`. Rencana porting arsitektur ada di `plans/1#-bullet-hell-porting.md`. Kontrak bullet system ada di `docs/bullet-system.md`.

Dokumen ini adalah **sumber kebenaran struktur file**. Jika isinya berbeda dengan kondisi repo, struktur dianggap belum selesai dikerjakan.

---

## 1. Struktur Folder Saat Ini (verified 2026-11-18)

```
Combo-Cosmos-Phaser/
├─ index.html
├─ package.json
├─ tsconfig.json
├─ README.md
├─ AGENTS.md
├─ vite/
│  ├─ config.dev.mjs
│  └─ config.prod.mjs
├─ public/
│  └─ assets/                     # sprite, audio, tilemap
├─ plans/
│  ├─ 1#-bullet-hell-porting.md   # (existing)
│  ├─ 2#-entities-class.md        # rencana class Player & Enemy
│  └─ enemy/
│     ├─ Ide Enemy.md             # desain pola gerak & serangan enemy
│     └─ Placeholder Enemy.md     # spesifikasi visual placeholder
├─ issues/                        # (dibuat saat ada bug)
├─ docs/
│  ├─ struktur-file.md            # dokumen ini
│  ├─ bullet-system.md            # kontrak fondasi bullet untuk kerja paralel
│  ├─ asset-system.md             # arsitektur aset: manifest, resolve, animasi, peta migrasi atlas
│  ├─ asset-system-alur-sederhana.md # alur aset sampai render + aturan main (bahasa sederhana, untuk manusia & AI)
│  └─ debug-toggles.md            # daftar tombol debug, efek, isi overlay, cara menambah
└─ src/
   ├─ main.ts                     # bootstrap DOM
   ├─ vite-env.d.ts
   └─ game/
      ├─ main.ts                  # Phaser GameConfig
      ├─ config/
      │  ├─ PlayerConfig.ts       # hp, hitbox, nyawa, weapon, shockwave, atk speed, shield, laser, dash, bomb
      │  ├─ EnemyConfig.ts        # hp musuh, hit flash, ledakan, bullet (speed/radius/pool/margin/lifetime)
      │  ├─ GruntConfig.ts        # hp/radius/despawn/pool + senjata & parameter pola Single/Wall/Stream + rain (termasuk spawnX override)
      │  ├─ EnemyTestConfig.ts    # skenario tes Grunt (single/wall/stream/rain) + reset key opsional
      │  ├─ WorldConfig.ts        # background + flag debug + delay/layout bantu
      │  ├─ ScreenConfig.ts       # sumber kebenaran canvas, play area, panel HUD, spawn
      │  ├─ TimeConfig.ts         # target/batas FPS + fixed step dan batas akumulasi
      │  ├─ DepthConfig.ts        # urutan layer render bernama
      │  ├─ HudConfig.ts          # warna panel, gaya teks, ukuran & offset tata letak HUD
      │  ├─ PauseConfig.ts        # warna/teks placeholder overlay pause
      │  ├─ AssetKeys.ts          # key logis aset (texture) — sumber nama key untuk manifest
      │  ├─ AssetManifest.ts      # data murni: entri file/placeholder, frame, dan tabel animasi
      │  ├─ GameEvents.ts         # konstanta nama event
      │  ├─ InputBindings.ts      # default binding action → key (data-driven)
      │  └─ PowerUpConfig.ts      # konfigurasi sistem power-up (stock, slot, spawn, bobot, item visual)
      ├─ scenes/
      │  ├─ Boot.ts               # preload aset boot lewat AssetManager
      │  ├─ Preloader.ts          # preload aset main + generate placeholder + registrasi animasi
      │  ├─ MainMenu.ts
      │  ├─ Game.ts               # assembler: pool, overlap, update loop, resetRun
      │  ├─ Hud.ts                # scene paralel, dua kamera panel samping (placeholder TEMP)
      │  ├─ Pause.ts              # overlay pause (placeholder TEMP)
      │  └─ GameOver.ts
      ├─ entities/
      │  ├─ BaseEntity.ts         # abstract, extends Phaser.Physics.Arcade.Sprite
      │  ├─ IDamageable.ts        # interface takeDamage
      │  ├─ bullet/
      │  │  ├─ Bullet.ts          # abstract: activate/deactivate/radius (tanpa fisika)
      │  │  ├─ PlayerBullet.ts    # body fisika + damage
      │  │  └─ EnemyBullet.ts     # tanpa body + hook moveStep
      │  ├─ effects/
      │  │  ├─ Shield.ts         # lingkaran placeholder shield di sekitar pemain
      │  │  └─ Shockwave.ts       # ring meluas, membersihkan peluru musuh di radius
      │  ├─ player/
      │  │  ├─ Player.ts          # gerak, nyawa, i-frame, shield, dash
      │  │  ├─ PlayerState.ts     # string enum
      │  │  ├─ PlayerWeapon.ts    # cooldown + jalur tembakan (1–5) + multiplier cooldown
      │  │  └─ PlayerLaser.ts     # laser persisten, damage per interval (bukan pool)
      │  └─ enemy/
      │     ├─ Enemy.ts           # base musuh: hit flash (tint) + event kematian, tanpa asumsi static
      │     ├─ EnemyState.ts      # string enum
      │     ├─ DummyEnemy.ts      # PLACEHOLDER musuh diam untuk uji damage
      │     ├─ Grunt.ts           # musuh Tipe 1: gerak via pattern + tembak + despawn
      │     └─ patterns/
      │        ├─ IMovementPattern.ts # kontrak pola gerak musuh
      │        └─ LinearMovement.ts   # gerak lurus dengan speed + sudut
      ├─ systems/
      │  ├─ AssetManager.ts       # satu pintu aset: preload manifest, placeholder, animasi, resolve key→AssetRef
      │  ├─ InputManager.ts       # implementasi IInputSource di atas KeyboardPlugin
      │  ├─ EnemyBulletManager.ts # satu loop untuk semua peluru musuh (shield-aware)
      │  ├─ EffectManager.ts      # satu timer durasi untuk semua efek (refresh, bukan stack)
      │  ├─ PowerUpManager.ts     # eksekusi efek power-up, delegasi ke buff class + slot manager
      │  ├─ PauseManager.ts       # pause/resume Game+Hud, auto-pause BLUR/HIDDEN
      │  ├─ DebugTools.ts         # tombol debug (F1–F4, Z–N, reset skenario), detail di docs/debug-toggles.md
      │  ├─ power-ups/            # sistem power-up (buff, slot, aktif, spawn)
      │  │  ├─ IPowerUpBuff.ts    # kontrak kelas buff (isValid, getWeight, apply, blocksNormalFire)
      │  │  ├─ PowerUpBuffType.ts # enum tipe buff: Lane, AtkSpeed, Shield, Laser, Nuke, Life
      │  │  ├─ PowerUpCategory.ts # enum kategori: AutoPickup, Slotted
      │  │  ├─ PowerUpSlotManager.ts # inventory slot (3 slot, stack, keybind 1/2/3, Ctrl+1/2/3 buang)
      │  │  ├─ ActiveBuffManager.ts # buff aktif dengan pause/resume durasi + flag blocksNormalFire
      │  │  ├─ PowerUpSpawnManager.ts # timer spawn, pilihan bobot via isValid/getWeight, overlap
      │  │  ├─ LaneBuff.ts        # AutoPickup: tambah jalur tembakan (max 5)
      │  │  ├─ LifeBuff.ts        # AutoPickup: tambah nyawa (max 5)
      │  │  ├─ AtkSpeedBuff.ts    # Slotted: tembak lebih cepat (fire-rate)
      │  │  ├─ ShieldBuff.ts      # Slotted: kebal peluru musuh (shield)
      │  │  ├─ LaserBuff.ts       # Slotted: laser lurus, blokir tembakan biasa
      │  │  └─ NukeBuff.ts        # Slotted: bom instan, damage semua musuh
      │  ├─ effects/
      │  │  └─ EnemyExplosionPool.ts # pool ledakan musuh: membesar + memudar, tanpa tween
      │  └─ enemy/
      │     ├─ GruntPool.ts       # pool prewarm Grunt + group untuk overlap/laser/bom
      │     ├─ GruntTestRunner.ts # skenario tes Grunt tanpa WaveManager
      │     ├─ IGruntFormation.ts  # kontrak formasi spawn tes
      │     ├─ SingleFormation.ts  # pola dasar: satu unit meluncur ke bawah
      │     ├─ RainFormation.ts    # rain: mengulang satu jenis pola dasar
      │     ├─ WallFormation.ts    # pola dasar: satu baris unit, sekali per run
      │     └─ StreamFormation.ts  # pola dasar: satu kolom, unit muncul berurutan
      ├─ ui/
      │  ├─ DebugOverlay.ts       # teks statistik performa, pool, nyawa, status efek & skenario Grunt
      │  ├─ HudManager.ts         # koordinator panel HUD kiri + kanan
      │  ├─ HudLeftPanel.ts       # wadah panel kiri (placeholder untuk ekstensi)
      │  ├─ HudRightPanel.ts      # panel kanan: HP + slot buff + daftar durasi buff
      │  ├─ PowerUpSlotBox.ts     # komponen satu kotak slot buff
      │  └─ ActiveBuffRow.ts      # komponen satu baris durasi buff aktif
      ├─ types/
      │  ├─ Team.ts               # enum Team
      │  ├─ EntityConfig.ts       # interface config konstruktor entity
      │  ├─ AssetRef.ts           # referensi tekstur siap pakai: { texture, frame? }
      │  ├─ InputAction.ts        # enum aksi input lintas layer
      │  ├─ EffectType.ts         # enum jenis efek durasi
      │  ├─ IEnemyBulletSpawner.ts # kontrak spawn peluru musuh untuk entity
      │  ├─ ITargetPosition.ts    # kontrak posisi target tembakan musuh
      │  └─ IInputSource.ts       # kontrak sumber input (tanpa Phaser)
      └─ utils/
         ├─ computeFit.ts         # hitung skala FIT (letterbox) + offset tengah dari ukuran window
         ├─ designCamera.ts       # apply/bind kamera desain: zoom + centerOn + listener resize
         └─ fixedStep.ts          # helper loop fixed timestep (ekstraksi duplikat Game.ts & BaseEntity.ts)
```

---

## 2. Rencana File Fase Berikutnya (BELUM dibuat)

Jangan dianggap ada sampai file-nya benar-benar dibuat.

```
src/game/
├─ entities/enemy/patterns/
│  └─ HomingPattern.ts
├─ systems/
│  ├─ ScoreManager.ts
│  ├─ ComboManager.ts
│  ├─ WaveManager.ts
│  ├─ DifficultyManager.ts
│  ├─ SpawnQueue.ts
│  └─ SkillManager.ts
├─ ui/
│  └─ CooldownIndicator.ts
├─ services/
│  └─ ProfileService.ts
└─ utils/
   └─ math.ts
```

Catatan: `config/GameConfig.ts` dan `entities/projectile/*` dari rencana lama **tidak dipakai**.
Konfigurasi dipisah per domain (`PlayerConfig`, `EnemyConfig`, `WorldConfig`), dan bullet
berada di `entities/bullet/` karena dipakai bersama player dan enemy.

---

## 3. Aturan Penempatan File

| #  | Aturan                                                                                              | Alasan                                   |
| -- | --------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 1  | Satu class = satu file, nama file = nama class (`PascalCase.ts`)                                       | pencarian mudah, diff git bersih         |
| 2  | Arah dependensi folder: `scenes → systems → entities → types/utils/config`; `entities` tidak boleh import `systems`/`scenes` | anti circular import                     |
| 3  | Tanpa barrel `index.ts` sampai benar-benar diperlukan                                                 | barrel memicu circular import + HMR lambat |
| 4  | Maksimal 3 level folder di bawah `src/game/`; kedalaman terdalam yang diizinkan adalah `entities/enemy/patterns/` | lebih dari itu = pembagian tanggung jawab salah |
| 5  | Folder sistem memakai `src/game/systems/`, **bukan** `src/core/`                                       | keputusan desain (lihat plan entities)   |
| 6  | **Setiap penambahan/penghapusan/perpindahan file atau folder wajib langsung memperbarui dokumen ini**   | dokumen ini jadi sumber kebenaran struktur |
| 7  | Semua nilai yang bisa di-tuning (balance, keybind, asset key, nama event, timing, ukuran/warna, tabel wave/spawn) wajib di `config/`; `scenes/`, `entities/`, `systems/` dilarang menyimpan magic number/string untuk nilai tersebut | data-driven, mudah diubah tanpa menyentuh logika |
| 8  | `config/` hanya data murni (`as const`), tanpa logika, object Phaser, atau side effect; boleh import dari `types/` saja | config tetap deklaratif dan aman diimpor |
| 9  | `types/` adalah lapisan terbawah: vocabulary/interface/enum lintas layer; tidak boleh import `config/`/`systems/`/`entities/`/`scenes/` | mencegah dependensi melingkar |
| 10 | Nilai runtime (hp saat ini, score, combo) **bukan** config | state berubah tiap frame, bukan data desain |
| 11 | Peluru pemain memakai body Arcade Physics; peluru musuh **tanpa body** dan dihitung manual oleh `EnemyBulletManager` | ribuan peluru musuh tetap ringan |
| 12 | Pool diisi (prewarm) saat konstruksi, lalu di-cache sebagai array; hot loop memakai `for` biasa | tidak ada alokasi object/array per frame |
| 13 | Jangan `destroy()` objek pool; pakai `setActive(false)` + `setVisible(false)` (+ `body.enable = false` bila punya body) | objek dipakai ulang tanpa GC pressure |
| 14 | Semua efek berdurasi memakai satu `EffectManager` (delta-driven); pickup ulang me-refresh durasi, bukan menumpuk | satu sumber timer, pause & reset konsisten |
| 15 | Efek yang butuh objek sendiri (laser, shockwave) tetap dikelola `Game`, bukan lewat pool bullet | jelas mana yang pool, mana yang objek tunggal |

---

## 4. Referensi

- Kontrak bullet system & aturan performa: `docs/bullet-system.md`
- Arsitektur aset & peta migrasi atlas: `docs/asset-system.md`
- Alur aset sampai render (versi sederhana): `docs/asset-system-alur-sederhana.md`
- Daftar tombol debug (F1–F4, Z–N) & isi overlay: `docs/debug-toggles.md`
- Panduan build: `docs/build.md`
- Rencana class & implementasi: `plans/2#-entities-class.md`
- Rencana porting arsitektur (pooling, wave, difficulty, skill, profile): `plans/1#-bullet-hell-porting.md`
