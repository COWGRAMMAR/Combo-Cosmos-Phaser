# Rencana Implementasi Enemy Grunt

- **Status:** Fase 1 diimplementasikan, menunggu verifikasi browser
- **Tanggal:** 2026-11-14
- **Scope:** Grunt (Tipe 1) end-to-end: spawn, gerak, menembak, ditembak, tabrakan, dan harness tes.
- **Referensi:** `Ide Enemy.md`, `Placeholder Enemy.md`, `docs/struktur-file.md`, `docs/bullet-system.md`

---

## 1. Keputusan yang Sudah Dikunci

1. Milestone hanya **Grunt**. Tipe 2 dan Boss ditunda.
2. Urutan fase: **static → targeted shot → Rain → Horizontal Wall → Vertical Line lurus → Vertical Line diagonal**.
3. Belum ada WaveManager. Pengujian memakai **config skenario + reset key**, spawn **sekali per run tes**.
4. Peluru awal lurus ke bawah; targeted ditambahkan setelah fase static lewat config `aimMode`.
5. Peluru non-targeted mengikuti sudut gerak Grunt.
6. Tabrakan player-enemy:
   - Grunt langsung hancur.
   - Player kehilangan **1 nyawa** kecuali sedang i-frame, shield, atau dash.
   - Kalau shield aktif: shield pecah, nyawa aman.
7. Placeholder memakai tekstur lingkaran `AssetKeys.Enemy` yang sudah ada.
8. Reset key memakai **`R`**, bisa diganti atau dimatikan lewat config.
9. `DummyEnemy` **tetap disimpan** sebagai alat debug, tetapi tidak lagi menjadi enemy utama di `Game`.
10. Struktur kode: subclass enemy + class pattern terpisah.

---

## 2. Di Luar Scope

- Enemy Tipe 2 (Machine Gun, Sniper, Missile Cruiser).
- Boss Mothership.
- WaveManager, spawner wave produksi, difficulty, score, combo.
- Homing missile, spread/burst, dan pola tembakan kompleks.
- Item drop/power-up dari enemy.
- Audio, partikel ledakan, muzzle flash, trail misil.
- Perombakan HUD.
- Mengubah `Ide Enemy.md` dan `Placeholder Enemy.md`.

---

## 3. Arsitektur

### 3.1 Alur runtime

```
Game
├─ Player
├─ PlayerWeapon
├─ EnemyBulletManager
├─ GruntPool ──────────────► Group (dipakai overlap & PlayerLaser)
├─ GruntTestRunner
│  └─ Formation (Rain/Wall/Stream)
└─ DebugTools (reset key R)
```

- `GruntTestRunner` hanya untuk tes. Nanti WaveManager bisa memakai `GruntPool` dan formation yang sama.
- `Grunt` menerima bullet spawner dan target lewat kontrak di `types/`, sehingga `entities/` tidak import `systems/` secara runtime.
- Peluru musuh tetap dikelola `EnemyBulletManager` yang sudah ada. Tidak ada perubahan pada loop peluru.

### 3.2 File baru

| File | Tanggung jawab |
|---|---|
| `src/game/config/GruntConfig.ts` | HP, radius, weapon, `aimMode`, dan parameter semua pola gerak |
| `src/game/config/EnemyTestConfig.ts` | Skenario aktif, reset key, jumlah batch tes |
| `src/game/types/IEnemyBulletSpawner.ts` | Kontrak `spawn()` untuk Grunt |
| `src/game/types/ITargetPosition.ts` | Kontrak posisi target (`x`, `y`) |
| `src/game/entities/enemy/Grunt.ts` | HP, tembakan, movement, despawn, reset pool |
| `src/game/entities/enemy/patterns/IMovementPattern.ts` | Kontrak pola gerak per enemy |
| `src/game/entities/enemy/patterns/LinearMovement.ts` | Gerak linear dengan speed + sudut |
| `src/game/systems/enemy/GruntPool.ts` | Pool prewarm + group untuk overlap/laser |
| `src/game/systems/enemy/IGruntFormation.ts` | Kontrak formation tes |
| `src/game/systems/enemy/RainFormation.ts` | Spawn Rain |
| `src/game/systems/enemy/WallFormation.ts` | Spawn Horizontal Wall |
| `src/game/systems/enemy/StreamFormation.ts` | Spawn Vertical Line lurus/diagonal |
| `src/game/systems/enemy/GruntTestRunner.ts` | Memilih dan menjalankan skenario tes |

