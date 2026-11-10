# Build dan Menjalankan Proyek: Combo-Cosmos-Phaser

- Status: berlaku (Bun sebagai package manager utama)
- Tanggal: 2026-11-11
- Scope: instalasi, menjalankan dev server, build produksi, typecheck, kebijakan lockfile

Dokumen ini menjelaskan cara menjalankan proyek. Struktur file ada di docs/struktur-file.md.

## 1. Package Manager

| Item | Nilai |
|------|-------|
| Package manager utama | Bun (versi 1.4.2 saat dokumen ini ditulis) |
| Lockfile yang di-commit | bun.lock |
| Package manager sebelumnya | npm (package-lock.json dihapus saat migrasi) |
| pnpm / yarn | tidak pernah digunakan |

npm masih bisa menjalankan script, tetapi bun.lock adalah sumber kebenaran versi dependency.

## 2. Prasyarat

- Bun (disarankan): https://bun.sh
- atau Node.js 18+ (disarankan 20+) + npm, kalau tidak ingin memasang Bun
- Git

Vite dan TypeScript dijalankan dari node_modules. Salah satu dari Bun atau Node harus tersedia.

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

- npm install membuat package-lock.json. File ini jangan di-commit. Yang di-commit cuma bun.lock.
- Jangan campur bun install dan npm install di working copy yang sama. Kalau berpindah manager, hapus node_modules dulu, lalu install ulang.
- Jangan menghapus bun.lock untuk reset. File itu mengunci versi dependency.

## 4. Menjalankan Development

```bash
bun run dev
```

atau

```bash
npm run dev
```

Dev server berjalan di http://localhost:8080 (lihat vite/config.dev.mjs).

Untuk mengakses dari perangkat lain di LAN:

```bash
bun run dev:lan
```

atau

```bash
npm run dev:lan
```

Script dev:lan menambahkan --host --strictPort.

## 5. Build Produksi

```bash
bun run build
```

atau

```bash
npm run build
```

Hasil build ada di dist/. Upload seluruh isi dist/ ke static hosting (GitHub Pages, Netlify, Vercel, Nginx, dan sebagainya). Konfigurasi build ada di vite/config.prod.mjs (minify terser, chunk phaser terpisah).

## 6. Typecheck

```bash
bun x tsc --noEmit
```

atau

```bash
npx tsc --noEmit
```

Perintah ini tidak menghasilkan file. Hanya memeriksa tipe.

## 7. Padanan Perintah

| Kebutuhan | Bun | npm |
|-----------|-----|-----|
| Install | bun install | npm install |
| Dev | bun run dev | npm run dev |
| Dev LAN | bun run dev:lan | npm run dev:lan |
| Build | bun run build | npm run build |
| Typecheck | bun x tsc --noEmit | npx tsc --noEmit |

Semua script ada di package.json dan tidak memakai API khusus Bun. Keduanya menjalankan perintah yang sama.

## 8. Kebijakan Lockfile

1. bun.lock wajib di-commit setiap kali dependency berubah.
2. package-lock.json adalah artefak lokal npm dan tidak boleh di-commit.
3. Jangan menyimpan dua lockfile sekaligus di repo.
4. CI sebaiknya memakai Bun: bun install --frozen-lockfile lalu bun run build.

package-lock.json belum masuk .gitignore. Kalau anggota tim memakai npm, tambahkan file itu ke .gitignore agar tidak ikut ter-commit.

## 9. Catatan Bun vs npm

- Script package.json bersifat manager-agnostic. npm run dev tetap jalan. Tidak ada yang dikunci ke Bun.
- Bun memblokir postinstall script kecuali di-allowlist. Repo ini sudah punya allowScripts: { "esbuild@0.25.2": true } di package.json. npm menjalankan semua postinstall secara default.
- Kalau npm run dev gagal setelah bun install, biasanya karena node_modules belum ada atau versi dependency berbeda. Install ulang dengan manager yang sama seperti lockfile yang dipakai.
- Perbedaan hasil bun install vs npm install bisa membuat node_modules tidak konsisten. Pilih satu manager per mesin dan CI.

## 10. Troubleshooting

| Gejala | Penyebab umum | Solusi |
|--------|---------------|--------|
| vite command not found / script gagal | node_modules belum ada | bun install atau npm install |
| Dependency berbeda antar anggota | lockfile dan manager dicampur | Pakai bun.lock, hapus node_modules, install ulang dengan Bun |
| Port 8080 dipakai | dev server lain masih jalan | Hentikan proses lama atau ubah server.port di vite/config.dev.mjs |
| Build gagal karena tipe | error TypeScript | Jalankan bun x tsc --noEmit, perbaiki error |
| package-lock.json muncul | menjalankan npm install | Jangan commit. Tambahkan ke .gitignore bila perlu |
