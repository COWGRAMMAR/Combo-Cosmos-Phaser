# Struktur File — Combo-Cosmos-Phaser

- **Status:** Fase 0 (fondasi class) + InputManager + Fase 1 (bullet foundation) + Fase 2–4 (survival, efek & power-up, dash) + Fase screen/scale/layer/game loop selesai
- **Tanggal:** 2026-11-06
- **Scope dokumen:** **hanya struktur folder/file**. Rencana class, field, method, dan urutan implementasi ada di `plans/2#-entities-class.md`. Rencana input ada di `plans/3#-input-manager.md`. Rencana screen/scale/layer/game loop ada di `plans/4#-screen-scale-layer-gameloop.md`. Kontrak bullet system ada di `doc/bullet-system.md`.

Dokumen ini adalah **sumber kebenaran struktur file**. Jika isinya berbeda dengan kondisi repo, struktur dianggap belum selesai dikerjakan.

---

## 1. Struktur Folder Saat Ini (verified 2026-11-06)

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
│  ├─ 3#-input-manager.md         # arsitektur InputManager
│  └─ 4#-screen-scale-layer-gameloop.md # layout, waktu, pause, depth, HUD
├─ issues/                        # (dibuat saat ada bug)
├─ doc/
│  ├─ struktur-file.md            # dokumen ini
│  └─ bullet-system.md            # kontrak fondasi bullet untuk kerja paralel
└─ src/
   ├─ main.ts                     # bootstrap DOM
   ├─ vite-env.d.ts
   └─ game/
      ├─ main.ts                  # Phaser GameConfig
      ├─ config/
      │  ├─ PlayerConfig.ts       # hp, hitbox, nyawa, weapon, shockwave, atk speed, shield, laser, dash, bomb
      │  ├─ EnemyConfig.ts        # hp musuh + bullet (speed/radius/pool/margin/lifetime)
      │  ├─ WorldConfig.ts        # background + flag debug + delay/layout bantu
      │  ├─ ScreenConfig.ts       # sumber kebenaran canvas, play area, panel HUD, spawn
      │  ├─ TimeConfig.ts         # target/batas FPS + delta maksimum
      │  ├─ DepthConfig.ts        # urutan layer render bernama
      │  ├─ HudConfig.ts          # warna/label placeholder HUD
      │  ├─ PauseConfig.ts        # warna/teks placeholder overlay pause
      │  ├─ AssetKeys.ts          # konstanta key texture/audio
      │  ├─ GameEvents.ts         # konstanta nama event
      │  └─ InputBindings.ts      # default binding action → key (data-driven)
      ├─ scenes/
      │  ├─ Boot.ts
      │  ├─ Preloader.ts          # load asset + generate placeholder texture
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
      │  │  └─ Shockwave.ts       # ring meluas, membersihkan peluru musuh di radius
      │  ├─ player/
      │  │  ├─ Player.ts          # gerak, nyawa, i-frame, shield, dash
      │  │  ├─ PlayerState.ts     # string enum
      │  │  ├─ PlayerWeapon.ts    # cooldown + jalur tembakan (1–5) + multiplier cooldown
      │  │  └─ PlayerLaser.ts     # laser persisten, damage per interval (bukan pool)
      │  └─ enemy/
      │     ├─ Enemy.ts
      │     ├─ EnemyState.ts      # string enum
      │     └─ DummyEnemy.ts      # PLACEHOLDER musuh untuk uji damage
      ├─ systems/
      │  ├─ InputManager.ts       # implementasi IInputSource di atas KeyboardPlugin
      │  ├─ EnemyBulletManager.ts # satu loop untuk semua peluru musuh (shield-aware)
      │  ├─ EffectManager.ts      # satu timer durasi untuk semua efek (refresh, bukan stack)
      │  ├─ PowerUpManager.ts     # eksekusi efek power-up lane/atk speed/shield/laser/bomb/life
      │  ├─ PauseManager.ts       # pause/resume Game+Hud, auto-pause BLUR/HIDDEN
      │  └─ DebugTools.ts         # F1–F4 + 1–6, titik masuk sistem debug berikutnya
      ├─ ui/
      │  └─ DebugOverlay.ts       # teks statistik performa, pool, nyawa & status efek
      ├─ types/
      │  ├─ Team.ts               # enum Team
      │  ├─ EntityConfig.ts       # interface config konstruktor entity
      │  ├─ InputAction.ts        # enum aksi input lintas layer
      │  ├─ EffectType.ts         # enum jenis efek durasi
      │  └─ IInputSource.ts       # kontrak sumber input (tanpa Phaser)
      └─ utils/
         └─ textures.ts           # generate placeholder texture
```

---

## 2. Rencana File Fase Berikutnya (BELUM dibuat)

Jangan dianggap ada sampai file-nya benar-benar dibuat.

```
src/game/
├─ entities/enemy/patterns/
│  ├─ IMovementPattern.ts         # kontrak pola gerak musuh
│  ├─ LinearPattern.ts
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
| 4  | Maksimal 3 level nesting di dalam `src/`                                                             | lebih dari itu = pembagian tanggung jawab salah |
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

- Kontrak bullet system & aturan performa: `doc/bullet-system.md`
- Rencana class & implementasi: `plans/2#-entities-class.md`
- Rencana input manager (dependency inversion, rebind, data-driven binding): `plans/3#-input-manager.md`
- Rencana screen/scale/layer/game loop: `plans/4#-screen-scale-layer-gameloop.md`
- Rencana porting arsitektur (pooling, wave, difficulty, skill, profile): `plans/1#-bullet-hell-porting.md`
