# Combo-Cosmos-Phaser

Game bullet hell bergaya 1945 Air Force, dibangun dengan Phaser 4, Vite, dan TypeScript.

## Build

Baca [docs/build.md](docs/build.md) untuk instalasi, menjalankan dev server, build produksi, dan typecheck.

## Contributing

Baca [CONTRIBUTING.md](CONTRIBUTING.md) untuk aturan branch, commit, dan deskripsi PR.

## Struktur

Baca [docs/](docs/) untuk detail struktur file dan logika.

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
