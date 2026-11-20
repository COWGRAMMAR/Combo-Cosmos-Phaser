# Plan #7 — Pemisahan Konfigurasi Power-Up & Debug

Status: **ACC** (2026-11-20). Refactor murni: **tidak ada nilai angka/key yang boleh berubah** (semua sudah dituning manual oleh user).
Plan terkait: `plans/5#-power-up-item-movement.md`, `plans/6#-dynamic-spawn-zone.md`.

## 1. Tujuan
1. Menyatukan konfigurasi power-up ke satu pintu `PowerUpConfig.ts` (4 domain).
2. Memindahkan seluruh nilai debug (key, jumlah stress, styling visual) ke `DebugConfig.ts`.
3. Menghapus `PowerUpMovementConfig.ts` yang saat ini mencampur domain gerak dengan styling debug.
4. Menjaga agar `config/` tetap boleh mengimpor `types/` (rule 8 `docs/struktur-file.md`).

## 2. Non-goal
- Tidak mengubah perilaku gameplay, urutan spawn, maupun rumus gerak.
- Tidak mengubah nilai tuning apa pun (angka, warna, alpha, key, urutan tombol).
- Tidak menyentuh sistem buff/inventory/HUD selain penyesuaian path config.
- Tidak menambah pola gerak baru.

## 3. Keputusan final (dari user)
| # | Keputusan | Alasan |
| - | --------- | ------ |
| D1 | `patternBagCounts` + `ranges` masuk `PowerUpConfig` sebagai domain ke-4 `movement` | Satu sumber kebenaran power-up; bukan di dalam `spawn` karena gerak bukan bagian dari proses spawn |
| D2 | Enum `PowerUpType` dipindah ke `src/game/types/PowerUpType.ts` | `config/` hanya boleh impor `types/`; `DebugConfig` butuh enum untuk peta tombol |
| D3 | `WorldConfig.debug.enabled` pindah ke `DebugConfig.enabled` | Satu saklar debug, tidak terpencar |
| D4 | `PowerUpMovementConfig.ts` dihapus | Isinya habis terbagi ke `PowerUpConfig.movement` dan `DebugConfig.graphics` |
| D5 | `EnemyTestConfig.resetKey` tetap di `EnemyTestConfig` | Kohesi fitur enemy test; sudah lewat `DebugOptions` |
| D6 | Nilai gameplay yang dibaca debug (`itemRadius`, `itemDepth`, `minPlayerSpawnDistance`) tetap di `PowerUpConfig` | Itu data gameplay, bukan styling debug |

## 4. Struktur `PowerUpConfig` (4 domain, urutan lifecycle)
`render` → `item` → `spawn` → `movement`

- **render**: warna/ukuran/alpha/depth item + peta ikon (`iconColor`, `iconKey`, `iconAssetKey`).
- **item**: aturan item sebagai entitas inventory (`slotCount`, `maxStackPerSlot`, `pickupRadius`, `despawnMargin`, `poolSize`, `spawnIntervalMs`, `spawnJitterMs`).
- **spawn**: aturan memunculkan item (`spawnZone`, `minPlayerSpawnDistance`, `bobot`).
- **movement**: jalur gerak (`patternBagCounts`, `ranges` per pola).

Nilai dipertahankan persis seperti kondisi repo saat ini, termasuk hasil tuning terakhir
(`itemsPerZone: 1`, `minDistanceMin/Max: 100/700`, `pickupRadius: 60`, `despawnMargin: 80`,
`spawnJitterMs: 4000`, `straight.speed: 100–250`).

## 5. Struktur `DebugConfig`
- `enabled`: saklar global visual debug (pengganti `WorldConfig.debug.enabled`).
- `keys`: F1/F2/F3/F4 + daftar `powerUps` (`{ type, key }` urut Z→N).
- `stress`: `light`/`heavy` untuk F2/F3.
- `graphics`: `depthOffset`, `lineWidth`, `path`, `spawnZone`, `playerRing`, `direction`.

## 6. File yang disentuh
**Baru**
| File | Isi |
| ---- | --- |
| `src/game/types/PowerUpType.ts` | enum `PowerUpType` (6 anggota, nilai sama) |
| `src/game/config/DebugConfig.ts` | seluruh nilai debug |

**Dihapus**
| File | Alasan |
| ---- | ------ |
| `src/game/config/PowerUpMovementConfig.ts` | isi terbagi ke `PowerUpConfig.movement` + `DebugConfig.graphics` |

