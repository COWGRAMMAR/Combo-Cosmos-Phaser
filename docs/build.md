# Build & Menjalankan Proyek

> Windows: gunakan PowerShell 5.1+ (7+ disarankan). CMD kurang nyaman untuk perintah build.

---

## 1. First-Time Setup

> Langkah satu kali. Selesaikan sebelum build pertama.

### Alat yang Diperlukan

Proyek ini butuh Bun (disarankan) atau Node.js 18+ dan Git. Di Windows, [scoop](https://scoop.sh/) mempermudah pemasangan.

| Alat | Windows (scoop) | macOS (brew) | Linux (curl/apt) |
| --- | --- | --- | --- |
| **Bun** (disarankan) | `scoop install bun` | `brew install oven-sh/bun/bun` | `curl -fsSL https://bun.sh/install \| bash` |
| **Node.js 18+** (alternatif) | `scoop install nodejs-lts` | `brew install node` | `apt install nodejs npm` |
| **Git** | `scoop install git` | `brew install git` | `apt install git` |

Catatan:

- Bun sudah membawa runtime JavaScript, jadi Node.js tidak wajib kalau memakai Bun.
- `apt install nodejs` di Ubuntu/Debian bisa memberi versi lama. Kalau butuh Node 20+, pakai NodeSource atau `nvm`.
- Kolom Linux memakai nama paket Debian/Ubuntu. Untuk Fedora, Arch, dan openSUSE, cari paket setara di `dnf`, `pacman`, atau `zypper`.
- Proyek tidak punya dependency native khusus OS. Perintah Bun/Node sama di Windows, Linux, dan macOS.

### Pengaturan Pertama

1. Pasang Bun atau Node.js + Git (lihat tabel).
2. Clone repo:

   ```bash
   git clone https://github.com/COWGRAMMAR/Combo-Cosmos-Phaser.git
   cd Combo-Cosmos-Phaser
   ```

3. Install dependency:

   ```bash
   bun install
   # atau
   npm install
   ```

Catatan lockfile:

- `bun.lock` adalah sumber kebenaran versi dependency dan wajib di-commit.
- `npm install` membuat `package-lock.json`. File itu jangan di-commit.
- Jangan mencampur `bun install` dan `npm install` di working copy yang sama. Kalau berpindah manager, hapus `node_modules` dulu.

---

## 2. Building & Running

### 2a. Dev Server

```bash
bun run dev
# atau
npm run dev
```

Dev server berjalan di `http://localhost:8080` (lihat `vite/config.dev.mjs`).

### 2b. Dev Server LAN

```bash
bun run dev:lan
# atau
npm run dev:lan
```

Script ini menambahkan `--host --strictPort` supaya bisa diakses dari perangkat lain di jaringan yang sama.

### 2c. Build Produksi

```bash
bun run build
# atau
npm run build
```

Hasil build ada di `dist/`. Upload seluruh isi `dist/` ke static hosting (GitHub Pages, Netlify, Vercel, Nginx). Konfigurasi build ada di `vite/config.prod.mjs` (minify terser, chunk `phaser` terpisah).

### 2d. Typecheck

```bash
bun x tsc --noEmit
# atau
npx tsc --noEmit
```

Tidak menghasilkan file. Hanya memeriksa tipe.

### 2e. Padanan Perintah

| Kebutuhan | Bun | npm |
| --- | --- | --- |
| Install | `bun install` | `npm install` |
| Dev | `bun run dev` | `npm run dev` |
| Dev LAN | `bun run dev:lan` | `npm run dev:lan` |
| Build | `bun run build` | `npm run build` |
| Typecheck | `bun x tsc --noEmit` | `npx tsc --noEmit` |

Semua script ada di `package.json` dan tidak memakai API khusus Bun, jadi kedua manager menjalankan perintah yang sama.

---

## 3. Maintenance

### 3a. Clean Install

Hapus `node_modules` lalu install ulang.

```bash
# Linux/macOS
rm -rf node_modules

# Windows (PowerShell)
Remove-Item -Recurse -Force node_modules
```

Lalu install ulang:

```bash
bun install
```

### 3b. Build Bersih

Hapus `dist/` lalu build ulang.

```bash
# Linux/macOS
rm -rf dist

# Windows (PowerShell)
Remove-Item -Recurse -Force dist
```

### 3c. Kebijakan Lockfile

1. `bun.lock` wajib di-commit setiap kali dependency berubah.
2. `package-lock.json` adalah artefak lokal npm dan tidak boleh di-commit.
3. Jangan menyimpan dua lockfile sekaligus di repo.
4. CI sebaiknya memakai Bun: `bun install --frozen-lockfile` lalu `bun run build`.

`package-lock.json` belum masuk `.gitignore`. Kalau anggota tim memakai npm, tambahkan file itu ke `.gitignore` agar tidak ikut ter-commit.

---

## 4. Troubleshooting

- **`vite: command not found` atau script gagal**: `node_modules` belum ada. Jalankan `bun install` atau `npm install`.
- **Port 8080 dipakai**: hentikan dev server lain, atau ubah `server.port` di `vite/config.dev.mjs`.
- **Dependency berbeda antar anggota**: pakai `bun.lock`, hapus `node_modules`, install ulang dengan Bun.
- **Build gagal karena tipe**: jalankan `bun x tsc --noEmit`, perbaiki error.
- **`package-lock.json` muncul**: jangan commit; tambahkan ke `.gitignore` bila perlu.
- **`npm run dev` gagal setelah `bun install`**: cek `node_modules`, lalu install ulang dengan manager yang sama seperti lockfile yang dipakai.
- **`bun: command not found` di Windows**: tutup lalu buka PowerShell baru setelah `scoop install bun` agar PATH diperbarui.

> Jika mengalami kendala di Linux/macOS, pastikan Bun atau Node.js dan Git sudah terpasang. Proyek tidak butuh compiler atau library sistem tambahan.
