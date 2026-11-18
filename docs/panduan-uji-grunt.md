# Panduan Uji Grunt (Tipe 1)

- **Status:** terverifikasi 2026-11-18 terhadap kode `dev` (`f26f814`)
- **Untuk siapa:** yang mau memastikan Grunt berjalan benar tanpa menunggu WaveManager
- **Sifat:** verifikasi manual di browser; repo ini tidak punya test runner otomatis

Dokumen ini menjawab satu pertanyaan: **bagaimana memunculkan Grunt, apa yang harus terlihat, dan ke mana harus melihat kalau hasilnya salah.**
Kontrak sistem peluru & aturan performa ada di `docs/bullet-system.md`; daftar tombol ada di `docs/debug-toggles.md`.

---

## 1. Apa yang diuji

| Kelompok | Yang dipastikan |
|---|---|
| Spawn & gerak | Grunt lahir di atas play area, bergerak lurus, dibuang setelah lewat bawah |
| Tembakan | Jeda tembak, arah (`targeted` vs `down`), offset muzzle, kecepatan peluru |
| Damage | HP 30, flash merah, mati → ledakan |
| Tabrakan badan | Grunt hancur + meledak, nyawa berkurang paling banyak 1 per frame |
| Pola | `single`, `wall`, `stream`, `rain` (jumlah, jeda, override X) |
| Pool | 96 Grunt, overflow tercatat, tidak ada crash |
| Reset & pause | `R`, `ESC`, tidak ada sisa visual |

Yang **tidak** diuji di sini: wave/difficulty, score/combo, audio, enemy Tipe 2, balancing akhir.

---

## 2. Menjalankan

```bash
bun install
bun run dev      # http://localhost:8080
```

Masuk dari MainMenu; scene `Game` langsung menjalankan skenario tes yang dipilih.
Untuk membuka dari perangkat lain di jaringan: `bun run dev:lan`.

Catatan ruang: play area adalah 1060×1080 pada **koordinat lokal**, kamera menyesuaikan
ukuran window. Semua posisi di config memakai koordinat lokal, bukan piksel layar.

---

## 3. Memilih skenario

Skenario diatur di `src/game/config/EnemyTestConfig.ts`:

```ts
enabled: true,
scenario: 'rain',
resetKey: 'R',
resetKeyEnabled: true
```

| `scenario` | Yang muncul | Selesai kapan |
|---|---|---|
| `single` | 1 Grunt di `GruntConfig.single.spawnX` | langsung setelah spawn |
| `wall` | 1 baris `wall.count` Grunt | langsung setelah baris lahir |
| `stream` | 1 kolom `stream.count` Grunt, satu per satu | setelah unit terakhir lahir |
| `rain` | `rain.count` pola `rain.type` berulang | setelah pola terakhir selesai |

- Grunt **tidak** spawn ulang setelah skenario selesai; tekan `R` untuk mengulang.
- `R` menjalankan `enemyBullets.clearAll()` lalu `GruntTestRunner.restart()`: Grunt aktif
  dibuang, overflow di-reset, pola mulai dari awal. Nyawa, power-up, dan posisi pemain
  **tidak** ikut di-reset — reload halaman untuk run yang benar-benar bersih.
- `enabled: false` mematikan spawn tes sekaligus tombol `R`. `resetKeyEnabled: false`
  hanya mematikan tombolnya.
- Perubahan config butuh reload halaman (Vite melakukan full reload karena config `as const`).

---

## 4. Angka yang menentukan hasil uji

Semua ada di `src/game/config/` dan bisa diubah tanpa menyentuh logika.

| Field | Nilai sekarang | Efek yang terlihat |
|---|---|---|
| `GruntConfig.maxHp` | 30 | butuh 3 tembakan biasa (`bulletDamage` 10) |
| `GruntConfig.poolSize` | 96 | batas Grunt aktif; lebih dari ini = overflow |
| `GruntConfig.spawnMargin` | 48 | Grunt lahir di `y = -48` (di luar layar) |
| `GruntConfig.despawnY` | 1128 | dibuang setelah 48 px di bawah play area |
| `GruntConfig.weapon.aimMode` | `targeted` | peluru menuju posisi pemain saat ditembakkan (bukan homing) |
| `GruntConfig.weapon.initialFireDelayMs` | 700 | jeda tembakan pertama setelah masuk play area |
| `GruntConfig.weapon.fireIntervalMs` | 1000 | jarak antar tembakan |
| `GruntConfig.weapon.bulletSpeed` | 250 | kecepatan peluru |
| `GruntConfig.weapon.muzzleOffsetY` | 18 | jarak titik lahir peluru dari pusat Grunt |
| `GruntConfig.single.*` | X 530, 140 px/s | satu Grunt lurus ke bawah |
| `GruntConfig.wall.*` | 3 unit, jarak 84, 120 px/s | baris selebar 168 px |
| `GruntConfig.stream.*` | 10 unit, jarak 72, delay 200 ms, 150 px/s | kolom di atas layar |
| `GruntConfig.rain.*` | tipe `wall`, 10 pola, jeda 1000 ms, jitter 0 | 10 baris beruntun |
| `EnemyConfig.hitFlash.durationMs` | 90 | lama siluet merah |
| `EnemyConfig.explosion.durationMs` | 250 | lama ledakan |
| `EnemyConfig.explosion.poolSize` | 32 | ledakan bersamaan; lebih dari ini dilewati |

