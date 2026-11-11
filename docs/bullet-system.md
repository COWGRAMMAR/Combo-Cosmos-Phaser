# Bullet System — Fondasi (Fase 1–4)

Dokumen ini untuk yang nanti mengerjakan musuh, tipe peluru musuh, dan pola tembakan.
Tujuannya: kamu bisa menambah perilaku baru **tanpa menyentuh** pool, manager, atau scene.

- **Status:** Fase 1 (fondasi bullet) + Fase 2–4 (survival, efek & power-up, dash) selesai
- **Belum ada:** musuh sungguhan, pola tembakan, wave, score/combo, audio
- **Validasi:** `node "node_modules\typescript\bin\tsc" --noEmit` (exit 0)

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
| Musuh uji | `DummyEnemy` (placeholder, akan diganti) |
| Nyawa + i-frame + blink | `Player.applyHit()` / `startInvulnerability()` |
| Shockwave saat kena | `entities/effects/Shockwave.ts` |
| Efek berdurasi (atk speed, shield, laser) | satu `systems/EffectManager.ts` |
| Power-up | `systems/PowerUpManager.ts` (`apply(kind)`) |
| Dash | `Player` (aksi input `Dash`, binding `SHIFT`) |
| Overlay statistik | `ui/DebugOverlay.ts` (F1) |

---

## 2. Peta file

```
src/game/
├─ config/
│  ├─ PlayerConfig.ts        # hp, hitbox, nyawa, weapon, shockwave, atk speed, shield, laser, dash, bomb
│  ├─ EnemyConfig.ts         # hp musuh + bullet (speed, radius, pool, margin, lifetime)
│  ├─ WorldConfig.ts         # background + flag debug
│  └─ GameEvents.ts          # nama event (player-hit, bomb-used, ...)
├─ entities/
│  ├─ bullet/
│  │  ├─ Bullet.ts           # abstract: activate/deactivate/radius
│  │  ├─ PlayerBullet.ts     # pakai body fisika + damage
│  │  └─ EnemyBullet.ts      # tanpa body + hook moveStep
│  ├─ effects/
│  │  └─ Shockwave.ts        # ring meluas, clearInRadius tiap frame
│  ├─ player/
│  │  ├─ Player.ts           # gerak, nyawa, i-frame, shield, dash
│  │  ├─ PlayerWeapon.ts     # cooldown + jalur tembakan
│  │  └─ PlayerLaser.ts      # laser persisten, damage per interval
│  └─ enemy/
│     ├─ Enemy.ts            # base musuh (sudah ada)
│     └─ DummyEnemy.ts       # musuh uji sementara
├─ systems/
│  ├─ EnemyBulletManager.ts  # satu loop untuk semua peluru musuh
│  ├─ EffectManager.ts       # satu timer durasi untuk semua efek
│  ├─ PowerUpManager.ts      # eksekusi efek power-up
│  └─ DebugTools.ts          # F1–F4 + 1–6 (titik masuk sistem debug nanti)
├─ types/
│  └─ EffectType.ts          # enum FireRate / Shield / Laser
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

`Enemy` (dan nantinya subclass musuh) sudah meng-extend `BaseEntity`, jadi otomatis memenuhi kontrak itu.
Yang perlu kamu siapkan di musuh baru:

- `takeDamage()` menangani HP dan memanggil `die()` saat habis (sudah di `BaseEntity`).
- Jangan panggil `destroy()`. Pakai `setActive(false)` + `setVisible(false)` + `body.enable = false`
  supaya musuh bisa masuk pool lagi.
- Untuk menembak, panggil `enemyBulletManager.spawn(...)`. Jangan membuat group/pool sendiri.

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
2. Tambah placeholder di `utils/textures.ts` (pola: kalau texture sudah ada, jangan ditimpa,
   jadi PNG final dari Preloader otomatis menang).
3. Tambah opsi `texture` bila perlu, atau buat spawn helper di sistemmu sendiri.

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
| `enemy-killed`, `score-changed`, `combo-changed` | `config/GameEvents.ts` | belum dipakai bullet system |

Aturan: manager/sistem **tidak** mengubah HP atau nyawa pemain secara langsung.
Kirim event, biarkan pemilik state yang mengubah.

---

## 8. Reset

`Game.resetRun()` saat ini:

- `effects.reset()` (semua efek durasi berhenti)
- `weapon.reset()` + `weapon.clearAll()`
- `enemyBullets.reset()`
- `shockwave.stop()`
- `laser.reset()`
- membatalkan respawn dummy yang tertunda
- reset counter statistik, `gameOverPending`, dan kembali ke posisi awal
- `player.resetForPool(512, 680)` (nyawa, shield, dash, i-frame, alpha ikut di-reset)

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
| `1` | power-up lane (+1, permanen per run) |
| `2` | power-up atk speed (durasi) |
| `3` | power-up shield (durasi) |
| `4` | power-up laser (durasi) |
| `5` | bom nuke (damage semua musuh + `clearAll`) |
| `6` | tambah nyawa (maks `PlayerConfig.maxLives`) |

Overlay menampilkan FPS, waktu frame, jumlah peluru pemain/musuh, puncak per pool,
overflow, jumlah hit ke pemain, jumlah jalur, nyawa, serta status `dash`/`kebal`/
`shield`/`atk+`/`laser`.

`systems/DebugTools.ts` sengaja hardcoded dan terpisah: nanti file ini jadi pintu masuk
sistem debug yang lebih lengkap.

---

## 10. Yang belum ada (jangan diasumsikan)

- Musuh sungguhan, pola tembakan, wave, score/combo
- Item power-up yang jatuh dan bisa diambil (sekarang hanya lewat tombol debug)
- Audio/SFX, HUD permanen selain overlay debug
- `DummyEnemy` hanya untuk menguji damage; ganti saat musuh asli sudah siap.
