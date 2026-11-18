# Bullet System — Fondasi & Musuh Pertama

Dokumen ini untuk yang mengerjakan musuh, tipe peluru musuh, dan pola tembakan.
Tujuannya: kamu bisa menambah perilaku baru **tanpa menyentuh** pool, manager, atau scene.

- **Status:** Fase 1 (fondasi bullet) + Fase 2–4 (survival, efek & power-up, dash) + Grunt Tipe 1 (pola `single`/`wall`/`stream`, `rain`, hit flash, ledakan) selesai
- **Belum ada:** wave manager, enemy Tipe 2/Boss, score/combo, audio
- **Validasi:** `bun x tsc --noEmit` lalu `bun run build` (tidak ada test runner otomatis)
- **Panduan uji Grunt:** `docs/panduan-uji-grunt.md`

---

## 1. Apa yang sudah disediakan

| Kebutuhan | Disediakan oleh |
|---|---|
| Pool peluru pemain | `PlayerWeapon` (Phaser Physics Group, `maxSize` dari config) |
| Pool peluru musuh | `EnemyBulletManager` (Phaser Group biasa, tanpa fisika) |
| Gerak + tabrakan peluru pemain | Arcade Physics + `physics.add.overlap` di `Game.ts` |
| Peluru pemain keluar layar | event `worldbounds` → `deactivate()` |
| Gerak, culling, tabrakan peluru musuh | satu loop manual di `EnemyBulletManager.update()` |
| Tembakan 1–5 jalur | `PlayerConfig.weapon.lanes` (atau tombol debug F4) |
| Musuh pertama | `Grunt` (`entities/enemy/Grunt.ts`), dikelola `systems/enemy/GruntPool.ts` |
| Pola spawn musuh | `SingleFormation`, `WallFormation`, `StreamFormation`, `RainFormation` |
| Harness tes tanpa wave | `EnemyTestConfig` + `GruntTestRunner` (tombol `R`) |
| Umpan balik damage | `Enemy.onDamaged()` (hit flash tint) + `systems/effects/EnemyExplosionPool.ts` |
| Nyawa + i-frame + blink | `Player.applyHit()` / `startInvulnerability()` |
| Shockwave saat kena | `entities/effects/Shockwave.ts` |
| Efek berdurasi (atk speed, shield, laser) | satu `systems/EffectManager.ts` |
| Power-up | `systems/PowerUpManager.ts` (`apply(kind)`) |
| Dash | `Player` (aksi input `Dash`, binding `SHIFT`) |
| Overlay statistik | `ui/DebugOverlay.ts` (F1) |

---

## 2. Peta file

Peta ringkas; struktur lengkap ada di `docs/struktur-file.md`.

