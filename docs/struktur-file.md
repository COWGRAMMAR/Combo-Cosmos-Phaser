# Struktur File — Combo-Cosmos-Phaser

- **Status:** Fase 0 (fondasi class) + InputManager + Fase 1 (bullet foundation) + Fase 2–4 (survival, efek & power-up, dash) + Fase screen/scale/layer/game loop + HUD power-up + Grunt Tipe 1 (pola single/wall/stream, rain berbasis pola, hit flash & ledakan) + power-up item movement (3 pola gerak, pool 50, pickup berbasis jarak & kapasitas inventory) + dynamic spawn zone (zona 300×300 berpindah tiap 2 item, jarak minimum 150 px dari player, straight diagonal, despawn 4 sisi) + pemisahan config power-up ke 4 domain (render/item/spawn/movement) & DebugConfig terpusat + fondasi bahasa (LanguageManager, JSON terjemahan, TranslatedText, script `lang:check`) + **combo & score system (Tahap 1: mesin murni tanpa enemy)** + **HUD Kiri (skor, combo, pengali, dash) + HudDataProvider + IHudGameSource** selesai
- **Tanggal:** 2026-11-20
- **Scope dokumen:** **hanya struktur folder/file**. Rencana class, field, method, dan urutan implementasi ada di `plans/2#-entities-class.md`. Rencana porting arsitektur ada di `plans/1#-bullet-hell-porting.md`. Kontrak bullet system ada di `docs/bullet-system.md`.

Dokumen ini adalah **sumber kebenaran struktur file**. Jika isinya berbeda dengan kondisi repo, struktur dianggap belum selesai dikerjakan.

---

## 1. Struktur Folder Saat Ini (verified 2026-11-20)

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
├─ scripts/
│  └─ check-language-keys.mjs     # pembanding key en vs id (`npm run lang:check`)
├─ plans/
│  ├─ 1#-bullet-hell-porting.md   # (existing)
│  ├─ 2#-entities-class.md        # rencana class Player & Enemy
│  ├─ 8#-language-foundation.md   # plan fondasi bahasa (ACC 2026-11-20)
│  └─ enemy/
│     ├─ Ide Enemy.md             # desain pola gerak & serangan enemy
│     └─ Placeholder Enemy.md     # spesifikasi visual placeholder
├─ issues/                        # (dibuat saat ada bug)
├─ docs/
│  ├─ struktur-file.md            # dokumen ini
│  ├─ bullet-system.md            # kontrak fondasi bullet untuk kerja paralel
│  ├─ asset-system.md             # arsitektur aset: manifest, resolve, animasi, peta migrasi atlas
│  ├─ asset-system-alur-sederhana.md # alur aset sampai render + aturan main (bahasa sederhana, untuk manusia & AI)
│  ├─ panduan-uji-grunt.md        # cara memunculkan Grunt, checklist verifikasi, tuning cepat
│  ├─ debug-toggles.md            # daftar tombol debug, efek, isi overlay, cara menambah
│  ├─ language.md                 # kontrak bahasa: pemakaian TranslatedText, konvensi key, aturan restart, larangan teks di gambar
│  └─ hud-system.md               # dokumentasi HUD untuk designer: arsitektur, HudConfig, language keys, TranslatedText, workflow modifikasi UI-only
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
      │  ├─ WorldConfig.ts        # background, letterbox, delay game over, frame play area
      │  ├─ ScreenConfig.ts       # sumber kebenaran canvas, play area, panel HUD, spawn
      │  ├─ TimeConfig.ts         # target/batas FPS + fixed step dan batas akumulasi
      │  ├─ DepthConfig.ts        # urutan layer render bernama
      │  ├─ HudConfig.ts          # HUD nested domain: label (shared) → left (score/combo/multiplier/dash dgn x,y,bar) → right (hp/slot/buffRow dgn x,y); single source untuk semua visual HUD
      │  ├─ PauseConfig.ts        # warna & gaya teks overlay pause (teksnya dari file bahasa)
      │  ├─ AssetKeys.ts          # key logis aset (texture) — sumber nama key untuk manifest
      │  ├─ AssetManifest.ts      # data murni: entri file/placeholder, frame, dan tabel animasi
      │  ├─ GameEvents.ts         # konstanta nama event
      │  ├─ InputBindings.ts      # default binding action → key (data-driven)
      │  ├─ PowerUpConfig.ts      # power-up 4 domain: render (visual item, ikon) → item (slot, stack, pickup, pool, interval) → spawn (spawnZone, jarak aman player, bobot) → movement (kantong pola + rentang speed/amp/ampY/freq/sudut)
      │  ├─ DebugConfig.ts        # sumber tunggal debug: enabled, key F1–F4, digit 8, Z–N, jumlah stress, styling grafis jalur/zona/ring/arah
      │  ├─ ComboScoreConfig.ts  # config combo & skor: timerMs, tier multiplier (int), nukeComboCap, base per tier, grazeValue, bonusLaser/Ram, itemPickupScore, buffActivateScore, nukeRatio; types EnemyTier, DamageSource