### 3.3 File yang diubah

| File | Perubahan |
|---|---|
| `src/game/entities/enemy/Enemy.ts` | Hapus asumsi static (`immovable`/`moves = false`) dari base |
| `src/game/entities/enemy/DummyEnemy.ts` | Terapkan perilaku static sendiri |
| `src/game/scenes/Game.ts` | Wiring pool, runner, overlap, damage player, reset, shutdown |
| `src/game/systems/DebugTools.ts` | Tambah aksi reset dan key opsional dari config |
| `src/game/ui/DebugOverlay.ts` | Tambah status skenario dan jumlah Grunt aktif (opsional, disarankan) |
| `docs/struktur-file.md` | Perbarui daftar file baru |
| `docs/bullet-system.md` | Perbarui status "musuh sungguhan" setelah Grunt selesai |

---

## 4. Config

### 4.1 `GruntConfig.ts`

Semua nilai yang bisa di-tune ada di sini. Gunakan union type agar `aimMode` dan arah diagonal bisa diganti tanpa error perbandingan TypeScript.

```ts
export type GruntAimMode = 'down' | 'targeted';
export type DiagonalDirection = 'ltr' | 'rtl';

export const GruntConfig = {
    maxHp: 30,
    bodyRadius: 20,
    spawnMargin: 48,
    despawnY: 1128,
    poolSize: 96,

    weapon: {
        aimMode: 'down' as GruntAimMode,
        fireIntervalMs: 1400,
        initialFireDelayMs: 700,
        bulletSpeed: 220,
        muzzleOffsetY: 18
    },

    rain: {
        spawnXMin: 48,
        spawnXMax: 762,
        intervalMs: 350,
        jitterMs: 150,
        moveSpeed: 140,
        moveAngleDeg: 0
    },

    wall: {
        count: 8,
        spacing: 84,
        centerX: 405,
        formationIntervalMs: 2000,
        moveSpeed: 120,
        moveAngleDeg: 0
    },

    stream: {
        count: 6,
        spacing: 72,
        streamDelayMs: 200,
        spawnX: 405,
        formationIntervalMs: 2000,
        moveSpeed: 150,
        moveAngleDeg: 0
    },

    streamDiagonal: {
        count: 6,
        spacing: 72,
        streamDelayMs: 200,
        spawnX: 48,
        formationIntervalMs: 2000,
        moveSpeed: 150,
        moveAngleDeg: 30,
        direction: 'ltr' as DiagonalDirection
    }
} as const;
```

Catatan:

- `spawnMargin` dipakai untuk spawn di atas layar; `despawnY` untuk membuang Grunt yang keluar bawah.
- `bodyRadius: 20` disamakan dengan tekstur lingkaran placeholder saat ini.
- `moveAngleDeg` adalah sudut dari vertikal; `0` berarti lurus ke bawah.
- `direction: 'ltr'` berarti kiri-atas ke kanan-bawah; `'rtl'` sebaliknya.
- Nilai damage player tidak ditambahkan ke config karena `Player.applyHit()` selalu mengurangi 1 nyawa.

### 4.2 `EnemyTestConfig.ts`

```ts
export type EnemyTestScenario =
    | 'static'
    | 'rain'
    | 'wall'
    | 'stream-straight'
    | 'stream-diagonal';

export const EnemyTestConfig = {
    enabled: true,
    scenario: 'static' as EnemyTestScenario,
    resetKey: 'R',
    resetKeyEnabled: true,
    staticSpawn: { x: 405, y: 180 },

    // Khusus tes, bukan parameter wave produksi:
    rainCount: 12,
    formationRepeat: 2
} as const;
```

