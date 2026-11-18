# Rencana Class Player & Enemy — Combo-Cosmos-Phaser

- **Status:** Draft — menunggu ACC sebelum implementasi
- **Tanggal:** 2026-11-01
- **Menggantikan:** `plans/1#-bullet-hell-porting.md` §5 (Struktur Folder Target)
- **Struktur folder:** lihat `docs/struktur-file.md` (sumber kebenaran struktur file)
- **Scope:** field/method class untuk sistem Player & Enemy (Fase 1–6). WaveManager, DifficultyManager, SkillManager, ProfileService di luar scope dokumen ini.

---

## 0. Fase 0 — Fondasi Class (scope aktif sekarang)

**Tujuan:** membuktikan struktur data class `BaseEntity` → `Player`/`Enemy` benar-benar jalan di Phaser sebelum menambah sistem apa pun. Belum ada combat.

### 0.1 Hasil yang harus terlihat

- Background **hijau polos** lewat `camera.setBackgroundColor` (tanpa `bg.png` di scene Game).
- **1 Player** (segitiga merah, texture hasil `generateTexture`) di `(512, 680)`.
- Player bisa gerak **4 arah** (WASD / arrow) — murni untuk testing input, bukan final.
- **1 Enemy** (lingkaran, texture hasil `generateTexture`) di `(512, 160)`, **diam total**.
- Enemy dibuat lewat `new Enemy(...)` di `Game.create()` — bukan `group.get()` — supaya konstruktor & inheritance terverifikasi.
- Tidak ada bullet, HUD, skor, damage, collision, pattern, wave.

### 0.2 Penyesuaian dari desain jangka panjang

| Item               | Fase 0                                             | Ditunda sampai                     |
| ------------------ | -------------------------------------------------- | ---------------------------------- |
| `EntityConfig`     | `{ team, maxHp, moveSpeed, bodyRadius? }`           | `contactDamage` ditambah di Fase 5 |
| `BaseEntity`       | `takeDamage`, `heal`, `die`, `updateEntity`         | abstract `attack()` di Fase 2      |
| Player input       | 4 arah, velocity dinormalisasi                      | tombol fire di Fase 2              |
| Enemy behaviour    | diam (`setImmovable(true)`, velocity 0)             | `movementPattern` di Fase 4        |
| Texture            | generated di `Preloader` lewat `utils/textures.ts`  | sprite PNG asli                    |
| Alias `@/`         | **ditunda** (pakai relative import dulu)            | saat jumlah file bertambah         |
| Collision & damage | tidak ada                                           | Fase 5                             |

### 0.3 File Fase 0

Baru: `config/Balance.ts`, `config/AssetKeys.ts`, `utils/textures.ts`, `types/Team.ts`, `types/EntityConfig.ts`, `entities/IDamageable.ts`, `entities/BaseEntity.ts`, `entities/player/Player.ts`, `entities/player/PlayerState.ts`, `entities/enemy/Enemy.ts`, `entities/enemy/EnemyState.ts`.

Diubah: `game/main.ts` (tambah `physics: { default: 'arcade' }`), `scenes/Game.ts` (buang demo text/`pointerdown`/background image), `scenes/Preloader.ts` (generate texture), `docs/struktur-file.md` (tambah `utils/textures.ts`).

### 0.4 Kriteria selesai

1. `tsc --noEmit` bersih.
2. `npm run dev` → layar hijau, segitiga merah & lingkaran terlihat.
3. Player bergerak 4 arah, berhenti di tepi layar, tidak bisa keluar bounds.
4. Enemy tidak bergerak sama sekali.
5. Tidak ada error di console browser.

---

## 1. Perubahan Konfigurasi (diterapkan di Fase 1)

### 1.1 Path alias `@/`

`tsconfig.json`:

```json
"baseUrl": ".",
"paths": { "@/*": ["src/*"] }
```

`vite/config.dev.mjs` dan `vite/config.prod.mjs`:

```js
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
    // ...konfigurasi existing tetap
    resolve: {
        alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) }
    }
});
```

Tujuan: `import { BaseEntity } from '@/game/entities/BaseEntity';` tidak pecah saat file dipindah.

### 1.2 Phaser GameConfig

`src/game/main.ts` ditambah:

- `physics: { default: 'arcade', arcade: { debug: false } }`
- `scale` mode tetap (1024×768) sampai keputusan orientasi diambil

---

## 2. Definisi Tipe Dasar