```
src/game/
├─ config/
│  ├─ PlayerConfig.ts        # hp, hitbox, nyawa, weapon, shockwave, atk speed, shield, laser, dash, bomb
│  ├─ EnemyConfig.ts         # hp musuh, hit flash, ledakan, bullet (speed, radius, pool, margin, lifetime)
│  ├─ GruntConfig.ts         # parameter Grunt: senjata, pola single/wall/stream, rain
│  ├─ EnemyTestConfig.ts     # skenario tes Grunt + tombol reset
│  ├─ WorldConfig.ts         # background + flag debug
│  ├─ ScreenConfig.ts        # ukuran desain, play area, spawn pemain
│  └─ GameEvents.ts          # nama event (player-hit, enemy-killed, ...)
├─ entities/
│  ├─ BaseEntity.ts          # HP, damage, hook onDamaged()/onDeath(), reset pool
│  ├─ bullet/
│  │  ├─ Bullet.ts           # abstract: activate/deactivate/radius
│  │  ├─ PlayerBullet.ts     # pakai body fisika + damage
│  │  └─ EnemyBullet.ts      # tanpa body + hook moveStep
│  ├─ effects/
│  │  ├─ Shockwave.ts        # ring meluas, clearInRadius tiap frame
│  │  └─ Shield.ts           # lingkaran shield di sekitar pemain
│  ├─ player/
│  │  ├─ Player.ts           # gerak, nyawa, i-frame, shield, dash
│  │  ├─ PlayerWeapon.ts     # cooldown + jalur tembakan
│  │  └─ PlayerLaser.ts      # laser persisten, damage per interval
│  └─ enemy/
│     ├─ Enemy.ts            # base musuh: hit flash, event kematian, die()
│     ├─ Grunt.ts            # musuh Tipe 1: gerak via pattern + timer tembak
│     ├─ EnemyState.ts       # enum Active / Dying
│     ├─ DummyEnemy.ts       # alat debug, TIDAK di-wire ke Game
│     └─ patterns/
│        ├─ IMovementPattern.ts
│        └─ LinearMovement.ts
├─ systems/
│  ├─ EnemyBulletManager.ts  # satu loop untuk semua peluru musuh
│  ├─ EffectManager.ts       # satu timer durasi untuk semua efek
│  ├─ PowerUpManager.ts      # eksekusi efek power-up
│  ├─ AssetManager.ts        # manifest, placeholder, resolve()
│  ├─ effects/
│  │  └─ EnemyExplosionPool.ts # ledakan musuh: membesar + memudar
│  ├─ enemy/
│  │  ├─ GruntPool.ts        # pool prewarm + group untuk overlap
│  │  ├─ GruntTestRunner.ts  # pilih & jalankan skenario tes
│  │  └─ *Formation.ts       # Single / Wall / Stream / Rain
│  ├─ power-ups/             # buff, slot inventory, spawn manager
│  └─ DebugTools.ts          # F1–F4, Z–N, R (titik masuk sistem debug nanti)
├─ types/
│  ├─ EffectType.ts          # enum FireRate / Shield / Laser
│  ├─ AssetRef.ts            # tekstur + frame hasil resolve
│  └─ IEnemyBulletSpawner.ts # kontrak spawn peluru untuk musuh
└─ ui/
   └─ DebugOverlay.ts        # teks statistik + nyawa + status efek
```

---

## 3. Kontrak yang diharapkan dari musuh

Peluru pemain hanya butuh dua hal dari musuh:

```ts
interface IDamageable {
    readonly hp: number;
    readonly isAlive: boolean;
    takeDamage(amount: number, source?: unknown): void;
}
```

`Grunt` dan subclass musuh lain meng-extend `BaseEntity`, jadi otomatis memenuhi kontrak itu.
Yang perlu kamu siapkan di musuh baru:

- `takeDamage()` menangani HP. Saat HP habis ia memanggil hook `onDeath()`; default
  `onDeath()` memanggil `die()`, sedangkan `Enemy.onDeath()` memancarkan
  `GameEvents.ENEMY_KILLED` sebelum `die()` supaya `Game` bisa memunculkan ledakan.
- Jangan panggil `destroy()`. Pakai `setActive(false)` + `setVisible(false)` + `body.enable = false`
  supaya musuh bisa masuk pool lagi. Buang musuh yang keluar layar lewat `die()`; `kill()`
  khusus untuk kematian yang layak mendapat ledakan (mis. tabrakan badan).
- Untuk menembak, panggil `enemyBulletManager.spawn(...)`. Jangan membuat group/pool sendiri.
- Kalau butuh feedback visual, override `onDamaged()` (lihat hit flash di `Enemy`); jangan
  menaruh timer efek di `update()` scene.

---

## 4. API `EnemyBulletManager`

```ts
const manager = new EnemyBulletManager(scene, player, onPlayerHit?);

manager.spawn(x, y, velocityX, velocityY, options?); // return EnemyBullet | null
manager.clearAll();                                  // nuke / reset
manager.clearInRadius(x, y, radius);                 // shockwave / shield break
manager.update(delta);                               // dipanggil Game.update()
```

