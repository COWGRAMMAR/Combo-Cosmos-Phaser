# Rencana: UI HUD Slot Power-Up — Panel Kiri + Kanan dengan HudManager

## Tujuan

Menambah UI HUD pada panel kanan (dan wadah panel kiri untuk ekspansi selanjutnya) yang menampilkan:
1. Indikator HP (di atas inventory): lingkaran placeholder + angka nyawa, format `(ikon) 3x`.
2. 3 kotak slot buff: ikon item buff, jumlah stack, label keybind (1/2/3).
3. Daftar durasi buff aktif (di bawah kotak slot): satu baris per buff berdurasi, ikon kiri + progress bar sisa/total.

UI hanya menampilkan (display-only). Semua data diambil dari layer logic via polling. Tidak ada logika ganda di UI.

## File baru

| File                          | Tanggung jawab                                                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/game/ui/HudManager.ts`     | Manajer utama HUD. Membuat `HudLeftPanel` + `HudRightPanel`, memasang ke container di `Hud.ts`, dan memanggil `update()` tiap panel setiap frame. |
| `src/game/ui/HudLeftPanel.ts`   | Panel kiri (wadah container). Saat ini kosong/placeholder, siap ditambah komponen lain nanti.                                                           |
| `src/game/ui/HudRightPanel.ts`  | Panel kanan. Berisi indikator HP (di atas), 3 kotak slot buff, dan daftar durasi buff aktif (di bawah).                                                 |
| `src/game/ui/PowerUpSlotBox.ts` | Komponen satu kotak slot: lingkaran ikon, teks stack, label keybind. Tangani kosong/penuh.                                                              |
| `src/game/ui/ActiveBuffRow.ts`  | Komponen satu baris durasi buff aktif: lingkaran ikon + progress bar sisa/total. Warna dari `PowerUpConfig.iconColor`.                                    |

## File diubah

| File                             | Perubahan                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/game/config/HudSizeConfig.ts` | **BARU** — semua ukuran/layout HUD (single source of truth, tidak ada magic number di UI).                                                   |
| `src/game/config/AssetKeys.ts`     | Tambah key logis ikon power-up: `PowerUpIconAtkSpeed`, `PowerUpIconShield`, `PowerUpIconLane`, `PowerUpIconLaser`, `PowerUpIconNuke`, `PowerUpIconLife` |
| `src/game/config/AssetManifest.ts` | Tambah entri `placeholders` (source: `'generated'`, `frameCount: 1`) untuk 6 key ikon di atas                                                     |
| `src/game/config/PowerUpConfig.ts` | Tambah `iconColor` per jenis buff (single source of truth warna placeholder).                                                               |
| `src/game/systems/AssetManager.ts` | Tambah `PLACEHOLDER_RECIPES` untuk 6 key ikon: lingkaran berwarna sesuai `iconColor`, ukuran `TEXTURE_SIZE` (48×48)                               |
| `src/game/systems/power-ups/ActiveBuffManager.ts` | `activate()` hapus entry lama sebelum `set()` baru, sehingga buff yang di-refresh pindah ke akhir Map (urutan terbaru di atas HUD). |
| `src/game/scenes/Game.ts`          | Tambah getter public read-only: `getSlotManager()`, `getActiveBuffManager()`, `getPlayer()`.                                                  |
| `src/game/scenes/Hud.ts`           | Instan `HudManager`, masukkan panel ke `leftContainer`/`rightContainer`, tambah `update(time, delta)` yang mendelegasikan ke `HudManager`.             |
| `doc/struktur-file.md`             | Tambah entri folder `src/game/ui/` dan semua file baru (wajib per AGENTS.md aturan 6).                                                         |

## Kontrak data logic → UI

**Pola: Polling** (bukan event). Progress bar harus berkurang halus tiap frame; event hanya untuk perubahan diskret.

Getter baru di `Game.ts` (read-only only):

| Data              | Sumber             | Method                 |
| ----------------- | ------------------ | ---------------------- |
| `slotManager`       | `PowerUpSlotManager` | `getSlotManager()`       |
| `activeBuffManager` | `ActiveBuffManager`  | `getActiveBuffManager()` |
| `player`            | `Player`             | `getPlayer()`            |

Data yang dibaca UI:

| Data                 | Method             | Digunakan untuk                 |
| -------------------- | ------------------ | ------------------------------- |
| `getSlotType(i)`       | `PowerUpSlotManager` | Tampilkan ikon atau kosong      |
| `getSlotCountAt(i)`    | `PowerUpSlotManager` | Teks jumlah stack               |
| `getMaxStackAt(i)`     | `PowerUpSlotManager` | Batas stack / indikator penuh   |
| `getKeybind(i)`        | `PowerUpSlotManager` | Label `'1'` / `'2'` / `'3'`           |
| `getSlotCount()`       | `PowerUpSlotManager` | Jumlah kotak (dari config = 3)  |
| `getActiveBuffTypes()` | `ActiveBuffManager`  | Baris progress bar              |
| `getTotalMs(type)`     | `ActiveBuffManager`  | Panjang progress bar penuh      |
| `getRemainingMs(type)` | `ActiveBuffManager`  | Panjang progress bar sisa       |
| `isPaused()`           | `ActiveBuffManager`  | Bekukan progress bar saat pause |
| `player.lives`         | `Player`             | Indikator HP `(ikon) 3x`          |

## Edge case

| Edge case                         | Penanganan                                                                                            |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Slot kosong                       | Kotak outline saja, tanpa ikon. Keybind ditampilkan. Stack kosong.                                    |
| Slot penuh stack                  | Ikon + stack ditampilkan; visual menunjukkan penuh.                                                   |
| Buff di-refresh                   | Entry dipindah ke akhir Map → baris pindah ke paling atas.                                            |
| Shield pecah sebelum durasi habis | `deactivate(Shield)` → entry dihapus → baris hilang, baris di bawah naik.                             |
| Beberapa buff berakhir bersamaan  | Semua entry dengan `remainingMs <= 0` di-deactivate dalam satu `update()` → semua baris hilang sekaligus. |
| Slot dengan stack > 1             | Teks stack ditampilkan (mis. `2x`), ikon satu lingkaran.                                                |
| Game pause                        | `Hud.update()` tidak berjalan → progress bar beku. `isPaused()` true, konsisten.                        |

## Asumsi

- `Hud.ts` akses ke `Game` scene via `this.scene.get('Game')`.
- Semua ukuran/layout diambil dari `HudSizeConfig`, `ScreenConfig`, `HudConfig`, `PowerUpConfig` (tidak ada magic number di UI).
- Progress bar berbentuk `Phaser.GameObjects.Rectangle`.
- Ukuran ikon placeholder = `TEXTURE_SIZE` (48) dari `AssetManager.ts`.
- Tampilan-only; aktivasi slot tetap lewat keyboard di `Game.ts`.
