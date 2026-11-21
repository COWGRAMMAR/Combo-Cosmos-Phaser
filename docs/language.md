# Kontrak Bahasa (en / id)

Dokumen ini aturan main untuk semua orang yang menambah teks yang dilihat pemain.
Kalau kamu menulis teks di layar tanpa lewat dokumen ini, berarti ada yang salah.

---

## 1. Di mana datanya

| Hal | Lokasi |
| --- | --- |
| Pengaturan bahasa | `src/game/config/language/LanguageConfig.ts` |
| Teks Inggris | `src/game/config/language/en.json` |
| Teks Indonesia | `src/game/config/language/id.json` |
| Logika terjemahan | `src/game/systems/LanguageManager.ts` |
| Teks auto-update | `src/game/ui/TranslatedText.ts` |
| Pengecek key | `scripts/check-language-keys.mjs` (`npm run lang:check`) |

English adalah bahasa **default** sekaligus **fallback**. Tidak ada bahasa lain, dan tidak ada `locale` (varian wilayah) — kalau nanti butuh format tanggal/angka per wilayah, baru rename ke `locale`.

Kedua file JSON **wajib punya key yang sama persis**. Itu tugas `npm run lang:check`.

---

## 2. Cara memakai teks terjemahan

### Teks statis

```ts
new TranslatedText(this, x, y, 'pause.overlay.title', undefined, {
    fontFamily: 'Arial Black',
    fontSize: 72,
    color: '#ffffff'
}).setOrigin(0.5);
```

`TranslatedText` sudah memanggil `scene.add.existing(this)`, jadi **jangan** tambahkan sendiri lewat `this.add.existing(...)` — teksnya akan muncul dua kali.

### Teks dengan nilai berubah (skor, nyawa, nama)

Jangan menyimpan hasil string. Simpan key + params:

```ts
this.scoreText = new TranslatedText(this, x, y, 'hud.left.score_value', { score: 0 });

// tiap frame / saat skor berubah
this.scoreText.setParam('score', player.score);
```

`setParam` mengabaikan nilai yang sama, jadi aman dipanggil tiap frame tanpa render ulang.

| Method | Kapan dipakai |
| --- | --- |
| `setParam(nama, nilai)` | satu nilai berubah (skor, nyawa, jumlah musuh) |
| `setParams({...})` | semua params diganti sekaligus |
| `setKey(key, params?)` | teks yang sama pindah konteks (jarang) |
| `refresh()` | paksa render ulang dari manager |

### Tanpa objek Text (logika, bukan UI)

```ts
LanguageManager.getInstance().t('common.example.greeting', { name: 'Rafif' });
```

Rantai fallback: **bahasa aktif → English → raw key**. Raw key sengaja jelek (`pause.overlay.title` tampil apa adanya) supaya kelihatan saat ada yang lupa menerjemahkan. Teks tidak pernah kosong dan tidak pernah crash.

Placeholder tanpa nilai dibiarkan apa adanya (`{name}` tetap `{name}`), tidak jadi string kosong.

---

## 3. Konvensi penamaan key

Format: `kategori.konteks.elemen`

| Aturan | Contoh benar | Contoh salah |
| --- | --- | --- |
| Huruf kecil semua | `hud.right.hp_label` | `HUD.Right.hpLabel` |
| Titik memisah level | `pause.overlay.title` | `pause_overlay_title` |
| Underscore untuk kata majemuk dalam satu level | `hp_label`, `panel_title` | `hpLabel`, `panel.title` |
| Kategori pertama = scene/fitur pemilik | `main_menu.screen.title` | `title_1` |
| Nama berdasarkan fungsi/lokasi, bukan isi teks | `pause.overlay.hint` | `klik_atau_esc` |
| Satu key satu konteks | `hud.right.buff_label` | pakai ulang `common.buff` di 3 tempat |
| Teks sama tetap beda key kalau konteksnya beda | `hud.right.slot_label` | satu key `SLOT` untuk semua |

Kenapa tidak boleh reuse: teks yang sama hari ini bisa berbeda besok ("Close" di dialog vs "Close" di tombol menu bisa jadi "Tutup" vs "Keluar"). Key yang dipakai bersama memaksa dua konteks berubah bersamaan selamanya.