Perilaku:

- `enabled: false` → tidak ada spawn tes dan reset key tidak didaftarkan.
- `resetKeyEnabled: false` → skenario tetap berjalan sekali saat mulai, tetapi tombol reset tidak aktif.
- `resetKey` berupa string key Phaser, misalnya `'R'`, `'F6'`, atau `'T'`.
- `rainCount` dan `formationRepeat` adalah nilai batch tes karena belum ada WaveManager.

---

## 5. Aturan Gameplay

### 5.1 Gerak

- `Grunt` memakai body Arcade yang immovable agar tidak terdorong player, tetapi `body.moves = true` agar bisa bergerak dengan velocity.
- `Grunt` wajib memanggil `setCollideWorldBounds(false)` supaya bisa spawn di atas layar dan despawn manual.
- `LinearMovement` mengatur velocity dari `speed` dan `angleRad` setiap frame.
- Grunt despawn saat `y > GruntConfig.despawnY`.
- Spawn di atas layar memakai `y = -GruntConfig.spawnMargin`.

### 5.2 Menembak

- Grunt hanya menembak setelah masuk area layar.
- Timer tembakan memakai `delta`, bukan frame count.
- `aimMode: 'down'`:
  - Arah peluru mengikuti `angleRad` movement.
  - `vx = sin(angle) * bulletSpeed`, `vy = cos(angle) * bulletSpeed`.
- `aimMode: 'targeted'`:
  - Arah dihitung dari muzzle ke posisi player saat peluru ditembakkan.
  - Tidak homing; peluru bergerak lurus setelah diluncurkan.
- Muzzle default di `x`, `y + muzzleOffsetY`; untuk diagonal, offset diterapkan sepanjang arah tembak.
- Peluru tetap memakai `EnemyBulletManager.spawn()`. Kalau pool penuh, spawn mengembalikan `null` dan Grunt tidak melakukan apa-apa.

### 5.3 Ditembak dan mati

- Peluru player memakai overlap Arcade yang sudah ada.
- Saat HP habis, `Enemy.die()` menonaktifkan Grunt dan body-nya.
- Grunt yang mati tidak di-`destroy()`; objek kembali ke pool dan di-reset saat spawn berikutnya.
- Tidak ada efek ledakan pada milestone ini.

### 5.4 Tabrakan player

- Grunt selalu hancur saat bertabrakan dengan player.
- Kalau shield aktif: `EffectManager.stop(Shield)`, nyawa aman.
- Kalau i-frame atau dash aktif: nyawa aman.
- Selain itu: panggil jalur damage player yang sama dengan peluru (`Player.applyHit()`), lalu emit event dan shockwave seperti perilaku sekarang.
- Batasi **satu damage tabrakan per frame** agar beberapa Grunt yang menumpuk tidak mengurangi beberapa nyawa sekaligus.
- Kalau player mati, alur game over yang sudah ada tetap dipakai.

### 5.5 Reset dan shutdown

- `Game.resetRun()` mereset `GruntTestRunner` dan `GruntPool`.
- `Game.handleShutdown()` melepas runner, pool, dan key reset.
- `DebugTools.destroy()` tetap melepas semua key, termasuk key reset opsional.
- Jangan `destroy()` objek pool per spawn; cukup nonaktifkan dan reset.

---

## 6. Fase Implementasi

### Fase 1 — Fondasi + Static Grunt

**Tujuan:** Grunt muncul di atas-tengah, bisa ditembak, menembak lurus, dan tabrakan sudah berfungsi.

**Langkah:**

1. Refactor `Enemy`:
   - Hapus `body.setImmovable(true)`, `body.moves = false`, dan `setVelocity(0, 0)` dari base.
   - Pindahkan pengaturan static ke `DummyEnemy`.