Posisi X semua pola diturunkan dari `ScreenConfig.playArea.centerX` (530).
`rain.spawnX` **menggantikan** X milik pola saat mode rain; untuk membuktikannya geser
mis. ke `ScreenConfig.playArea.centerX - 120`.

Catatan `stream`: unit berikutnya lahir di atas unit sebelumnya (`spacing` 72 px), lalu
semua bergerak dengan kecepatan sama. Jadi jarak visual saat masuk layar adalah
`spacing + moveSpeed × streamDelayMs` (72 + 30 = 102 px), bukan 72 px.

---

## 5. Checklist manual

Centang yang sudah benar. Kalau ada satu yang gagal, lihat bagian 7.

### 5.1 Spawn & gerak

- [ ] Grunt muncul dari atas layar (`y = -48`), bukan meletus di tengah play area.
- [ ] Selama masih di atas play area (`y < 0`), Grunt **belum** menembak.
- [ ] Gerak lurus sesuai `moveAngleDeg` (0 = lurus ke bawah), tanpa goyangan.
- [ ] Grunt yang lolos ke bawah hilang di `y > 1128` **tanpa** ledakan dan tanpa mengurangi nyawa.
- [ ] Setelah skenario selesai, tidak ada spawn baru sampai `R` ditekan.

### 5.2 Tembakan

- [ ] Tembakan pertama ~700 ms setelah Grunt masuk play area, berikutnya tiap ~1000 ms.
- [ ] `aimMode: 'targeted'`: peluru mengarah ke posisi pemain **saat ditembakkan**; kalau
      pemain bergerak setelahnya, peluru tidak membelok.
- [ ] `aimMode: 'down'`: peluru mengikuti sudut gerak Grunt.
- [ ] Peluru lahir 18 px dari pusat Grunt ke arah tembak, bukan menempel di tengah.
- [ ] Grunt yang tidak aktif (sudah di pool) tidak menembak.

### 5.3 Damage & umpan balik

- [ ] Tembakan pertama & kedua: siluet Grunt jadi **merah** ±90 ms lalu kembali kuning.
- [ ] Tembakan ketiga: Grunt hilang dan **ledakan merah** membesar lalu memudar ±250 ms.
- [ ] Ledakan muncul di posisi Grunt mati dan tidak menggeser Grunt lain.
- [ ] Laser (`V` lalu slot `1`–`3`): Grunt mati satu tick (damage 50), jadi hanya ledakan
      yang terlihat, tanpa flash.
- [ ] Bom (`B` lalu slot): semua Grunt aktif meledak. Kalau lebih dari 32 sekaligus,
      sebagian ledakan tidak muncul, tetapi tidak ada error.

### 5.4 Tabrakan badan

- [ ] Grunt yang menyentuh pemain hancur **dan** meledak.
- [ ] Nyawa berkurang 1, bukan 1 per Grunt: menabrak 3 Grunt dalam frame yang sama tetap −1.
- [ ] Saat shield aktif (`C` lalu slot): shield pecah, nyawa **tidak** berkurang, Grunt tetap meledak.
- [ ] Saat dash (`SHIFT`) atau i-frame: Grunt tetap hancur & meledak, nyawa aman.

### 5.5 Pola

- [ ] `single`: satu Grunt di tengah play area.
- [ ] `wall`: `wall.count` Grunt sebaris, simetris terhadap `centerX`.
- [ ] `stream`: `stream.count` Grunt satu kolom, lahir tiap `streamDelayMs`.
- [ ] `rain`: `rain.count` pola; pola baru mulai hanya setelah pola sebelumnya `finished`
      ditambah `intervalMs` (± `jitterMs`).
