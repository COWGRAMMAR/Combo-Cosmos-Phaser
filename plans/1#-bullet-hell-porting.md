# [1#] Plan Porting Arsitektur TypingDefense → Combo-Cosmos-Phaser

## 1. Konteks

- **Target game:** Bullet hell bertema 1945 Air Force (pesawat, bullet pattern, wave musuh).
- **Tech stack:** TypeScript + Phaser 3 (frontend), Java (backend, arsitektur belum final).
- **Sumber referensi:** `TypingDefense-Strukdata-Algoritma` (C++/raylib). Yang diporting **hanya arsitektur/pola desainnya**, bukan logic internal-nya — semaksimal mungkin memakai API bawaan Phaser dan meminimalkan abstraksi custom yang sudah disediakan framework.
- **Status Combo-Cosmos-Phaser:** template Phaser 3 + TS + Vite (scenes: Boot, Preloader, MainMenu, Game, GameOver; `src/core/` masih kosong).

## 2. Prinsip Porting

1. **Arsitektur saja, bukan logic.** Pola & struktur yang ditiru; implementasi mengikuti idiom Phaser.
2. **Phaser-first.** Gunakan API bawaan (Group, Pool, Timer, Arcade Physics, Tweens, Particles) sebelum bikin abstraksi sendiri.
3. **Manager tipis.** Setiap sistem cukup 1 class kecil yang membungkus API Phaser, bukan engine paralel.
4. **Backend-ready.** Data player dirancang agar mudah dipindah dari JSON lokal ke REST API Java tanpa refactor besar.

## 3. Daftar Porting (5 Sistem)

### 3.1 Object Pooling

- **Referensi:** pool 50 asteroid + pool 64 explosion × 35 particle di TypingDefense.
- **Porting ke Phaser:** `Phaser.Physics.Arcade.Group` dengan `maxSize` + `createCallback`; reuse via `group.get(x, y, texture)`, recycle via `group.killAndHide()`. Tidak perlu class pool custom.
- **Penerapan:** pool terpisah untuk (a) bullet musuh, (b) peluru player, (c) musuh/wave, (d) explosion/particle.
- **Catatan:** bullet hell butuh pool besar (bullet musuh 300–500), set `maxSize` dan `runChildUpdate` sesuai kebutuhan performa.

### 3.2 Difficulty Manager

- **Referensi:** DifficultyManager time-based ramp (tier 1-6 naik seiring waktu, interval spawn mengecil, jumlah shower bertambah).
- **Porting ke Phaser:** class kecil yang di-update dari `scene.update(time, delta)`, menyimpan `elapsedTime` dan mengekspos parameter dinamis: `bulletSpeed`, `fireRate`, `enemyCount`, `waveInterval`, `patternLevel`. Tidak ada state machine rumit — cukup tabel/kurva konfigurasi (array of `{ timeThreshold, params }`).
- **Penerapan:** dipakai oleh Spawn System dan Skill System sebagai sumber parameter kesulitan.

### 3.3 Skill State Machine (IDLE → ACTIVE → COOLDOWN)

- **Referensi:** 5 skill aktif dengan FSM IDLE→ACTIVE→COOLDOWN, keybind 1-N, HUD indikator READY/ACTIVE/COOLDOWN.
- **Porting ke Phaser:** FSM dibuat minimal (enum + switch) karena Phaser tidak punya FSM bawaan; **timer memakai `Phaser.Time.Timer` / `scene.time.delayedCall`** untuk durasi ACTIVE dan cooldown — jangan bikin sistem timer sendiri.
- **Adaptasi tema:** Shield (absorb 1 hit), Bomb/Shockwave (clear bullet di radius), Score Booster (multiplier), Aura Field → bisa jadi "slow field" atau "bullet eraser", Instant Crit → opsional diganti skill khas pesawat (mis. drone/missile barrage).
- **Penerapan:** 1 class `Skill` (state + timer + activate()) + 1 `SkillManager` (registry, keybind, update HUD).

### 3.4 Spawn System

