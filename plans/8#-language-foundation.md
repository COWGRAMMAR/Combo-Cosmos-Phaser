# Plan 8 — Language Foundation (i18n)

Status: **ACC** (2026-11-20)
Scope: manager bahasa, file JSON terjemahan, helper teks auto-update, script pengecek key, dokumentasi, dan testing awal.
**Di luar scope:** UI pemilih bahasa (settings/menu) — diurus tim lain.

Istilah yang dipakai: **language**, bukan `i18n`/`locale` (alasan: hanya ada kode bahasa `en`/`id`, tanpa varian wilayah dan tanpa format angka/tanggal).

---

## 1. Struktur file

```
src/game/
├── config/
│   └── language/                 <- BARU: satu folder source of truth
│       ├── LanguageConfig.ts     <- supportedLanguages, default, fallback, storageKey
│       ├── en.json               <- flat, key bertitik
│       └── id.json
├── types/
│   └── Language.ts               <- LanguageCode, TranslationParams, TranslationTable
├── systems/
│   └── LanguageManager.ts        <- singleton: t(), setLanguage(), toggleLanguage(), attachEvents()
└── ui/
    └── TranslatedText.ts         <- Text yang menyimpan key + params dan refresh sendiri

scripts/check-language-keys.mjs   <- pembanding key en vs id (npm run lang:check)
docs/language.md                  <- dokumen kontrak untuk tim
```

Kedalaman `src/game/config/language/en.json` = 2 level di bawah `src/game/` (batas 3, aman).
Dependensi: `ui → systems → config → types`. Tidak ada arah balik.

### Pengecualian aturan config
`config/` sebelumnya hanya berisi TS `as const`. Folder `config/language/` menampung `.json` karena:
- isinya data murni (bukan logika),
- dibaca bundler saat build (bukan fetch runtime),
- pengecualian ini dicatat di `docs/struktur-file.md`.

---

## 2. Kontrak API

### `types/Language.ts`
```ts
export type LanguageCode = 'en' | 'id';
export type TranslationParams = Record<string, string | number>;
export type TranslationTable = Record<string, string>;
```

### `config/language/LanguageConfig.ts`
```ts
supportedLanguages: ['en', 'id']   // readonly tuple
defaultLanguage: 'en'
fallbackLanguage: 'en'
storageKey: 'combo-cosmos.language'
```

### `systems/LanguageManager.ts`
| Method | Perilaku |
| --- | --- |
| `getInstance()` | singleton lazy; constructor membaca localStorage sekali |
| `attachEvents(emitter)` | menyimpan `game.events` untuk emit event bahasa |
| `t(key, params?)` | aktif → fallback en → raw key; `{name}` diganti dari params; placeholder tanpa param dibiarkan |
| `getLanguage()` | kode bahasa aktif |
| `setLanguage(code)` | validasi → persist → emit `LANGUAGE_CHANGED`; bahasa sama = no-op, return false |
| `toggleLanguage()` | ganti ke bahasa berikutnya di `supportedLanguages` |

Aturan:
- string kosong dianggap **tidak ada** (jatuh ke fallback).
- akses `localStorage` dibungkus try/catch; storage rusak/blokir → pakai default.
- manager **tidak** mengimpor file debug.

### `ui/TranslatedText.ts`
```ts
new TranslatedText(scene, x, y, 'kunci.teks', { name: 'x' }, style)  // auto scene.add.existing
setKey(key, params?)   // ganti key + params
setParams(params)      // ganti seluruh params
setParam(name, value)  // ubah satu param tanpa ganti key (mis. lives/score)
refresh()              // paksa render ulang dari manager
```
- mendengar `GameEvents.LANGUAGE_CHANGED` di `scene.game.events`,
- melepas listener pada `scene.events.once(SHUTDOWN)` dan pada `destroy()` (idempotent),
- aman dipakai di scene yang di-pause: event tetap diterima karena `game.events` global.

---

## 3. Key awal

| Key | en | id |
| --- | --- | --- |
| `main_menu.screen.title` | Main Menu | Menu Utama |
| `game_over.screen.title` | Game Over | Permainan Berakhir |
| `pause.overlay.title` | PAUSED | DIJEDA |
| `pause.overlay.hint` | Click or press ESC to resume | Klik atau tekan ESC untuk melanjutkan |
| `hud.left.panel_title` | LEFT HUD | HUD KIRI |
| `hud.right.hp_label` | HP | HP |
| `hud.right.hp_value` | `{lives}x` | `{lives}x` |
| `hud.right.slot_label` | SLOT | SLOT |
| `hud.right.buff_label` | ACTIVE BUFFS | BUFF AKTIF |
| `common.example.greeting` | `Hello, {name}!` | `Halo, {name}!` |

Konvensi: `kategori.konteks.elemen`, lowercase, `_` untuk kata majemuk, satu key satu konteks.

---

## 4. Migrasi teks