Getter statistik: `activeCount`, `maxActive`, `overflowCount`, `playerHitCount`, `bulletGroup`.

Catatan penting:

- `spawn()` mengembalikan `null` kalau pool penuh. **Jangan** menganggap selalu berhasil.
  Overflow dihitung dan ditampilkan di overlay.
- `onPlayerHit` sudah dipasang `Game.ts`: manager memanggilnya, lalu `Game`
  meng-emit `GameEvents.PLAYER_HIT`. Manager **tidak** mengubah nyawa pemain.
- Tabrakan dengan pemain dilewati kalau `player.isDamageImmune(now)` bernilai `true`
  (i-frame **atau** shield aktif). Jadi shield memblokir semua peluru musuh tanpa
  logika tambahan di manager.
- Maksimal **satu** hit pemain per frame, supaya 3000 peluru tidak menghabiskan
  semua nyawa dalam satu frame.
- Manager tidak pernah `destroy()` peluru. Semua peluru dipakai ulang.

---

## 5. Menambah tipe peluru musuh

### Aturan keputusan

| Yang berbeda | Tempat yang benar |
|---|---|
| Hanya angka: ukuran, kecepatan, warna/texture, lifetime | **config / opsi spawn** |
| Perilaku gerak: homing, melengkung, memperlambat, orbit | **hook `moveStep`** |

Jangan membuat subclass baru per tipe peluru. Satu class `EnemyBullet` cukup.

### Contoh: peluru lurus cepat (cukup opsi spawn)

```ts
manager.spawn(x, y, 0, 420, { radius: 6 });
```

### Contoh: peluru homing (pakai hook)

```ts
// Contoh ilustratif; taruh di sistem/pola milikmu.
const homingStep = (bullet: EnemyBullet, delta: number) =>
{
    // Arahkan peluru ke pemain, lalu gerakkan seperti biasa.
    const dx = player.x - bullet.x;
    const dy = player.y - bullet.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length > 0)
    {
        bullet.velocityX = (dx / length) * speed;
        bullet.velocityY = (dy / length) * speed;
    }

    const step = delta / 1000;

    bullet.x += bullet.velocityX * step;
    bullet.y += bullet.velocityY * step;
};

manager.spawn(x, y, 0, 0, { moveStep: homingStep });
```

Hook dipanggil **sekali per frame per peluru aktif** oleh manager.
Hook di-reset otomatis ke gerak lurus saat peluru dikembalikan ke pool,
jadi tidak ada state yang bocor ke spawn berikutnya.

### Kalau butuh texture baru

1. Tambah key di `config/AssetKeys.ts`.
2. Daftarkan entri di `config/AssetManifest.ts` (`source: 'generated'` bila placeholder).
3. Tambah resep gambar di `systems/AssetManager.ts` (pola: kalau texture sudah ada, jangan ditimpa,
   jadi PNG final dari Preloader otomatis menang).
4. Tambah opsi `texture` bila perlu, atau buat spawn helper di sistemmu sendiri.

Detail lengkap ada di `docs/asset-system.md`.

---

## 6. Aturan performa (wajib di hot path)

Ini bukan saran. Peluru bisa 3000+ dalam satu frame.

1. **Jangan** membuat object/array/closure baru di `update()`.
2. **Jangan** memakai `forEach`, `.map`, `.filter`, atau `getChildren()` di dalam loop per frame.
   `Group.getChildren()` mengembalikan array baru setiap panggilan.
3. Pakai `for` biasa dan array yang sudah di-cache saat konstruksi.
4. Semua gerak memakai `delta` (detik = `delta / 1000`), bukan frame count.
5. Satu texture per jenis peluru supaya render batch-nya rapi.
6. Jangan mengaktifkan body fisika untuk peluru musuh. Fisika hanya untuk peluru pemain.

Helper yang sudah dipakai: `Phaser.Math.Distance.Squared` (tanpa `sqrt`), perbandingan
`dx * dx + dy * dy <= radius * radius`.