| File                    | Isi                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `types/Team.ts`         | `export enum Team { Player = 'player', Enemy = 'enemy' }`                                              |
| `types/EntityConfig.ts` | `{ team, maxHp, moveSpeed, contactDamage, bodyRadius? }`                                               |
| `config/GameEvents.ts`   | `ENEMY_KILLED`, `PLAYER_DIED`, `PLAYER_DAMAGED`, `SCORE_CHANGED`, `COMBO_CHANGED`, `GAME_OVER`            |
| `entities/IDamageable.ts` | `interface IDamageable { takeDamage(amount: number, source?: unknown): void; }`                        |

Catatan: semua enum wajib **string enum** (bukan numeric) supaya bisa dipakai di tipe `string` dan aman saat logging. Numeric enum gagal constraint `S extends string` (TS2344) dan tidak bisa dipersempit di subclass (TS2416). Pada Fase 0, `EntityConfig` belum memuat `contactDamage` (lihat §0.2).

---

## 3. Hierarki Class

```
Phaser.Physics.Arcade.Sprite
        └── BaseEntity (abstract)
              ├── Player
              └── Enemy

Phaser.Physics.Arcade.Image
        └── Projectile (abstract)
              ├── PlayerBullet
              └── EnemyBullet
```

`Projectile` sengaja **tidak** turun dari `BaseEntity` karena tidak punya HP, `heal()`, atau `die()` — memaksa turun akan melanggar Liskov Substitution.

---

## 4. BaseEntity (abstract)

Kategori field sesuai kesepakatan: **vital, combat, identitas, i-frame**. State **tidak** ada di base (opsi D). Hitbox **tidak** jadi field karena sudah ditangani Arcade Physics (`setCircle`/`setSize`/`setOffset`, `phaser.d.ts:105620`).

### 4.1 Field

| Kategori  | Field             | Tipe     | Visibility           | Default             | Keterangan                        |
| --------- | ----------------- | -------- | -------------------- | ------------------- | --------------------------------- |
| Vital     | `maxHp`           | `number` | `protected readonly` | dari `EntityConfig` | batas atas + identitas kekuatan   |
| Vital     | `_hp`             | `number` | `private`            | `= maxHp`           | hanya diubah lewat `takeDamage`/`heal` |
| Vital     | `get hp`          | `number` | getter publik        | —                   | baca nilai sekarang               |
| Vital     | `get maxHealth`   | `number` | getter publik        | —                   | untuk HUD (tidak bisa diubah)     |
| Vital     | `get isAlive`     | `boolean`| getter publik        | —                   | `_hp > 0` — bukan field terpisah  |
| Vital     | `get hpRatio`     | `number` | getter publik        | —                   | `_hp / maxHp`                     |
| Combat    | `moveSpeed`       | `number` | `public`             | dari config         | px/detik                          |
| Combat    | `contactDamage`   | `number` | `public`             | dari config         | damage saat badan bertabrakan     |
| Identitas | `team`            | `Team`   | `public readonly`    | dari config         | player dan enemy                  |
| I-frame   | `invulnerableUntil` | `number` | `protected`        | `0`                 | timestamp ms (`scene.time.now`)   |

### 4.2 Method

| Method                | Visibility | Abstrak | Perilaku                                                                 |
| --------------------- | ---------- | ------- | ------------------------------------------------------------------------ |
| `takeDamage(amount, source?)` | public | tidak | guard `isAlive` + `isInvulnerable` → clamp 0..maxHp → `onDamaged()` → `die()` bila 0 |
| `heal(amount)`        | public     | tidak   | clamp ke `maxHp`, hanya bila `isAlive`                                   |
| `canDamage(target)`   | public     | tidak   | `team !== target.team && isAlive`                                        |
| `isInvulnerable(now)` | public     | tidak   | `now < invulnerableUntil`                                                |
| `resetForPool(x, y)`  | public     | tidak   | reset `_hp`, `invulnerableUntil`, `setActive/Visible(true)`, enable body |
| `preUpdate(time, delta)` | public  | tidak   | `super.preUpdate()` lalu `updateEntity(time, delta)`                     |
| `updateEntity(time, delta)` | protected | **ya** | movement/input per subclass                                             |
| `onDamaged(source?)`  | protected  | tidak   | hook kosong, boleh dioverride (efek flash/audio)                         |
| `attack(time)`        | public     | **ya**  | aksi menembak — **ditunda ke Fase 2**                                    |
| `die()`               | public     | **ya**  | konsekuensi kematian, side effect diserahkan subclass                     |

### 4.3 Konstruktor

```ts
constructor(scene: Phaser.Scene, x: number, y: number, texture: string, cfg: EntityConfig)
```

