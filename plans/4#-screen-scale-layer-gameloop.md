# 4# — Screen, Scale, Layer, dan Game Loop

Status: **ACC user, implementasi berjalan**.
Tanggal: 2026-11-06.

## Tujuan

Menyiapkan fondasi layar 1920x1080 dengan play area portrait 810x1080 di tengah,
skala FIT + auto-center, kamera gameplay terbatas pada play area, waktu game
delta-based dengan cap 60 FPS, pause overlay yang membekukan seluruh state,
serta layer depth bernama dan scene HUD terpisah.

## Keputusan yang Sudah Di-ACC

- Canvas internal 1920x1080 (16:9), menggantikan 1024x768.
- Play area portrait 810x1080 di x=555; panel kiri/kanan masing-masing 555 px.
- Satu sumber kebenaran ukuran layar: `config/ScreenConfig.ts`.
- Skala FIT + `CENTER_BOTH`; letterbox dari CSS; tanpa scrollbar/margin.
- Kamera gameplay viewport ke play area; koordinat dunia gameplay lokal 0..810 x 0..1080.
- Gerak delta-based; delta maksimum setara 30 FPS; FPS target dan batas atas 60.
- Semua durasi memakai sisa waktu berbasis delta, bukan timestamp absolut.
- Pause berupa overlay scene; membekukan posisi, physics, timer, tween, animasi, dan durasi efek.
- Auto-pause saat window/tab kehilangan fokus; fokus kembali tidak auto-resume.
- HUD di scene paralel dengan kamera panel samping; tidak terkena efek kamera gameplay.
- Depth bernama dengan urutan: background, player bullet, enemy, enemy bullet, player, effect, world UI.

## Fase Implementasi

### Fase 1 — Layout & Skala

- Tambah `config/ScreenConfig.ts` dengan width/height, center, playArea, leftPanel, rightPanel, spawn.
- `main.ts` memakai `ScreenConfig` dan `scale: { mode: FIT, autoCenter: CENTER_BOTH }`.
- `style.css` dibuat full-height tanpa margin/scrollbar; letterbox dari background halaman.
- `Game.ts` mengatur viewport kamera, bounds kamera, dan bounds physics world ke play area.
- Scene menu/loader/GameOver memakai `ScreenConfig.center`; offset loader menjadi konstanta lokal bernama.
- Spawn player (405,900) dan dummy enemy (405,180) dalam koordinat lokal.

### Fase 2 — Waktu & Pause

- Tambah `config/TimeConfig.ts` dan `fps: { target, limit, min }` di `main.ts`.
- `Game.update` membatasi delta dengan `TimeConfig.maxDeltaMs`.
- Tambah `systems/PauseManager.ts` dan `scenes/Pause.ts`.
- PauseManager mem-pause Game + Hud, menampilkan overlay Pause, auto-pause pada BLUR/HIDDEN,
  dan hanya resume lewat event `GameEvents.PAUSE_RESUME`.
- Refactor durasi absolut menjadi sisa milidetik berbasis delta di `BaseEntity`, `Player`,
  `PlayerWeapon`, dan `EnemyBulletManager`.
- Pindahkan delay 600/1000 ms ke `WorldConfig.gameOverDelayMs` dan `EnemyConfig.respawnDelayMs`.

### Fase 3 — Layer & HUD

- Tambah `config/DepthConfig.ts`.
- Terapkan depth ke Player, Enemy, PlayerBullet, EnemyBullet, PlayerLaser, Shockwave, dan DebugOverlay.
- Tambah `scenes/Hud.ts` dengan dua kamera panel dan dua container placeholder.
- `Game` meluncurkan Hud, dan shutdown menghentikan Hud/Pause serta PauseManager.
- Tambah `config/HudConfig.ts` dan `config/PauseConfig.ts` untuk warna/ukuran placeholder.
- Placeholder play area dan panel HUD diberi komentar TEMP dan akan dihapus setelah verifikasi.

## File yang Ditambah

- `src/game/config/ScreenConfig.ts`
- `src/game/config/TimeConfig.ts`
- `src/game/config/DepthConfig.ts`
- `src/game/config/HudConfig.ts`
- `src/game/config/PauseConfig.ts`
- `src/game/scenes/Hud.ts`
- `src/game/scenes/Pause.ts`
- `src/game/systems/PauseManager.ts`

## File yang Diubah

- `src/game/main.ts`
- `public/style.css`
- `src/game/config/WorldConfig.ts`
- `src/game/config/EnemyConfig.ts`
- `src/game/config/PlayerConfig.ts`
- `src/game/config/GameEvents.ts`
- `src/game/scenes/Preloader.ts`
- `src/game/scenes/MainMenu.ts`
- `src/game/scenes/GameOver.ts`
- `src/game/scenes/Game.ts`
- `src/game/entities/BaseEntity.ts`
- `src/game/entities/player/Player.ts`
- `src/game/entities/player/PlayerWeapon.ts`
- `src/game/entities/player/PlayerLaser.ts`
- `src/game/entities/effects/Shockwave.ts`
- `src/game/entities/bullet/PlayerBullet.ts`
- `src/game/entities/bullet/EnemyBullet.ts`
- `src/game/entities/enemy/Enemy.ts`
- `src/game/systems/EnemyBulletManager.ts`
- `src/game/ui/DebugOverlay.ts`
- `doc/struktur-file.md`

## Verifikasi

- `node "node_modules\typescript\bin\tsc" --noEmit` harus exit 0.
- Resize jendela: canvas tetap 16:9, center, tanpa scrollbar.
- Pindah tab/window: game pause, overlay tampil; kembali fokus tidak auto-resume.
- Klik overlay: resume; timer/efek melanjutkan sisa durasi.
- FPS tidak melebihi 60 pada monitor 144 Hz.
- HUD tidak ikut shake/flash kamera gameplay (diverifikasi setelah efek kamera ditambahkan).