**Diubah**
| File | Perubahan |
| ---- | --------- |
| `src/game/config/PowerUpConfig.ts` | ditata ulang jadi 4 domain, `movement` digabung |
| `src/game/config/WorldConfig.ts` | hapus blok `debug` |
| `src/game/systems/power-ups/PowerUpMovement.ts` | import `PowerUpConfig`, akses `movement.*`, pesan error baru |
| `src/game/systems/power-ups/PowerUpItem.ts` | akses `render.*` |
| `src/game/systems/power-ups/PowerUpSpawnManager.ts` | akses `item.*`, `spawn.*`, `render.itemRadius` |
| `src/game/systems/power-ups/PowerUpSlotManager.ts` | akses `item.*` |
| `src/game/systems/DebugTools.ts` | seluruh key/stress/styling dari `DebugConfig`; hapus literal inline |
| `src/game/systems/PowerUpManager.ts` | hapus definisi enum, impor dari `types/` |
| `src/game/ui/DebugOverlay.ts` | `DebugConfig.enabled` |
| `src/game/ui/HudRightPanel.ts` | `item.slotCount`, cast `render.icon*` |
| `src/game/ui/ActiveBuffRow.ts` | komentar JSDoc path config |
| `src/game/scenes/Game.ts` | impor tipe dari `types/`, `item.slotCount` |
| `docs/struktur-file.md` | daftar config/types, deskripsi PowerUpConfig & DebugTools |
| `docs/debug-toggles.md` | sumber saklar debug + tabel config |

## 7. Peta call-site `PowerUpConfig` (wajib semua diperbarui)
| File | Baris | Path baru |
| ---- | ----- | --------- |
| `Game.ts` | 447 | `item.slotCount` |
| `ui/HudRightPanel.ts` | 99, 226, 233 | `item.slotCount`, `render.iconAssetKey`, `render.iconColor` |
| `ui/ActiveBuffRow.ts` | 58 | komentar `render.iconColor` |
| `systems/DebugTools.ts` | 85, 193 | `render.itemDepth`, `spawn.minPlayerSpawnDistance` |
| `systems/power-ups/PowerUpItem.ts` | 41, 45, 46, 50, 79, 80, 119, 152 | `render.*` |
| `systems/power-ups/PowerUpSlotManager.ts` | 13, 24 | `item.*` |
| `systems/power-ups/PowerUpSpawnManager.ts` | 88, 134, 135, 146, 147, 343, 415, 416, 430, 493, 523, 531, 532 | `item.*` / `spawn.*` / `render.itemRadius` |

Catatan: `bobot` dan `iconKey` belum punya konsumen di `src/`; tetap dipindahkan apa adanya (bukan dihapus).

## 8. Urutan eksekusi
1. Buat `types/PowerUpType.ts`, hapus enum dari `PowerUpManager.ts`, sesuaikan impor `Game.ts` & `DebugTools.ts`.
2. Buat `config/DebugConfig.ts`.
3. Tulis ulang `config/PowerUpConfig.ts` (4 domain) lalu hapus `PowerUpMovementConfig.ts`.
4. Perbarui konsumen: `PowerUpMovement`, `PowerUpItem`, `PowerUpSpawnManager`, `PowerUpSlotManager`.
5. Perbarui `DebugTools.ts` (semua nilai dari `DebugConfig`) dan `DebugOverlay.ts`.
6. Perbarui `HudRightPanel.ts`, `ActiveBuffRow.ts`, `Game.ts`.
7. Perbarui `docs/struktur-file.md` dan `docs/debug-toggles.md`.

## 9. Verifikasi
- `node "node_modules\typescript\bin\tsc" --noEmit` → exit 0.
- `grep PowerUpMovementConfig` di `src/` → kosong.
- `grep "WorldConfig.debug"` di `src/` → kosong.
- Literal `0x00e5ff` / `0xff4081` hanya muncul di `DebugConfig.ts`.
- Review diff: seluruh angka/key identik dengan sebelum refactor (refactor murni).
- Production build & dev server **belum** dijalankan (menunggu konfirmasi user).

## 10. Risiko
| Risiko | Mitigasi |
| ------ | -------- |
| Ada call-site terlewat | tsc strict menangkap semua akses properti yang salah |
| Nilai berubah tanpa sengaja | diff per angka dibandingkan sebelum edit |
| `config/` mengimpor `systems/` | `PowerUpType` dipindah ke `types/` lebih dulu |
| Key debug berubah | daftar `powerUps` disalin persis urutan Z/X/C/V/B/N |
