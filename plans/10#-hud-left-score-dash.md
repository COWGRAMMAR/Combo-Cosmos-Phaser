# Plan #10 — HUD Kiri (Skor, Combo, Dash) + Refactor HudDataProvider

- **Tanggal:** 2026-11-21
- **Status:** ACC user (refactor disetujui)
- **Scope:** menambah lapisan baca data HUD terpusat, menampilkan skor/combo/multiplier/dash di panel kiri, dan memindahkan panel kanan ke lapisan baca yang sama.

## Tujuan

1. Data `ScoreSystem` dan dash `Player` bisa dibaca HUD tanpa UI menyentuh state internal.
2. Panel kiri menampilkan: SKOR, COMBO (+bar timer), PENGALI, DASH (+bar cooldown).
3. Semua panel HUD memakai satu pintu baca (`HudDataProvider`), mengikuti pola polling panel kanan yang sudah ada (UI tidak menulis state).

## Arsitektur

```
Game (sumber getter)  ->  HudDataProvider (pintu baca, read-only)  ->  HudLeftPanel / HudRightPanel (layar)
```

- **Sumber:** `Game` hanya menambah `getScoreSystem()`. Getter lama (`getPlayer`, `getSlotManager`, `getActiveBuffManager`) tetap.
- **Kontrak:** `IHudGameSource` mendefinisikan 4 getter yang wajib dimiliki `Game`.
- **Pintu:** `HudDataProvider` membungkus `IHudGameSource`, mengembalikan nilai mentah + flag ketersediaan. Tanpa mutasi, tanpa Phaser, tanpa alokasi snapshot per frame.
- **Layar:** panel hanya memformat dan menampilkan. Tidak ada lagi `cast` ke `Phaser.Scene` di dalam panel.

## File

| File | Aksi | Isi |
| --- | --- | --- |
| `src/game/systems/IHudGameSource.ts` | baru | interface 4 getter sumber data HUD |
| `src/game/systems/HudDataProvider.ts` | baru | pintu baca: skor, combo, multiplier, timer, nyawa, dash, slot, buff |
| `src/game/entities/player/Player.ts` | edit | tambah `dashCooldownRemainingMs` + `dashCooldownRatio`; rename field jadi `_dashRemainingMs`/`_dashCooldownRemainingMs` (konvensi getter) |
| `src/game/scenes/Game.ts` | edit | tambah `getScoreSystem()` sejajar 3 getter HUD lain |
| `src/game/ui/HudManager.ts` | edit | buat `HudDataProvider` dari `gameScene`, inject ke kedua panel |
| `src/game/ui/HudLeftPanel.ts` | tulis ulang | render SKOR / COMBO+bar / PENGALI / DASH+bar |
| `src/game/ui/HudRightPanel.ts` | edit | buang polling langsung + `gameScene`; konsumsi provider |
| `src/game/config/HudConfig.ts` | edit | blok `left`: font nilai, gap section, ukuran & warna bar, warna status dash |
| `src/game/config/language/en.json` | edit | key `hud.left.*` baru; `hud.left.panel_title` dihapus |
| `src/game/config/language/id.json` | edit | sama, paritas key dengan `en.json` |
| `docs/struktur-file.md` | edit | status + 2 baris file baru |

## Kontrak API

### `IHudGameSource`

```ts
getScoreSystem(): ScoreSystem | undefined;
getPlayer(): Player | undefined;
getSlotManager(): PowerUpSlotManager | undefined;
getActiveBuffManager(): ActiveBuffManager | undefined;
```

### `HudDataProvider` (semua getter, tanpa method yang mengubah state)

```ts
hasScore: boolean; score: number; combo: number;
multiplierPercent: number;      // 100 = x1
comboTimerRatio: number;        // 0..1

hasPlayer: boolean; lives: number; isDashing: boolean;
dashReady: boolean; dashCooldownRemainingMs: number; dashCooldownRatio: number; // 0..1

hasSlots: boolean;
getSlotType(i): PowerUpBuffType | null;
getSlotCountAt(i): number;
getSlotKeybind(i): string;

getActiveBuffTypes(): PowerUpBuffType[] | undefined;
getBuffRemainingMs(type): number;
getBuffTotalMs(type): number;
isBuffsPaused(): boolean;
```

Semua rasio di-clamp `0..1`. Komponen yang tidak tersedia mengembalikan `0`/`false`/`undefined`, dan UI memakai flag `has*` sebelum menampilkan.

### `Player`

```ts
get dashCooldownRemainingMs(): number; // sisa cooldown
get dashCooldownRatio(): number;       // sisa / PlayerConfig.dash.cooldownMs, clamp 0..1
```

## Tata letak panel kiri (ruang desain 555×1080, padding 24, lebar konten 507)

1. Label `SKOR` (warna label) → nilai skor (font besar, putih).
2. Label `COMBO` → nilai `xN` → bar timer combo (menyusut sesuai `comboTimerRatio`).
3. Label `PENGALI` → nilai `x1.5` (integer 150 → "x1.5").
4. Label `DASH` → teks status `SIAP` (hijau) atau `{detik}s` (merah) → bar cooldown (terisi saat mendekati siap: `1 - dashCooldownRatio`).

Judul placeholder `HUD KIRI` di tengah panel dihapus.

## Aturan implementasi

- Semua ukuran/warna baru masuk `HudConfig.left`; tidak ada magic number di panel.
- Teks yang dilihat pemain memakai key bahasa (`TranslatedText` untuk label/status, `Text` untuk angka).
- JSDoc Bahasa Indonesia di atas class, constructor, method, dan getter baru.
- Tidak mengubah perilaku gameplay selain penambahan getter baca.
- Panel kanan harus tetap tampil identik setelah refactor.

## Verifikasi

1. `node "node_modules\typescript\bin\tsc" --noEmit` exit 0.
2. `npm run lang:check` lulus (key `en` = `id`).
3. LSP diagnostics bersih untuk semua file yang disentuh.
4. Manual (butuh izin run dev server): panel kiri menampilkan skor/combo/pengali/dash yang berubah saat item dipungut, kill (hotkey debug Q/W/E), player kena hit, dan dash dipakai; panel kanan tidak berubah.
5. `docs/struktur-file.md` memuat `IHudGameSource.ts` dan `HudDataProvider.ts`.

## Di luar scope

- Tidak menampilkan wave/high score (butuh sistem wave).
- Tidak mengubah tata letak panel kanan.
- Tidak menyentuh `ScoreDebug`/`DebugOverlay`.