2. Tambah `types/IEnemyBulletSpawner.ts` dan `types/ITargetPosition.ts`.
3. Tambah `GruntConfig.ts` dan `EnemyTestConfig.ts`.
4. Tambah `patterns/IMovementPattern.ts` dan `patterns/LinearMovement.ts`.
5. Tambah `Grunt`:
   - Constructor menerima `IEnemyBulletSpawner` dan `ITargetPosition`.
   - `spawn(x, y, movement)` mereset HP, state, timer, posisi, dan velocity.
   - `updateEntity()` menjalankan movement, timer tembak, dan pengecekan despawn.
   - `fire()` menembak lurus ke bawah.
6. Tambah `GruntPool`:
   - Prewarm `GruntConfig.poolSize` Grunt.
   - Simpan array cache dan `Group`.
   - Sediakan `spawn()`, `reset()`, `activeCount`, dan `group`.
7. Tambah `GruntTestRunner`:
   - Skenario `static`: spawn satu Grunt di `EnemyTestConfig.staticSpawn`.
   - `start()` dipanggil sekali dari `Game.create()`.
8. Wiring `Game`:
   - Buat `GruntPool` setelah `EnemyBulletManager` dan `Player`, sebelum `PlayerLaser`.
   - Pakai `gruntPool.group` sebagai `this.enemies` untuk overlap peluru player dan laser.
   - Hapus penggunaan `DummyEnemy` dari `Game`; file `DummyEnemy` tetap ada.
   - Hapus `scheduleDummyRespawn` dan respawn dummy saat bom.
9. Damage player:
   - Ekstrak logika `handlePlayerHit` menjadi `damagePlayer()`.
   - Update `handlePlayerTouchesEnemy` sesuai aturan tabrakan di bagian 5.4.
   - Tambah guard satu damage tabrakan per frame.
10. DebugTools:
    - Tambah aksi `resetEnemyTest`.
    - Tambah opsi `resetKey` dan `resetKeyEnabled`.
    - Daftarkan key hanya jika `EnemyTestConfig.enabled` dan `resetKeyEnabled`.
11. Overlay (opsional tetapi disarankan):
    - Tampilkan nama skenario dan jumlah Grunt aktif.
12. Pastikan `Game.resetRun()` memanggil reset runner/pool.

**Kriteria selesai:**

- [ ] Grunt muncul di `x=405`, `y=180`.
- [ ] Peluru player mengurangi HP Grunt; Grunt hilang setelah HP habis.
- [ ] Grunt menembak lurus ke bawah setelah delay awal.
- [ ] Peluru Grunt mengenai player: nyawa 3 → 2 dan i-frame aktif.
- [ ] Player menabrak Grunt: Grunt hancur dan nyawa -1.
- [ ] Dengan shield: shield pecah, nyawa tetap.
- [ ] Dengan dash: Grunt hancur, nyawa tetap.
- [ ] `R` memunculkan ulang skenario.
- [ ] `bun x tsc --noEmit` dan `bun run build` lolos.

### Fase 2 — Targeted Shot

**Tujuan:** Grunt bisa menembak ke posisi player, dan mode lurus tetap bisa dipakai.

**Langkah:**

1. Implementasikan cabang `aimMode: 'targeted'` di `Grunt.fire()`.
2. Hitung vektor dari muzzle ke `target.x` / `target.y`, normalisasi, lalu kalikan `bulletSpeed`.
3. Pastikan arah diambil saat peluru ditembakkan, bukan setiap frame.
4. Verifikasi dengan mengubah `GruntConfig.weapon.aimMode` lalu tekan `R`.

**Kriteria selesai:**

- [ ] `aimMode: 'targeted'` membuat peluru mengarah ke posisi player saat ditembakkan.
- [ ] `aimMode: 'down'` tetap menembak lurus.
- [ ] Player yang berpindah posisi setelah peluru diluncurkan tidak mengubah arah peluru.

### Fase 3 — Rain

**Tujuan:** Rain spawn berulang dengan posisi X acak dan parameter yang bisa diubah dari config.

**Langkah:**

1. Tambah `RainFormation`:
   - Spawn `EnemyTestConfig.rainCount` unit.
   - X acak dalam `spawnXMin..spawnXMax`.
   - Interval `intervalMs` ditambah jitter `±jitterMs`.
   - Y spawn `-spawnMargin`.