Isi: `super(scene, x, y, texture)` → `scene.add.existing(this)` → `scene.physics.add.existing(this)` → set field → bila `cfg.bodyRadius` ada, `this.body.setCircle(cfg.bodyRadius)`.

---

## 5. Player

### 5.1 Field

| Kategori   | Field             | Tipe                          | Visibility           | Default                       | Keterangan                          |
| ---------- | ----------------- | ----------------------------- | -------------------- | ----------------------------- | ----------------------------------- |
| State      | `entityState`     | `PlayerState`                 | `public`             | `PlayerState.Alive`           | transisi lewat `setState()` (private) |
| Vital      | `lives`           | `number`                      | `protected`          | `Balance.player.lives`        | sisa nyawa                          |
| Vital      | `respawnDelayMs`  | `number`                      | `protected readonly` | `Balance.player.respawnDelayMs` | jeda respawn                      |
| Combat     | `fireCooldownMs`  | `number`                      | `protected`          | `Balance.player.fireCooldownMs` | interval tembak                   |
| Combat     | `nextFireAt`      | `number`                      | `protected`          | `0`                           | timestamp boleh tembak berikutnya    |
| Combat     | `weaponLevel`     | `number`                      | `protected`          | `1`                           | disiapkan untuk power-up (belum dipakai) |
| Dependency | `bullets`         | `Phaser.Physics.Arcade.Group` | `protected`          | di-inject konstruktor         | pool peluru player                  |
| Dependency | `keys`            | `PlayerKeys`                  | `protected`          | dibuat di konstruktor         | `{ up, down, left, right, fire }`    |
| Dependency | `skillManager`    | `SkillManager \| null`        | `public`             | `null`                        | diisi Fase 7, bukan sekarang         |

### 5.2 PlayerState

```ts
export enum PlayerState {
    Alive = 'alive',
    Invulnerable = 'invulnerable',
    Respawning = 'respawning',
    Dead = 'dead'
}
```

### 5.3 Method

| Method                  | Perilaku                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| `updateEntity(time, delta)` | baca `keys` → `body.setVelocity` → bila `keys.fire.isDown && time >= nextFireAt` panggil `attack(time)`     |
| `attack(time)`          | `this.bullets.get(x, y + offset)` → set velocity ke atas → `nextFireAt = time + fireCooldownMs`              |
| `takeDamage`            | override tipis: `super.takeDamage()` lalu `setState(Invulnerable)` saat HP turun                             |
| `die()`                 | `setState(Respawning)` → `lives--` → `scene.events.emit(PLAYER_DIED)` → `scene.time.delayedCall(respawnDelayMs, respawn)`; bila `lives === 0` emit `GAME_OVER` dan `setState(Dead)` |
| `respawn(x, y)`         | `_hp = maxHp` (lewat `resetForPool`), `invulnerableUntil = now + 1500`, `setState(Alive)`                    |
| `setState(next)`        | private; hanya mengubah `entityState` (transisi state tidak dipakai untuk logika frame)                        |

Catatan: **tidak ada** field `score`/`combo` di Player. Player hanya meng-emit event.

---

## 6. Enemy

### 6.1 Field

| Kategori   | Field             | Tipe                          | Visibility           | Default                        | Keterangan                              |
| ---------- | ----------------- | ----------------------------- | -------------------- | ------------------------------ | --------------------------------------- |
| State      | `entityState`     | `EnemyState`                  | `public`             | `EnemyState.Spawning`          | transisi lewat `setState()` (protected) |
| Combat     | `scoreValue`      | `number`                      | `public readonly`    | dari config                    | skor saat mati                          |
| Combat     | `fireIntervalMs`  | `number`                      | `protected`          | `Balance.enemy.fireIntervalMs` | interval tembak                         |
| Combat     | `nextFireAt`      | `number`                      | `protected`          | `0`                            | timestamp tembak berikutnya             |
| Behaviour  | `movementPattern` | `IMovementPattern`            | `public`             | di-inject                      | Strategy pattern                        |
| Behaviour  | `bulletPattern`   | `IBulletPattern \| null`      | `public`             | `null`                         | diisi saat sistem wave (fase lanjutan)  |
| Metadata   | `waveId`          | `string`                      | `public readonly`    | `''`                           | asal wave                               |
| Metadata   | `difficultyTier`  | `number`                      | `public`             | `1`                            | di-set DifficultyManager                |
| Dependency | `bullets`         | `Phaser.Physics.Arcade.Group` | `protected`          | di-inject                      | pool peluru musuh                       |

