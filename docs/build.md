# Build & Menjalankan Proyek: Combo-Cosmos-Phaser

- **Status:** berlaku (Bun sebagai package manager utama)
- **Tanggal:** 2026-11-07
- **Scope dokumen:** instalasi, menjalankan dev server, build produksi, typecheck, dan kebijakan lockfile/package manager.

Dokumen ini menjelaskan cara menjalankan proyek. Ringkasan struktur file ada di [`struktur-file.md`](struktur-file.md).

---

## 1. Package Manager

| Item | Nilai |
|---|---|
| Package manager utama | **Bun** (Bun 1.4.2 saat dokumen dibuat) |
| Lockfile yang di-commit | `bun.lock` |
| Package manager sebelumnya | npm (`package-lock.json`, dihapus saat migrasi) |
| pnpm/yarn | tidak pernah dipakai |

`npm` tetap **bisa** dipakai untuk menjalankan script, tetapi `bun.lock` adalah sumber kebenaran versi dependency.

## 2. Prasyarat

- **Bun** (disarankan): https://bun.sh
- atau **Node.js 18+** (disarankan 20+) + npm, kalau tidak ingin memasang Bun.
- Git.

Vite dan TypeScript dijalankan dari `node_modules`, jadi salah satu dari Bun/Node harus tersedia.

## 3. Instalasi

Cara utama:

```bash
bun install
```

Alternatif npm:

```bash
npm install
```

Catatan:

- `npm install` akan membuat `package-lock.json`. File itu **jangan di-commit**; yang di-commit hanya `bun.lock`.
- Jangan mencampur `bun install` dan `npm install` di working copy yang sama. Kalau berpindah manager, hapus `node_modules` dulu, lalu install ulang dengan manager pilihan.
- Jangan menghapus `bun.lock` untuk "reset". File itu yang mengunci versi dependency.

## 4. Menjalankan Development

```bash
bun run dev
# atau
npm run dev
```

Dev server berjalan di `http://localhost:8080` (lihat `vite/config.dev.mjs`).

Untuk mengakses dari perangkat lain di LAN:

```bash
bun run dev:lan
# atau
npm run dev:lan
```

Script `dev:lan` menambahkan `--host --strictPort`.

## 5. Build Produksi

```bash
bun run build
# atau
npm run build
```

Hasil build ada di `dist/`. Upload seluruh isi `dist/` ke static hosting (GitHub Pages, Netlify, Vercel, Nginx, dsb). Konfigurasi build ada di `vite/config.prod.mjs` (minify terser, chunk `phaser` terpisah).

## 6. Typecheck

```bash
bun x tsc --noEmit
# atau
npx tsc --noEmit
```

Tidak menghasilkan file; hanya memeriksa tipe.

## 7. Padanan Perintah

| Kebutuhan | Bun | npm |
|---|---|---|
| Install | `bun install` | `npm install` |
| Dev | `bun run dev` | `npm run dev` |
| Dev LAN | `bun run dev:lan` | `npm run dev:lan` |
| Build | `bun run build` | `npm run build` |
| Typecheck | `bun x tsc --noEmit` | `npx tsc --noEmit` |

Semua script ada di `package.json` dan tidak memakai API khusus Bun, jadi kedua manager menjalankan perintah yang sama.

## 8. Kebijakan Lockfile

1. `bun.lock` wajib di-commit setiap kali dependency berubah.
2. `package-lock.json` adalah artefak lokal npm dan tidak boleh di-commit.
3. Jangan menyimpan dua lockfile sekaligus di repo.
4. CI sebaiknya memakai Bun: `bun install --frozen-lockfile` lalu `bun run build`.

`package-lock.json` belum masuk `.gitignore`. Kalau anggota tim memakai npm, tambahkan file itu ke `.gitignore` agar tidak ikut ter-commit.

## 9. Catatan Bun vs npm

- Script `package.json` bersifat manager-agnostic. `npm run dev` tetap jalan; tidak ada yang "dikunci" ke Bun.
- Bun memblokir postinstall script kecuali di-allowlist. Repo ini sudah punya `allowScripts: { "esbuild@0.25.2": true }` di `package.json`. npm menjalankan semua postinstall secara default.
- Kalau `npm run dev` gagal setelah `bun install`, cek `node_modules` lalu jalankan install ulang dengan manager yang dipakai.
- Bun dan npm membaca lockfile berbeda. `bun install` memakai `bun.lock`; `npm install` mengabaikan `bun.lock`, menyelesaikan versi dari rentang semver di `package.json`, lalu menulis `package-lock.json`. Isi `node_modules` bisa berbeda karena rentang versi bergeser. Pilih satu manager per mesin/CI.

## 10. Troubleshooting

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| `vite: command not found` / script gagal | `node_modules` belum ada | `bun install` atau `npm install` |
| Dependency berbeda antar anggota | lockfile/manager campur | Pakai `bun.lock`, hapus `node_modules`, install ulang dengan Bun |
| Port 8080 dipakai | dev server lain masih jalan | Hentikan proses lama atau ubah `server.port` di `vite/config.dev.mjs` |
| Build gagal karena tipe | error TypeScript | Jalankan `bun x tsc --noEmit`, perbaiki error |
| `package-lock.json` muncul | menjalankan `npm install` | Jangan commit; tambahkan ke `.gitignore` bila perlu |
