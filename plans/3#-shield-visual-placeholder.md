# Plan: Placeholder Visual Shield (Lingkaran, Warna Shockwave)

**Branch:** `COW's-Branch`
**Status:** Draft (menunggu ACC)
**Tanggal:** 2026-11-08

---

## 1. Tujuan

Tambahkan **placeholder visual shield** sementara berupa lingkaran di sekitar pemain dengan warna yang sama dengan shockwave (`0x7df9ff`). Lingkaran muncul saat `shieldActive == true` dan hilang saat `shieldActive == false` atau durasi habis.

Ini adalah **placeholder** (tidak final art), hanya untuk verifikasi visual selama development.

---

## 2. Sistem Shield yang Sudah Ada (tidak perlu diubah)

| Komponen | File | Baris | Keterangan |
|---|---|---|---|
| Durasi shield | `src/game/config/PlayerConfig.ts` | 37-39 | `shield.durationMs = 10000` |
| Enum efek | `src/game/types/EffectType.ts` | 5 | `Shield = 'shield'` |
| Manager durasi | `src/game/systems/EffectManager.ts` | 1-111 | `activate/stop/isActive/reset`, Shield dalam `EFFECT_TYPES` |
| Routing start | `src/game/scenes/Game.ts` | 329-331 | `Shield → player.setShield(true)` |
| Routing end | `src/game/scenes/Game.ts` | 346-348 | `Shield → player.setShield(false)` |
| State pemain | `src/game/entities/player/Player.ts` | 20 | `private shieldActive` |
| Getter | `src/game/entities/player/Player.ts` | 63-67 | `get isShieldActive()` |
| Nyalakan/matikan | `src/game/entities/player/Player.ts` | 117-121 | `setShield(active)` |
| Gate damage | `src/game/entities/player/Player.ts` | 111-115 | `isDamageImmune() = isInvulnerable() \|\| shieldActive` |
| Gate peluru musuh | `src/game/systems/EnemyBulletManager.ts` | 156 | `canHitPlayer = ... && !player.isDamageImmune()` |
| Tabrakan body | `src/game/scenes/Game.ts` | 101-108 | Shield pecah saat sentuh musuh, tidak damage |
| Debug | `src/game/scenes/Game.ts` | 391 | `stats.shieldActive = player.isShieldActive` |

**Kesimpulan:** logika shield sudah lengkap. Yang kurang hanyalah **visual** (lingkaran di sekitar pemain).

---

## 3. Jawaban: Shield Tidak Mematikan Hitbox Pemain

Shield **tidak mematikan/menghilangkan hitbox pemain**. Kedua hitbox pemain tetap aktif:

- Arcade body radius 20 (`PlayerConfig.bodyRadius`) — untuk tabrakan body-vs-musuh (`Game.ts:225`)
- Manual hitRadius 7 (`PlayerConfig.hitRadius`) — untuk tabrakan peluru musuh (`EnemyBulletManager.ts:189`)

Shield bekerja sebagai **damage immunity + one-hit absorb**:

1. **Peluru musuh**: `EnemyBulletManager.update()` memeriksa `!player.isDamageImmune()` (baris 156). Saat shield aktif, peluru diabaikan (tidak ada damage, peluru tidak dihancurkan oleh gate ini).
2. **Tabrakan body dengan musuh**: `Game.handlePlayerTouchesEnemy` (baris 101-108) memanggil `effects.stop(EffectType.Shield)` — shield **pecah** (hilang) tetapi pemain **tidak menerima damage**. Tanpa shield, tabrakan body diabaikan (tidak ada damage).

Jadi shield = **satu kali penahanan damage** pada tabrakan body, dan **imunitas penuh** terhadap peluru musuh selama durasi 10 detik.

---

## 4. File yang Akan Dibuat / Diubah

### 4.1 File baru: `src/game/entities/effects/Shield.ts`

Mengikuti pola `Shockwave.ts` (Graphics circle, `scene.add.graphics`, depth `DepthConfig.effect`):

- Konstruktor: buat `graphics`, set depth `DepthConfig.effect` (500), sembunyikan awalnya
- `start(x, y)`: set posisi pusat, radius awal (misal sesuai `PlayerConfig.bodyRadius` atau sedikit lebih besar), tampilkan graphics
- `update(delta)`: gambar ulang lingkaran outline dengan warna `0x7df9ff`, alpha konstan (tidak fade seperti shockwave karena shield aktif terus-menerus selama durasi)
- `stop()`: sembunyikan graphics, bersihkan
- `destroy()`: hancurkan graphics

Referensi warna: sama dengan `Shockwave.ts:61` (`0x7df9ff`).

### 4.2 File diubah: `src/game/scenes.Game.ts`

- Impor `Shield` dari `../entities/effects/Shield`
- Tambah field `private shield?: Shield`
- Konstruktor: buat `this.shield = new Shield(this, ...)` (baris sekitar 215, bersama `this.shockwave`)
- `update()`: panggil `this.shield?.update(delta)`
- Saat `handleEffectStart` case `Shield` (baris 329): panggil `this.shield?.start(player.x, player.y)` setelah `setShield(true)`
- Saat `handleEffectEnd` case `Shield` (baris 347): panggil `this.shield?.stop()` setelah `setShield(false)`
- Saat reset/run baru: reset shield state
- `destroy()`: panggil `this.shield?.destroy()`

Posisi lingkaran diikuti pemain setiap frame via `update(delta)` — ambil `player.x`, `player.y` dari instance pemain yang sudah ada.

### 4.3 File diubah: `doc/struktur-file.md`

Tambah entri `Shield.ts` di bagian `entities/effects/` pada daftar struktur file.

---

## 5. File yang TIDAK Diubah (alasan)

| File | Alasan |
|---|---|
| `src/game/entities/player/Player.ts` | `shieldActive`, `isShieldActive`, `setShield`, `isDamageImmune` sudah ada |
| `src/game/systems/EffectManager.ts` | Shield sudah terdaftar dan diatur durasi |
| `src/game/config/PlayerConfig.ts` | `shield.durationMs` sudah ada |
| `src/game/systems/EnemyBulletManager.ts` | Sudah gate damage lewat `isDamageImmune()` |

---

## 6. Risiko & Pertimbangan

| Risiko | Mitigasi |
|---|---|
| Lingkaran shield tertimpa shockwave (keduanya depth 500) | Shield digambar setelah shockwave di urutan `update`, atau gunakan depth berbeda sementara. Karena keduanya efekt pendek, overlap visual diterima untuk placeholder. |
| Lingkaran tidak mengikuti gerak pemain | Panggil `shield.update(delta)` setiap frame dan ambil `player.x/y` terbaru. |
| Shield tetap muncul setelah mati/reset | Panggil `shield.stop()` di `resetForPool` dan `die` flow, serta saat `handleEffectEnd`. |

---

## 7. Definisi Selesai (DoD)

- [ ] `src/game/entities/effects/Shield.ts` dibuat, JSDoc Bahasa Indonesia, 1 class per file
- [ ] `Game.ts` menyalakan/mematikan shield visual sinkron dengan `setShield`
- [ ] Lingkaran muncul saat shield aktif, hilang saat tidak aktif/durasi habis
- [ ] Warna lingkaran = `0x7df9ff` (sama shockwave)
- [ ] `doc/struktur-file.md` diperbarui
- [ ] `tsc --noEmit` exit 0

---

## 8. Estimasi

Sederhana (1 file baru + wiring di Game.ts). Estimasi 1-2 tahap implementasi.

---

**Menunggu ACC sebelum implementasi.** Apakah rencana ini disetujui, atau ada yang ingin diubah?