### 6.2 EnemyState

```ts
export enum EnemyState {
    Spawning = 'spawning',
    Active = 'active',
    Dying = 'dying'
}
```

### 6.3 Method

| Method               | Perilaku                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `updateEntity(t, dt)`| `movementPattern.update(this, t, dt)`; bila `bulletPattern` ada dan `t >= nextFireAt` → `attack(t)` |
| `attack(time)`       | `bulletPattern?.fire(this, time)`; `nextFireAt = time + fireIntervalMs`                            |
| `die()`              | `setState(Dying)` → `scene.events.emit(ENEMY_KILLED, { x, y, scoreValue })` → `killAndHide()` + disable body |
| `resetForPool(x, y)` | `super.resetForPool()` → `setState(Spawning)` → reset `nextFireAt`, `difficultyTier`               |

### 6.4 Pattern interface

```ts
export interface IMovementPattern {
    update(enemy: Enemy, time: number, delta: number): void;
}
```

- `LinearPattern`: velocity konstan di-set sekali saat spawn.
- `HomingPattern`: `Phaser.Math.Angle.Between` → `Phaser.Math.Angle.RotateTo` dengan turn-rate terbatas → velocity.
- Wajib `import type { Enemy }` di file pattern untuk memutus circular import runtime.

---

## 7. Projectile (abstract)

| Field        | Tipe   | Visibility         | Keterangan                        |
| ------------ | ------ | ------------------ | --------------------------------- |
| `team`       | `Team` | `public readonly`  | penentu siapa yang boleh terluka  |
| `damage`     | `number` | `public`         | damage saat overlap               |
| `speed`      | `number` | `public`         | px/detik                          |
| `bodyRadius` | `number` | `public readonly`| opsional, untuk `setCircle`        |

Method: `fire(x, y, angle, speed)`, `resetForPool(x, y)`, `preUpdate()` → matikan diri bila keluar batas dunia.

`PlayerBullet` dan `EnemyBullet` hanya mengisi texture/arah awal.

---

## 8. Sistem Skor & Combo (terpisah dari entity)

### 8.1 ComboManager

| Field            | Tipe   | Default                    | Keterangan                       |
| ---------------- | ------ | -------------------------- | -------------------------------- |
| `combo`          | `number` | `0`                      | jumlah kill beruntun             |
| `maxCombo`       | `number` | `0`                      | untuk statistik akhir            |
| `comboWindowMs`  | `number` | `Balance.combo.windowMs`   | batas waktu antar kill           |
| `lastKillAt`     | `number` | `0`                      | timestamp kill terakhir          |
| `get multiplier()` | `number` | —                      | `min(1 + floor(combo / 10), 5)`    |

Method: `registerKill(time)`, `update(time)` (reset combo bila kedaluwarsa), `reset()`.

### 8.2 ScoreManager

| Field       | Tipe           | Default | Keterangan                          |
| ----------- | -------------- | ------- | ----------------------------------- |
| `score`     | `number`       | `0`     | skor sesi ini                       |
| `highScore` | `number`       | `0`     | sementara dari localStorage (Fase 6 → ProfileService) |
| `combo`     | `ComboManager` | —       | referensi satu arah                 |

Method: `onEnemyKilled(payload)` → `scoreValue * combo.multiplier` → emit `SCORE_CHANGED`; `reset()`.

Arah dependensi: `ScoreManager → ComboManager` (tidak sebaliknya).

---

## 9. Rencana Wiring `Game.ts`

| Objek/Sistem    | Isi                                                                                   |
| --------------- | ------------------------------------------------------------------------------------- |
| Group           | `playerBullets`, `enemyBullets`, `enemies` (dengan `classType: Enemy`, `maxSize`)          |
| Overlap         | `playerBullets ↔ enemies`, `player ↔ enemies`, `player ↔ enemyBullets`                     |
| Systems         | `ComboManager`, `ScoreManager` (Wave/Difficulty/Skill menyusul)                         |
| Listeners       | `ENEMY_KILLED` → ScoreManager + ComboManager; `PLAYER_DIED` → HUD; `GAME_OVER` → scene stop |
| Spawn sementara | 1 musuh hardcode di `create()` untuk vertical slice (belum pakai WaveManager)             |

Semua callback overlap memanggil `takeDamage` pada target, bukan mengubah `hp` langsung.

---

## 10. Urutan Implementasi