│  ├─ IHudGameSource.ts    # kontrak 4 getter sumber data HUD (Game scene wajib implementasikan)
│  └─ language/             # sumber kebenaran bahasa (config + data JSON)
      │     ├─ LanguageConfig.ts  # daftar bahasa, default, fallback, storageKey
      │     ├─ en.json            # terjemahan Inggris (flat, key bertitik)
      │     └─ id.json            # terjemahan Indonesia (struktur key identik)
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
      │     ├─ DummyEnemy.ts      # alat debug musuh diam; TIDAK di-wire ke Game
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
      │  ├─ DebugTools.ts         # tombol debug + visual jalur item, kotak zona spawn, ring jarak player, garis arah straight; semua key & styling dari DebugConfig (detail di docs/debug-toggles.md)
      │  ├─ LanguageManager.ts    # bahasa aktif: t(), setLanguage(), toggleLanguage(), storage try/catch, emit LANGUAGE_CHANGED
      │  ├─ ScoreSystem.ts        # mesin combo & skor murni (tanpa Phaser): combo, timer fixed-step, tier multiplier, scoring integer math, batch nuke, API: registerKill/addGraze/addFlat/onPlayerHit/beginBatch/endBatch/update/reset + getters read-only
│  ├─ HudDataProvider.ts    # pintu baca HUD read-only: bungkus IHudGameSource, ekspos skor/combo/multiplier/timer, nyawa/dash, slot/buff aktif; tanpa mutasi, tanpa Phaser, tanpa alokasi per frame
      │  ├─ power-ups/            # sistem power-up (buff, slot, aktif, spawn)
      │  │  ├─ IPowerUpBuff.ts    # kontrak kelas buff (isValid, getWeight, apply, blocksNormalFire)
      │  │  ├─ PowerUpBuffType.ts # enum tipe buff: Lane, AtkSpeed, Shield, Laser, Nuke, Life
      │  │  ├─ PowerUpCategory.ts # enum kategori: AutoPickup, Slotted