2. Gunakan `LinearMovement` dengan `moveSpeed` dan `moveAngleDeg`.
3. Peluru mengikuti sudut gerak.
4. Setelah jumlah batch habis, formation selesai dan tidak spawn lagi sampai `R`.
5. `GruntTestRunner` memilih `RainFormation` saat `scenario: 'rain'`.

**Kriteria selesai:**

- [ ] Mengubah `spawnXMin`/`spawnXMax` mengubah sebaran horizontal.
- [ ] Mengubah `intervalMs`/`jitterMs` mengubah ritme spawn.
- [ ] Mengubah `moveSpeed`/`moveAngleDeg` mengubah gerak.
- [ ] Semua unit despawn setelah melewati `despawnY`.
- [ ] Peluru mengikuti sudut gerak.
- [ ] `R` mengulang batch dari awal.

### Fase 4 — Horizontal Wall

**Tujuan:** Satu baris Grunt muncul bersamaan, bergerak turun, dan formasi bisa diulang.

**Langkah:**

1. Tambah `WallFormation`:
   - Spawn `wall.count` unit.
   - Posisi X terpusat di `wall.centerX` dengan jarak `wall.spacing`.
   - Semua unit memakai movement yang sama.
2. Ulangi formasi sebanyak `EnemyTestConfig.formationRepeat`.
3. Jeda antar formasi memakai `wall.formationIntervalMs`.
4. `GruntTestRunner` memilih `WallFormation` saat `scenario: 'wall'`.

**Kriteria selesai:**

- [ ] Jumlah unit per baris sesuai `count`.
- [ ] Jarak horizontal sesuai `spacing`.
- [ ] Baris terpusat di `centerX`.
- [ ] Formasi berikutnya muncul setelah `formationIntervalMs`.
- [ ] Jumlah formasi sesuai `formationRepeat`.
- [ ] Peluru mengikuti sudut gerak (default ke bawah).

### Fase 5 — Vertical Line Lurus

**Tujuan:** Grunt muncul berurutan dalam satu kolom vertikal.

**Langkah:**

1. Tambah `StreamFormation` untuk mode lurus:
   - Spawn `stream.count` unit pada `stream.spawnX`.
   - Unit ke-`i` spawn di `y = -spawnMargin - i * spacing`.
   - Jeda antar unit `streamDelayMs`.
2. Ulangi formasi sebanyak `EnemyTestConfig.formationRepeat`.
3. Jeda antar formasi `stream.formationIntervalMs`.
4. `GruntTestRunner` memilih `StreamFormation` saat `scenario: 'stream-straight'`.

**Kriteria selesai:**

- [ ] Unit membentuk satu kolom vertikal.
- [ ] Jarak vertikal sesuai `spacing`.
- [ ] Urutan kemunculan sesuai `streamDelayMs`.
- [ ] Formasi berulang sesuai `formationRepeat` dan interval.
- [ ] Peluru mengikuti sudut gerak (default ke bawah).

### Fase 6 — Vertical Line Diagonal

**Tujuan:** Stream yang sama bisa bergerak diagonal dengan arah dan sudut yang bisa diatur.

**Langkah:**

1. Perluas `StreamFormation`:
   - `moveAngleDeg` 0–80.
   - `direction: 'ltr' | 'rtl'`.
   - `spawnX` menentukan titik awal; untuk `ltr` biasanya 48, untuk `rtl` 762.
   - Arah velocity: `ltr` = sudut positif, `rtl` = sudut negatif.
2. Peluru mengikuti `angleRad` movement.
3. `GruntTestRunner` memilih `StreamFormation` saat `scenario: 'stream-diagonal'`.

**Kriteria selesai:**

- [ ] Mengubah `moveAngleDeg` mengubah kemiringan gerak.
- [ ] `ltr` dan `rtl` menghasilkan arah yang berlawanan.
- [ ] Peluru keluar sejajar dengan arah gerak.
- [ ] Grunt despawn setelah melewati batas bawah atau keluar sisi layar.
- [ ] Tidak ada error saat sudut 0 atau 80.