- [ ] `rain.type` bisa diganti ke `single`/`stream`/`wall` tanpa mengubah kode.
- [ ] `rain.spawnX` menggeser **seluruh** pola, termasuk `wall` yang punya `centerX` sendiri.

### 5.6 Pool, stress, reset

- [ ] Overlay `F1` menampilkan `grunt: N aktif / overflow M | skenario X`.
- [ ] `F2`/`F3` (100/3000 peluru musuh) tidak menghentikan Grunt; frame time tetap wajar.
- [ ] `R` saat banyak Grunt: semua hilang, peluru musuh bersih, pola mulai dari awal.
- [ ] `ESC` pause lalu resume: tidak ada ledakan/flash yang "melompat", timer tidak jalan saat pause.
- [ ] Setelah `R` berkali-kali: tidak ada Grunt "hantu" (aktif tapi tak terlihat) dan tidak ada warna sisa.

---

## 6. Membaca overlay (F1)

Baris yang relevan: `grunt`, `enemy bullets`, `player bullets`, dan FPS/frame time.

Kalau `overflow` naik, berarti `GruntPool.spawn()` gagal karena `poolSize` habis. Itu bukan
bug, tetapi tanda pola terlalu rapat atau pool terlalu kecil untuk skenario tersebut.

---

## 7. Kalau ada yang gagal

| Gejala | Cek dulu |
|---|---|
| Tidak ada Grunt sama sekali | `EnemyTestConfig.enabled`, nilai `scenario`, error console saat `Game.create()` |
| Grunt diam di atas layar | `moveSpeed`/`moveAngleDeg` di blok pola, dan `Grunt.spawn()` menerima pattern |
| Grunt tidak menembak | `y < 0` (belum masuk play area), `initialFireDelayMs`, atau `target.active` false saat `targeted` |
| Peluru pemain menembus Grunt | overlap di `Game.create()`, `bodyRadius`, `body.enable` Grunt |
| Flash tidak terlihat | `hitFlash.durationMs`; pastikan renderer WebGL (tint FILL butuh WebGL) |
| Ledakan tidak muncul | langganan `GameEvents.ENEMY_KILLED` di `Game.create()`, lalu `explosions.spawn()` |
| Ledakan muncul saat Grunt lolos ke bawah | jalur despawn harus `die()`, bukan `kill()` |
| Sisa merah setelah Grunt dipakai ulang | `Enemy.clearHitFlash()` di `resetForPool()` dan di akhir timer |
| `R` tidak bereaksi | `resetKeyEnabled`, `resetKey`, atau fokus window (browser menahan key) |
| Nyawa berkurang lebih dari 1 | `lastEnemyContactFrame` di `handlePlayerTouchesEnemy` |
| Frame drop saat rain | `rain.count`/`intervalMs` terlalu rapat, atau `poolSize` terlalu besar untuk uji |

---

## 8. Tuning cepat

| Ingin ... | Ubah |
|---|---|
| Grunt lebih tahan | `GruntConfig.maxHp` |
| Tembakan lebih rapat | `GruntConfig.weapon.fireIntervalMs` |
| Peluru lebih cepat/lambat | `GruntConfig.weapon.bulletSpeed` |
| Grunt bergerak lebih cepat | `moveSpeed` di blok pola yang dipakai |
| Baris lebih lebar | `GruntConfig.wall.count` / `spacing` |
| Rain lebih ramai | `GruntConfig.rain.count` / `intervalMs` |
| Ledakan lebih lama/besar | `EnemyConfig.explosion.durationMs` / `scaleTo` |
| Flash lebih terasa | `EnemyConfig.hitFlash.durationMs` |
| Uji Grunt di posisi lain | `rain.spawnX`, `single.spawnX`, `wall.centerX`, `stream.spawnX` |

Semua perubahan itu hanya config; tidak perlu menyentuh `scenes/`, `entities/`, atau `systems/`.

---

## 9. Batas yang perlu diingat

- Tidak ada test otomatis: bukti "lulus" = `bun x tsc --noEmit` + `bun run build` + checklist di atas.
- `Game.resetRun()` saat ini tidak dipanggil dari mana pun; `R` hanya mengulang skenario,
  bukan memulai run penuh.
- `DummyEnemy` masih ada di repo tetapi **tidak** di-wire ke `Game`; jangan pakai sebagai
  acuan perilaku Grunt.
- `Grunt` belum punya varian serangan selain satu peluru lurus/targeted; Tipe 2 dan Boss
  belum ada.