| Fase | Isi                                                              | File baru                                                                                                                                                                                    | Kriteria selesai                                              |
| ---- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 0    | **Fondasi class**: BaseEntity + Player gerak 4 arah + Enemy diam + texture generate | lihat §0.3                                                                                                                                                                                   | lihat §0.4                                                    |
| 1    | Tipe dasar + BaseEntity + alias `@/`                               | `types/Team.ts`, `types/EntityConfig.ts`, `config/GameEvents.ts`, `entities/IDamageable.ts`, `entities/BaseEntity.ts`, `config/Balance.ts`                                                        | `tsc --noEmit` bersih, belum ada perubahan perilaku game      |
| 2    | Projectile + pool peluru                                           | `entities/projectile/*`                                                                                                                                                                       | Peluru bisa `fire()` dan di-recycle tanpa bocor                |
| 3    | Player                                                             | `entities/player/*`                                                                                                                                                                           | Pesawat bergerak (keyboard), menembak, kena damage, mati → respawn |
| 4    | Enemy + movement pattern                                           | `entities/enemy/*`, `entities/enemy/patterns/*`                                                                                                                                                | Musuh masuk layar, bergerak linear/homing, mati meng-emit event |
| 5    | Wiring `Game.ts` (group + collider + spawn hardcode)                | `scenes/Game.ts` (ubah)                                                                                                                                                                       | Vertical slice bisa dimainkan: tembak musuh, HP berkurang, mati |
| 6    | ScoreManager + ComboManager                                        | `systems/ScoreManager.ts`, `systems/ComboManager.ts`                                                                                                                                           | Skor dan multiplier ter-update via event, siap untuk HUD      |
| 7    | (di luar scope dokumen) Wave, Difficulty, Skill, ProfileService, HUD | —                                                                                                                                                                                             | —                                                             |

**Tidak menyentuh** `public/assets` sampai Fase 2 (texture bullet) dan Fase 3–4 (sprite pesawat).

---

## 11. Catatan Teknis & Gotcha

1. **`useDefineForClassFields: true`** — deklarasi field di subclass mendefinisikan ulang properti. Jangan pernah mendeklarasikan field dengan nama milik Phaser (`active`, `visible`, `angle`, `scale`, `depth`, `body`, `state`); gunakan `entityState`.
2. **`noUnusedParameters: true`** — parameter hook yang tidak dipakai wajib diawali `_` (contoh `updateEntity(_time, _delta)`), kalau tidak build gagal.
3. **`strict: true` + `strictPropertyInitialization: false`** — field tanpa inisialisasi tidak error, tapi tetap inisialisasi eksplisit (penting untuk pooling).
4. **Overlap callback berjalan tiap frame** — i-frame wajib, kalau tidak HP terkuras per frame.
5. **Keyboard bisa `undefined`** di tipe Phaser — gunakan `scene.input.keyboard!` setelah memastikan scene punya input aktif.
6. **Pool reset** — `group.get()` mengembalikan entity lama; tanpa `resetForPool`, entity reuse membawa HP/state sisa.
7. **Hitbox** — gunakan `body.setCircle(r, ox, oy)`; jangan bikin field `hitRadius` sendiri (Arcade Body sudah menangani).
8. **`import type`** untuk pattern → `Enemy` guna memutus circular import.

---

## 12. Keputusan Final

- Entity state memakai **opsi D**: base tanpa field state, enum + transisi milik masing-masing subclass.
- `team` **dipasang** di `BaseEntity` (bukan hanya mengandalkan group terpisah).
- Hitbox **tidak** dibuat custom — Arcade Physics menangani (`phaser.d.ts:105620` `Body.setCircle`).
- `hp` dan `maxHp` tetap dua field, dengan `isAlive` sebagai getter (bukan field).
- **Score & combo tidak di entity** — dipisah ke `ScoreManager` + `ComboManager`.
- Folder sistem memakai `src/game/systems/`, bukan `src/core/`, sehingga plan lama §5 tersuperseded.
- `Projectile` tidak mewarisi `BaseEntity`.

---

## 13. Open Questions (belum memblokir Fase 1–6)

| # | Pertanyaan                                                | Dampak                              |
| - | --------------------------------------------------------- | ----------------------------------- |
| 1 | Orientasi final: portrait ala 1945 atau landscape 1024×768? | layout HUD, arah spawn musuh        |
| 2 | Kontrol final: keyboard saja, atau tambah mouse/touch?     | isi `updateEntity()` di Player      |
| 3 | Backend Java: Spring Boot atau lainnya?                     | `ProfileService` (Fase 7)           |

Default sementara: **landscape 1024×768 + keyboard (WASD/arrow + Space)**.
