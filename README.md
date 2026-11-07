# Combo-Cosmos-Phaser

Game bullet hell bergaya 1945 Air Force, dibangun dengan Phaser 4, Vite, dan TypeScript.

## Dokumentasi

| Dokumen | Isi |
|---|---|
| [`docs/build.md`](docs/build.md) | Instalasi, menjalankan dev server, build produksi, typecheck, kebijakan lockfile |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Aturan branch, aturan commit, menulis deskripsi PR |
| [`docs/struktur-file.md`](docs/struktur-file.md) | Struktur folder dan aturan penempatan file |
| [`docs/bullet-system.md`](docs/bullet-system.md) | Kontrak bullet system |

## Struktur Folder

```
Combo-Cosmos-Phaser/
├─ index.html
├─ package.json
├─ tsconfig.json
├─ CONTRIBUTING.md
├─ vite/                 # konfigurasi Vite (dev & prod)
├─ public/assets/        # sprite, audio, tilemap
├─ plans/                # rencana fitur
├─ issues/               # catatan bug (dibuat saat diperlukan)
├─ docs/
│  ├─ build.md           # panduan build dan package manager
│  ├─ bullet-system.md   # kontrak bullet system
│  └─ struktur-file.md   # sumber kebenaran struktur file
└─ src/
   ├─ main.ts            # bootstrap DOM
   └─ game/
      ├─ main.ts         # konfigurasi Phaser
      ├─ config/         # balance, asset key, event, konstanta
      ├─ scenes/         # Boot, Preloader, MainMenu, Game, GameOver
      ├─ entities/       # BaseEntity, Player, Enemy
      ├─ types/          # Team, EntityConfig
      └─ utils/          # helper (texture placeholder, math)
```

Detail struktur dan aturan penempatan file ada di [`docs/struktur-file.md`](docs/struktur-file.md).

## Konvensi Kode

| Elemen | Aturan | Contoh |
|---|---|---|
| Variabel, function, method, property | camelCase | `moveSpeed`, `takeDamage` |
| Class, interface, type, enum | PascalCase | `Player`, `IDamageable` |
| Konstanta objek | PascalCase | `Balance`, `GameEvents` |
| Konstanta primitif | UPPER_SNAKE_CASE | `TEXTURE_SIZE` |
| File class | PascalCase.ts | `Player.ts` |
| File non-class | camelCase.ts | `textures.ts` |
| Folder | lowercase | `entities/player` |
| Nilai string event | kebab-case | `enemy-killed` |

## Dokumentasi Kode

- Class/interface utama, function, method, constructor, dan getter diberi JSDoc singkat `/** ... */` di atas deklarasinya.
- Komentar menjelaskan tujuan atau perilaku, bukan mengulang nama function.
- Gunakan Bahasa Indonesia yang ringkas.
- Callback anonim yang perlu konteks diberi komentar inline `// ...` seperlunya.
- Komentar tidak boleh mengubah logika, nama, import, atau struktur file.

Contoh:

```ts
/** Mengurangi HP, lalu memanggil die() kalau HP habis. */
public takeDamage(amount: number, _source?: unknown): void
```