| File | Sebelum | Sesudah |
| --- | --- | --- |
| `MainMenu.ts:33` | `'Main Menu'` | `TranslatedText` + `main_menu.screen.title` |
| `GameOver.ts:31` | `'Game Over'` | `TranslatedText` + `game_over.screen.title` |
| `Pause.ts:32,46` | `PauseConfig.title.text` / `hint.text` | `TranslatedText` + `pause.overlay.*` |
| `HudLeftPanel.ts:20` | `HudConfig.panel.leftTitle` | `TranslatedText` + `hud.left.panel_title` |
| `HudRightPanel.ts:46,68,82,116` | `'HP'`, `''`, `'SLOT'`, `'BUFF AKTIF'`, `${lives}x` | `TranslatedText` + `hud.right.*`; nilai HP lewat `setParam('lives', ...)` |

Field teks dihapus dari config: `PauseConfig.title.text`, `PauseConfig.hint.text`, `HudConfig.panel.leftTitle`.

**Tidak dimigrasi (dilaporkan):** digit keybind slot (`1`,`2`,`3`), angka stack power-up, seluruh string `DebugOverlay` (dev-only), logo (aset gambar dekoratif).

---

## 5. Debug

- `DebugConfig.keys.toggleLanguage: '8'` (digit 8; bukan F8). F1–F4, R, Z–N sudah terpakai, digit bebas.
- Listener memakai `window.addEventListener('keydown')` di `DebugTools`, **bukan** `JustDown`, karena `Game.update()` berhenti saat pause padahal tes #4 menekan toggle saat pause.
- `abaikan event.repeat`; listener dilepas di `destroy()`.
- `window.__language` dipasang di `DebugTools` dan dihapus saat destroy, untuk tes fallback/raw key dari console.
- `LanguageManager` tidak mengimpor apa pun dari `DebugTools`.

---

## 6. Script & docs

`scripts/check-language-keys.mjs`:
- baca `en.json` + `id.json`,
- laporkan key yang hanya ada di salah satu file,
- exit 1 kalau ada selisih, exit 0 kalau identik,
- npm script: `"lang:check": "node scripts/check-language-keys.mjs"`.

Docs:
- `docs/language.md` (baru): cara pakai `TranslatedText`, konvensi penamaan key, aturan event-vs-restart, larangan hardcode teks player-visible, larangan membakar teks fungsional ke gambar, UI didesain dengan bahasa Indonesia lalu diuji dua bahasa.
- `docs/struktur-file.md`: tambah folder `config/language/`, `scripts/`, file baru.
- `docs/debug-toggles.md`: tambah baris tombol `8`.
- `CONTRIBUTING.md`: pointer ke `docs/language.md`.

---

## 7. Urutan eksekusi

1. `types/Language.ts` + `config/language/*` + `tsconfig` (paralel).
2. `LanguageManager` + `GameEvents.LANGUAGE_CHANGED` + `TranslatedText`.
3. `Boot` (attachEvents) + `DebugConfig`/`DebugTools`/`Game` (toggle 8, `window.__language`).
4. Migrasi teks scene HUD/pause/menu.
5. Script + docs.
6. Verifikasi.

---

## 8. Verifikasi (dijalankan, bukan diasumsikan)

| # | Tes | Bukti yang diharapkan |
| --- | --- | --- |
| 1 | Terjemahan 2 bahasa + placeholder | `t('common.example.greeting',{name:'Rafif'})` → "Hello, Rafif!" / "Halo, Rafif!" |
| 2 | Key hilang di `id` → fallback en; hilang di dua-duanya → raw key | nilai en tampil; `t('tidak.ada')` → `tidak.ada` |
| 3 | Ganti bahasa saat gameplay | teks HUD berubah tanpa restart |
| 4 | Ganti bahasa saat pause | judul + hint pause berubah, HUD ikut (HUD di-pause) |
| 5 | Pindah scene lalu ganti bahasa | console bersih, tidak ada listener nyangkut |
| 6 | Reload / storage rusak | bahasa terakhir pulih; `'xx'` → `en` |
| 7 | `lang:check` | exit 0 saat sinkron; hapus 1 key → exit 1; restore → exit 0 |

Gate tambahan: `node "node_modules\typescript\bin\tsc" --noEmit` exit 0, `npm run build` sukses, preview menerima koneksi.

---

## 9. Risiko

- Import JSON butuh `resolveJsonModule`; kalau tsc protes soal default import, evaluasi `esModuleInterop` (belum diaktifkan sekarang).
- `TranslatedText` memperpanjang `Phaser.GameObjects.Text`; kalau `scene.add.existing` dipanggil dua kali, objek muncul ganda — konstruktor yang menangani, pemanggil tidak boleh `add.existing` lagi.
- Teks `id` lebih panjang ("Klik atau tekan ESC untuk melanjutkan") — cek tidak keluar dari lebar play area 1060px saat tes visual.