│  │  ├─ PowerUpItem.ts      # satu item di dunia: pola gerak, base posisi, reset()/advance()/predict()/setBlocked(), getter pola & sudut
│  │  ├─ PowerUpMovement.ts  # registry 3 pola gerak murni (straight diagonal + sine + infinity) + kantong pola + roll parameter + validasi config
      │  │  ├─ PowerUpSlotManager.ts # inventory slot (3 slot, stack, keybind 1/2/3, Ctrl+1/2/3 buang, canAccept)
      │  │  ├─ ActiveBuffManager.ts # buff aktif dengan pause/resume durasi + flag blocksNormalFire
      │  │  ├─ PowerUpSpawnManager.ts # spawn item: pool 50, kantong jenis (bobot) & pola, zona 300×300 berpindah sesuai itemsPerZone, jarak aman player, updateItems fixed-step + despawn 4 sisi
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
      ├─ debug/
      │  └─ ScoreDebug.ts         # debug terisolasi skor: overlay teks (score, combo, multiplier, timer), hotkey simulasi (F5 toggle, Q/W/E kill tier, R laser, T ram, Y graze, U hit, I/O nuke batch, P reset)
      ├─ ui/
      │  ├─ DebugOverlay.ts       # teks statistik performa, pool, nyawa, status efek & skenario Grunt; visibilitas awal dari DebugConfig.enabled
      │  ├─ HudManager.ts         # koordinator panel HUD kiri + kanan; buat HudDataProvider dari IHudGameSource, inject ke kedua panel
      │  ├─ HudLeftPanel.ts       # panel kiri: SKOR, COMBO (+bar timer), PENGALI, DASH (+bar cooldown); konsumsi HudDataProvider
      │  ├─ HudRightPanel.ts      # panel kanan: HP + slot buff + daftar durasi buff; konsumsi HudDataProvider (tanpa gameScene langsung)
      │  ├─ PowerUpSlotBox.ts     # komponen satu kotak slot buff
      │  ├─ ActiveBuffRow.ts      # komponen satu baris durasi buff aktif
      │  └─ TranslatedText.ts     # Text yang menyimpan key + params dan refresh saat bahasa berubah
      ├─ types/
      │  ├─ Team.ts               # enum Team
      │  ├─ PowerUpType.ts        # enum tipe power-up (vocabulary lintas layer, dipakai config & systems)
      │  ├─ EntityConfig.ts       # interface config konstruktor entity
      │  ├─ AssetRef.ts           # referensi tekstur siap pakai: { texture, frame? }
      │  ├─ InputAction.ts        # enum aksi input lintas layer
      │  ├─ EffectType.ts         # enum jenis efek durasi
      │  ├─ IEnemyBulletSpawner.ts # kontrak spawn peluru musuh untuk entity
      │  ├─ ITargetPosition.ts    # kontrak posisi target tembakan musuh
      │  ├─ IInputSource.ts       # kontrak sumber input (tanpa Phaser)
      │  └─ Language.ts           # LanguageCode, TranslationParams, TranslationTable
      └─ utils/
         ├─ computeFit.ts         # hitung skala FIT (letterbox) + offset tengah dari ukuran window
         ├─ designCamera.ts       # apply/bind kamera desain: zoom + centerOn + listener resize
         ├─ fixedStep.ts          # helper loop fixed timestep (ekstraksi duplikat Game.ts & BaseEntity.ts)
         └─ ShuffleBag.ts         # kantong acak tanpa pengembalian (draw/refill/clear) untuk pilihan berbobot
```

---

## 2. Rencana File Fase Berikutnya (BELUM dibuat)

Jangan dianggap ada sampai file-nya benar-benar dibuat.

```
src/game/
├─ entities/enemy/patterns/
│  └─ HomingPattern.ts
├─ systems/
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
Konfigurasi dipisah per domain (`PlayerConfig`, `EnemyConfig`, `WorldConfig`, `PowerUpConfig` 4 domain, `DebugConfig`), dan bullet
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
| 8  | `config/` hanya data murni (`as const`), tanpa logika, object Phaser, atau side effect; boleh import dari `types/` dan config lain yang juga murni data. Pengecualian: `config/language/*.json` berisi data terjemahan murni yang di-import bundler saat build | config tetap deklaratif dan aman diimpor |
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
- Panduan uji enemy Grunt (skenario, checklist, tuning): `docs/panduan-uji-grunt.md`
- Arsitektur aset & peta migrasi atlas: `docs/asset-system.md`
- Alur aset sampai render (versi sederhana): `docs/asset-system-alur-sederhana.md`
- Daftar tombol debug (F1–F4, `8`, Z–N) & isi overlay: `docs/debug-toggles.md`
- Kontrak bahasa (pemakaian `TranslatedText`, konvensi key, aturan restart, larangan teks di gambar): `docs/language.md`
- **Dokumentasi HUD untuk designer (UI-only workflow, HudConfig, language keys): `docs/hud-system.md`**
- Panduan build: `docs/build.md`
- Rencana class & implementasi: `plans/2#-entities-class.md`
- Rencana porting arsitektur (pooling, wave, difficulty, skill, profile): `plans/1#-bullet-hell-porting.md`