---

## 7. Event & komunikasi antar sistem

| Event | Sumber | Status |
|---|---|---|
| `worldbounds` | `Phaser.Physics.Arcade.Events.WORLD_BOUNDS` | dipakai internal untuk peluru pemain |
| `player-hit` | `EnemyBulletManager` → callback → `Game` emit | aktif |
| `player-damaged` | `Game` setelah nyawa berkurang | aktif, payload `{ lives }` |
| `player-died` / `game-over` | `Game` saat nyawa habis | aktif |
| `bomb-used` | `PowerUpManager.useBomb()` | aktif |
| `enemy-killed` | `Enemy.onDeath()` | aktif — payload `(x, y)`, memicu ledakan di `Game` |
| `score-changed`, `combo-changed` | `config/GameEvents.ts` | belum dipakai (menunggu score/combo) |

Aturan: manager/sistem **tidak** mengubah HP atau nyawa pemain secara langsung.
Kirim event, biarkan pemilik state yang mengubah.

---

## 8. Reset

`Game.resetRun()` saat ini:

- `effects.reset()` + `activeBuffManager.reset()` + `slotManager.reset()` (semua durasi & inventory kembali)
- `spawnManager.stop()`
- `weapon.reset()` + `weapon.clearAll()`
- `enemyBullets.reset()` (satu loop membersihkan semua peluru)
- `shockwave.stop()`, `shield.stop()`, `laser.reset()`, `explosions.reset()`
- reset counter statistik + `gameOverPending` + `lastEnemyContactFrame`
- `player.resetForPool(ScreenConfig.spawn.playerX, ScreenConfig.spawn.playerY)` (nyawa, shield, dash, i-frame, alpha ikut di-reset)
- `gruntTestRunner.start()` — skenario tes Grunt diulang dari pola pertama (`GruntPool.reset()` di dalamnya)

Kalau kamu menambah pool/state baru, tambahkan pembersihannya di fungsi ini.
Jangan membuat fungsi reset terpisah yang tidak dipanggil.

---

## 9. Debug

| Tombol | Fungsi |
|---|---|
| `F1` | toggle overlay statistik |
| `F2` | spawn 1000 peluru musuh sekaligus |
| `F3` | spawn 3000 peluru musuh sekaligus |
| `F4` | putar jumlah jalur 1 → 2 → 3 → 4 → 5 → 1 |
| `R` | ulangi skenario tes Grunt dari awal + bersihkan peluru musuh |
| `Z` | power-up lane (+1, permanen per run) |
| `X` | power-up atk speed → masuk slot inventory |
| `C` | power-up shield → masuk slot inventory |
| `V` | power-up laser → masuk slot inventory |
| `B` | power-up nuke → masuk slot inventory |
| `N` | tambah nyawa (maks `PlayerConfig.maxLives`) |
| `1`–`3` | pakai isi slot inventory |
| `E` + `1`–`3` | buang isi slot inventory |

Overlay menampilkan FPS, waktu frame, jumlah peluru pemain/musuh, puncak per pool,
overflow, jumlah hit ke pemain, jumlah jalur, nyawa, serta status `dash`/`kebal`/
`shield`/`atk+`/`laser`.

`systems/DebugTools.ts` sengaja hardcoded dan terpisah: nanti file ini jadi pintu masuk
sistem debug yang lebih lengkap.

---

## 10. Yang belum ada (jangan diasumsikan)

- WaveManager/difficulty curve, enemy Tipe 2 & Boss, score/combo
- Item power-up yang jatuh sendiri dan bisa diambil di lapangan
- Audio/SFX, HUD permanen di luar overlay debug
- `DummyEnemy` masih ada sebagai alat debug, tetapi **tidak** di-wire ke `Game`;
  enemy yang benar-benar berjalan adalah `Grunt` (lihat `docs/panduan-uji-grunt.md`).
