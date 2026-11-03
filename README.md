# Combo-Cosmos-Phaser

Game bullet hell bergaya 1945 Air Force, dibangun dengan Phaser 4, Vite, dan TypeScript.

## Kebutuhan

- Node.js 18+ (disarankan 20+)
- npm

## Instalasi

```bash
npm install
```

## Menjalankan Development

```bash
npm run dev
```

Dev server berjalan di `http://localhost:8080`.

## Build Produksi

```bash
npm run build
```

Hasil build ada di folder `dist/`. Upload seluruh isi folder tersebut ke web server statis untuk deploy.

## Struktur Folder

```
Combo-Cosmos-Phaser/
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite/                 # konfigurasi Vite (dev & prod)
├─ public/assets/        # sprite, audio, tilemap
├─ plans/                # rencana fitur
├─ issues/               # catatan bug (dibuat saat diperlukan)
├─ doc/
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

Detail struktur dan aturan penempatan file ada di [`doc/struktur-file.md`](doc/struktur-file.md).

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

## Aturan Branch

1. Jangan pernah edit di branch `main`.
2. Nama branch disesuaikan dengan kebutuhan.
3. Branch yang sudah tidak terpakai langsung dihapus.
4. Sebelum membuat PR, pastikan nilai variabel sudah final.
5. Pastikan tidak ada file atau folder lokal yang ikut masuk PR.
6. Tulis deskripsi PR dengan jelas dan tidak ambigu. Jika bingung, minta AI membuatkan draft-nya.

## Aturan Commit

1. Judul dan deskripsi commit harus jelas dan tidak ambigu.
2. Issue atau plan yang sudah selesai dikerjakan wajib dihapus sebelum commit. Jika masih ada, artinya pekerjaan tersebut belum dianggap selesai.

Contoh format judul: `feat: tambah pooling projectile` atau `fix: perbaiki hitbox player`.

## Menulis Deskripsi PR

Sertakan minimal:

- Ringkasan perubahan.
- Alasan perubahan.
- Cara menguji.
- Risiko atau hal yang perlu diperhatikan.

Jangan gunakan deskripsi yang ambigu atau hanya berisi "update files".