- **Referensi:** pool tetap + SinglyLinkedList shower + priority_queue event (SHOWER > NORMAL) + interval spawn.
- **Porting ke Phaser:**
  - Spawn berkala → `Phaser.Time.Timer` berulang dengan interval dari DifficultyManager.
  - Event burst/wave (pengganti priority_queue) → antrian sederhana `Array<{ atTime, spawnFn, priority }>` yang diproses di `update`, atau `delayedCall` terjadwal saat wave dimulai.
  - Wave pattern bullet hell → definisi wave sebagai data (array konfigurasi: formasi musuh, bullet pattern, timing), bukan hardcode.
- **Penerapan:** `WaveManager` (data-driven waves) + `BulletPattern` helper (fan, ring, aimed, spiral).

### 3.5 Homing Logic

- **Referensi:** 50% asteroid homes to player, 50% gerak acak.
- **Porting ke Phaser:** Arcade Physics — `Phaser.Physics.Arcade.ArcadePhysics.moveToObject` / hitung sudut dengan `Phaser.Math.Angle.Between` lalu set velocity; untuk homing berkelanjutan update arah tiap frame dengan `lerp` agar tidak terlalu agresif. Alternatif: `accelerateTo`.
- **Penerapan:** (a) musuh mengejar player, (b) tipe bullet homing (dengan turn-rate terbatas), (c) proporsi homing dikontrol DifficultyManager.

## 4. Player Profile System (Fokus Backend Java)

> Arsitektur backend belum diputuskan — bagian ini hanya kontrak data + endpoint minimal agar frontend tidak tergantung detail backend.

### 4.1 Skema PlayerProfile (kontrak data)

```
PlayerProfile {
  id: string
  username: string
  highestScore: number
  currency: number            // pengganti RP
  survivalTimeBest: number
  activeSkin: string
  unlockedSkills: string[]
  unlockedSkins: string[]
  createdAt / updatedAt
}
```

### 4.2 Endpoint minimal (draft)

| Method | Path             | Fungsi                          |
| ------ | ---------------- | ------------------------------- |
| POST   | `/profiles`      | register/buat profile           |
| GET    | `/profiles/{id}` | ambil profile                   |
| PUT    | `/profiles/{id}` | update (score, currency, skin)  |

- Autentikasi & leaderboard/gacha **belum** masuk scope ini (dibuat plan terpisah nanti).

### 4.3 Sisi Frontend

- 1 service tipis `src/core/ProfileService.ts`: wrapper `fetch` dengan base URL dari env (`VITE_API_URL`), method `getProfile/updateProfile`.
- Fallback offline: jika API tidak tersedia, simpan ke `localStorage` dengan skema yang sama — supaya game tetap jalan tanpa backend.
- Semua akses profile lewat service ini; tidak ada komponen yang langsung pegang localStorage/fetch sendiri.

## 5. Struktur Folder Target

```
src/
  core/
    DifficultyManager.ts
    SkillManager.ts        (+ Skill.ts)
    WaveManager.ts         (+ BulletPattern.ts)
    ProfileService.ts
  game/
    scenes/                (sudah ada; Game.ts jadi gameplay scene)
    entities/              (Player, Enemy, Bullet — tipis, andalkan Arcade Physics)
```

## 6. Urutan Implementasi (Fase)

1. **Fase 1 — Fondasi:** ProfileService (localStorage fallback dulu) + struktur folder core.
2. **Fase 2 — Pooling:** pool bullet musuh + peluru player + explosion.
3. **Fase 3 — Spawn & Difficulty:** WaveManager data-driven + DifficultyManager + BulletPattern dasar (aimed, fan, ring).
4. **Fase 4 — Homing & Player:** gerak player, musuh homing, collision (hit player → shield/combo reset).
5. **Fase 5 — Skill FSM:** SkillManager + 2-3 skill pertama + HUD cooldown.
6. **Fase 6 — Integrasi backend:** ganti fallback localStorage ke REST Java saat backend siap.

## 7. Open Questions

- Framework Java: Spring Boot (default umum) atau lainnya? → menentukan struktur endpoint.
- Resolusi/orientasi: portrait (shooter vertikal ala 1945) atau landscape? Saat ini config 1024×768 landscape.
- Skema kontrol: keyboard (WASD/arrow) atau mouse/touch?