### Fase 7 — Pembersihan dan Dokumentasi

**Langkah:**

1. Pastikan `DummyEnemy` tetap ada dan tidak dipakai sebagai enemy utama.
2. Hapus sisa kode dummy di `Game` yang tidak terpakai.
3. Update `docs/struktur-file.md`:
   - Tambah `Grunt`, `patterns`, `GruntPool`, formation, test runner, config baru.
   - Pastikan `DummyEnemy` tetap tercatat.
4. Update `docs/bullet-system.md`:
   - Status musuh sungguhan.
   - Catatan bahwa Grunt memakai `EnemyBulletManager`.
5. Cek tidak ada magic number baru di `scenes/`/`entities/`/`systems/`.
6. Jalankan typecheck dan build final.

**Kriteria selesai:**

- [ ] Semua file baru terdokumentasi.
- [ ] Tidak ada import yang melanggar arah dependensi.
- [ ] `bun x tsc --noEmit` lolos.
- [ ] `bun run build` lolos.

---

## 7. Verifikasi Manual

Tidak ada test runner otomatis di repo ini. Verifikasi dilakukan di browser.

```bash
bun run dev
# buka http://localhost:8080
```

Checklist umum:

1. Tekan `F1` untuk overlay.
2. Ubah `EnemyTestConfig.scenario` sesuai fase.
3. Ubah parameter di `GruntConfig` untuk menguji sensitivitas.
4. Tekan `R` untuk spawn ulang.
5. Ulangi sampai semua kriteria fase terpenuhi.
6. Jalankan:

```bash
bun x tsc --noEmit
bun run build
```

---

## 8. Catatan Teknis dan Risiko

1. **`PlayerLaser` menyimpan `enemies.getChildren()` saat konstruksi.** Pool Grunt harus dibuat sebelum `PlayerLaser`, dan group pool harus dipakai. Kalau tidak, laser tidak melihat Grunt.
2. **Spawn di atas layar.** `BaseEntity` memanggil `setCollideWorldBounds(true)`. Grunt harus mematikannya agar tidak dipaksa masuk ke `y=0`.
3. **Body Grunt.** Gunakan `setImmovable(true)` + `body.moves = true` supaya tidak terdorong player tetapi tetap bisa bergerak dengan velocity.
4. **Damage ganda.** Guard satu damage tabrakan per frame diperlukan karena beberapa Grunt bisa overlap dengan player bersamaan, terutama saat shield pecah.
5. **Key reset.** `R` saat ini tidak dipakai `InputBindings`. Kalau `resetKey` diganti ke key yang tidak valid, `keyboard.addKey()` bisa error; validasi saat implementasi.
6. **Pool capacity.** `poolSize` harus cukup untuk skenario terbesar. Jika `spawn()` mengembalikan `null`, tampilkan/overflow di overlay agar mudah didiagnosis.
7. **`DummyEnemy`.** Tetap disimpan, tetapi kalau tidak lagi dipakai, jangan biarkan field atau method dummy tertinggal di `Game` karena `noUnusedLocals`/`noUnusedParameters` aktif.
8. **Balance.** HP, damage, speed, dan interval di config masih nilai awal; sesuaikan setelah playtest.
9. **Tidak ada perubahan pada `EnemyBulletManager`.** Semua peluru musuh tetap tanpa body dan diproses manual.

---

## 9. Definition of Done

- Grunt bisa muncul, bergerak sesuai semua pola Tipe 1, menembak lurus dan targeted, ditembak player, dan hancur saat ditabrak.
- Tabrakan mengurangi nyawa player sesuai aturan imunitas.
- Semua parameter pola bisa diubah dari `GruntConfig` dan diverifikasi lewat `EnemyTestConfig` + `R`.
- Tidak ada WaveManager, score/combo, atau boss.
- `DummyEnemy` masih tersedia.
- Typecheck dan build lolos.
- Dokumentasi struktur dan bullet system diperbarui.
