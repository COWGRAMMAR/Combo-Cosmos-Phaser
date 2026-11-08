# Plan: Sinkronisasi Posisi Shield & Laser ke Sprite Player

## Masalah
Shield dan laser kelihatan "telat satu frame" di belakang pemain saat bergerak.

## Root Cause
- Posisi player diupdate di `BaseEntity.preUpdate()` (Phaser memanggil `preUpdate` sebelum `Scene.update()`). Arcade Physics memindahkan sprite (`this.x`, `this.y` berubah).
- Shield (`Game.ts:274`) dan laser (`Game.ts:275`) diupdate di dalam callback `runFixedStepsWithTimeConfig` (fixed-step while loop) di `Game.update()`.
- Callback fixed-step bisa berjalan 0, 1, atau lebih kali per frame tergantung accumulator. Dalam frame tertentu callback **tidak jalan sama sekali** (accumulator belum cukup `fixedStepMs`). Saat itu shield & laser **tidak update posisi** — diam di posisi lama — sementara player sudah bergerak di `preUpdate`.

## Tujuan
Posisi visual shield & laser selalu sinkron dengan sprite player setiap frame (tidak ada lag/telat).

## Pendekatan: Opsi A (direkomendasikan)
Pindahkan **position update** shield & laser dari *dalam* fixed-step while loop ke **luar** loop, di akhir `Game.update()`, sehingga dijamin berjalan **1x per frame** dengan posisi player terbaru (post-physics).

### Perubahan file

**`src/game/scenes/Game.ts`**
1. Di dalam callback `runFixedStepsWithTimeConfig` (baris 270-276):
   - Hapus `this.shield?.update(this.player?.x ?? 0, this.player?.y ?? 0);` (baris 274)
   - Hapus `this.laser?.update(fixedStepMs);` (baris 275) — atau ganti dengan pemanggilan damage-only jika ada metode terpisah
   - `this.shockwave?.update(fixedStepMs);` tetap (tidak perlu sinkron visual per-frame)
2. Di akhir `Game.update()` (setelah baris 277, sebelum `this.updateStats(delta)`):
   - Tambahkan `this.shield?.update(this.player?.x ?? 0, this.player?.y ?? 0);`
   - Tambahkan pemanggilan position update laser: `this.laser?.setPosition(this.player?.x ?? 0, this.player?.y ?? 0);` (methode baru di PlayerLaser)

**`src/game/entities/player/PlayerLaser.ts`**
1. Tambah metode `setPosition(x: number, y: number): void` yang memanggil `this.beam.setPosition(x, y - PlayerConfig.laser.length / 2)`.
2. Di `update(delta)`: hapus baris `this.beam.setPosition(...)` (baris 61) agar tidak duplikasi, sisakan hanya `tickAccumulator` + `damageEnemiesInBeam`.

**`doc/struktur-file.md`**
- Tidak ada perubahan (tidak ada file baru/dihapus/dipindah).

### Kriteria berhasil
- `tsc --noEmit` exit 0 (kecuali error pre-existing `maxHp` di Game.ts:187).
- Shield dan laser mengikuti posisi player tanpa kelihatan telat saat bergerak ke kiri/kanan/atas/bawah.
- Laser masih memberi damage per interval (tidak terpengaruh pemisahan position update).

### Risiko
- Pemisahan position laser dari `update(delta)` berarti jika `setPosition` tidak dipanggil (misal lupa di Game.update), laser akan diam di posisi terakhir. Mitigasi: pastikan pemanggilan selalu ada di akhir `Game.update()`.

## Estimasi
Sederhana, risiko rendah. Tidak perlu build (menunggu konfirmasi user per AGENTS.md).