---

## 4. Event vs restart scene

| Jenis scene | Contoh | Perilaku saat bahasa diganti |
| --- | --- | --- |
| **Ber-state** (punya progres yang tidak boleh hilang) | `Game`, `Hud`, `Pause` | **Wajib** pakai `TranslatedText` / event `LANGUAGE_CHANGED`. Jangan restart. |
| **Tanpa state** | `MainMenu`, layar settings dari menu | Boleh `scene.restart()` saat bahasa berubah kalau lebih sederhana |

Alasannya: restart `Game` di tengah run menghapus nyawa, skor, dan posisi musuh. Overlay `Pause` juga tidak boleh hilang hanya karena bahasa berganti.

Event `GameEvents.LANGUAGE_CHANGED` dipancarkan di `game.events` (bukan `scene.events`), jadi tetap diterima walau scene sedang di-pause — teks di HUD dan overlay pause ikut berubah tanpa resume.

Aturan kebersihan: setiap listener bahasa **wajib** dilepas saat scene shutdown/destroy. `TranslatedText` sudah menangani ini; kalau menulis listener sendiri, lepas di `shutdown`.

---

## 5. Larangan

1. **Jangan hardcode teks yang dilihat pemain.** `add.text(..., 'Main Menu', ...)` dilarang. Pakai `TranslatedText`.
2. **Jangan membakar teks fungsional ke gambar.** Tombol, label fitur, dan teks tombol harus berupa text object di atas frame/bentuk kosong. Alasannya: gambar tidak bisa diterjemahkan dan tidak bisa diubah tanpa desainer.
   - Boleh: teks **dekoratif** yang memang bagian dari identitas visual (logo game).
   - Tidak boleh: "PLAY", "SETTINGS", "RESUME" di dalam file PNG.
3. **Jangan menyimpan string hasil terjemahan** lalu menimpa dengan string lain. Simpan key + params.
4. **Jangan menambah key hanya di satu file JSON.** Jalankan `npm run lang:check` sebelum commit.
5. **Jangan menaruh teks di `config/`.** Teks hidup di `config/language/*.json`; config lain hanya menyimpan gaya/ukuran/posisi.

Pengecualian yang disadari: angka mentah (jumlah stack power-up, digit keybind `1`/`2`/`3`) dan teks overlay debug (hanya untuk developer) tidak perlu diterjemahkan.

---

## 6. Desain UI: Indonesia dulu

Rancang dan uji tata letak memakai **bahasa Indonesia** karena teksnya paling panjang ("Klik atau tekan ESC untuk melanjutkan" vs "Click or press ESC to resume"). Kalau versi Indonesia muat, versi Inggris hampir pasti muat.

Checklist singkat sebelum menyerahkan UI:

1. Teks Indonesia tidak keluar dari panel / play area.
2. Ganti ke Inggris (`8` saat gameplay, atau `__language.setLanguage('en')`), cek tidak ada teks terpotong.
3. Ganti lagi ke Indonesia, pastikan posisi tidak bergeser aneh.
4. Tidak ada teks yang masih hardcode.

---

## 7. Menambah key atau bahasa baru

### Menambah key

1. Tambah key yang sama di `en.json` **dan** `id.json`.
2. Pakai di kode lewat `TranslatedText` atau `LanguageManager.t()`.
3. `npm run lang:check` → harus `OK`.

### Menambah bahasa

1. Tambah kode ke `LanguageCode` (`src/game/types/Language.ts`).
2. Tambah file `<kode>.json` dengan key identik.
3. Daftarkan di `LanguageConfig.supportedLanguages` dan tabel di `LanguageManager`.
4. `npm run lang:check`.

---

## 8. Debug

| Alat | Fungsi |
| --- | --- |
| Tombol `8` | Ganti bahasa `en` ⇄ `id`; aktif juga saat pause |
| `window.__language` | Hook console saat `DebugTools` hidup |
| `npm run lang:check` | Bandingkan key antar file bahasa |

`LanguageManager` tidak mengimpor apa pun dari `DebugTools`. Ketergantungan hanya satu arah: debug → manager.
