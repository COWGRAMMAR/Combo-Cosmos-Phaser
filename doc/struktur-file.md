# Struktur File — Combo-Cosmos-Phaser

- **Status:** Fase 0 (fondasi class) + InputManager selesai
- **Tanggal:** 2026-11-05
- **Scope dokumen:** **hanya struktur folder/file**. Rencana class, field, method, dan urutan implementasi ada di `plans/2#-entities-class.md`. Rencana input ada di `plans/3#-input-manager.md`.

Dokumen ini adalah **sumber kebenaran struktur file**. Jika isinya berbeda dengan kondisi repo, struktur dianggap belum selesai dikerjakan.

---

## 1. Struktur Folder Final (sudah di-ACC)

```
Combo-Cosmos-Phaser/
├─ index.html
├─ package.json
├─ tsconfig.json
├─ README.md
├─ vite/
│  ├─ config.dev.mjs
│  └─ config.prod.mjs
├─ public/
│  └─ assets/                     # sprite, audio, tilemap
├─ plans/
│  ├─ 1#-bullet-hell-porting.md   # (existing)
│  ├─ 2#-entities-class.md        # rencana class Player & Enemy
│  └─ 3#-input-manager.md         # arsitektur InputManager
├─ issues/                        # (dibuat saat ada bug)
├─ doc/
│  └─ struktur-file.md            # dokumen ini
└─ src/
   ├─ main.ts                     # bootstrap DOM (existing, tidak diubah)
   ├─ vite-env.d.ts               # (existing)
   └─ game/
      ├─ main.ts                  # Phaser GameConfig (existing, diubah: physics + scene list)
      ├─ config/
      │  ├─ GameConfig.ts         # konstanta resolusi, gravity, depth layer
      │  ├─ Balance.ts            # SEMUA angka balancing (hp, speed, damage, cooldown)
      │  ├─ AssetKeys.ts          # konstanta key texture/audio
      │  ├─ GameEvents.ts         # konstanta nama event
      │  └─ InputBindings.ts      # default binding action → key (data-driven)
      ├─ scenes/
      │  ├─ Boot.ts               # (existing)
      │  ├─ Preloader.ts          # (existing, diubah: load asset baru)
      │  ├─ MainMenu.ts           # (existing)
      │  ├─ Game.ts               # (existing, diubah: wiring gameplay)
      │  └─ GameOver.ts           # (existing)
      ├─ entities/
      │  ├─ BaseEntity.ts         # abstract, extends Phaser.Physics.Arcade.Sprite
      │  ├─ IDamageable.ts        # interface takeDamage
      │  ├─ player/
      │  │  ├─ Player.ts
      │  │  └─ PlayerState.ts     # string enum (opsi D: state milik subclass)
      │  ├─ enemy/
      │  │  ├─ Enemy.ts
      │  │  ├─ EnemyState.ts      # string enum
      │  │  └─ patterns/
      │  │     ├─ IMovementPattern.ts
      │  │     ├─ LinearPattern.ts
      │  │     └─ HomingPattern.ts
      │  └─ projectile/
      │     ├─ Projectile.ts      # abstract, TIDAK extends BaseEntity (tidak punya HP)
      │     ├─ PlayerBullet.ts
      │     └─ EnemyBullet.ts
      ├─ systems/
      │  ├─ InputManager.ts       # implementasi IInputSource di atas KeyboardPlugin
      │  ├─ ScoreManager.ts
      │  ├─ ComboManager.ts
      │  ├─ WaveManager.ts        # fase lanjutan
      │  ├─ DifficultyManager.ts  # fase lanjutan
      │  ├─ SpawnQueue.ts         # fase lanjutan
      │  └─ SkillManager.ts       # fase lanjutan
      ├─ ui/
      │  ├─ Hud.ts
      │  └─ CooldownIndicator.ts
      ├─ services/
      │  └─ ProfileService.ts
      ├─ types/
      │  ├─ Team.ts               # enum Team
      │  ├─ EntityConfig.ts       # interface config konstruktor entity
      │  ├─ InputAction.ts        # enum aksi input lintas layer
      │  └─ IInputSource.ts       # kontrak sumber input (tanpa Phaser)
      └─ utils/
         ├─ math.ts
         └─ textures.ts            # generate placeholder texture (Fase 0)
```

---

## 2. Aturan Penempatan File

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

---

## 3. Referensi

- Rencana class & implementasi: `plans/2#-entities-class.md`
- Rencana input manager (dependency inversion, rebind, data-driven binding): `plans/3#-input-manager.md`
- Rencana porting arsitektur (pooling, wave, difficulty, skill, profile): `plans/1#-bullet-hell-porting.md`
