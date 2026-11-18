# Debug Toggles — Daftar Tombol Debug

Status: terverifikasi 2026-11-10 terhadap `src/game/systems/DebugTools.ts`.
Dokumen ini menjawab satu pertanyaan: **tombol apa saja yang bisa dipakai saat game berjalan, dan apa efeknya.**

---

## 1. Ringkasan tombol

| Tombol | Aksi di `DebugActions` | Efek instan | Butuh aksi lanjutan? |
| ------ | ---------------------- | ----------- | -------------------- |
| `F1`   | `toggleOverlay`        | Tampilkan / sembunyikan overlay statistik | Tidak |
| `F2`   | `stress(100)`          | Hujan 100 peluru musuh dari atas layar | Tidak |
| `F3`   | `stress(3000)`         | Hujan 3000 peluru musuh dari atas layar | Tidak |
| `F4`   | `cycleLanes`           | Putar jumlah jalur tembak pemain 1 → 5 → 1 | Tidak |
| `Z`    | `powerUp(Lane)`        | Tambah 1 jalur tembak permanen (run ini) | Tidak |
| `X`    | `powerUp(AtkSpeed)`    | Masukkan AtkSpeed ke slot inventory | Ya — tekan `1`/`2`/`3` |
| `C`    | `powerUp(Shield)`      | Masukkan Shield ke slot inventory | Ya — tekan `1`/`2`/`3` |
| `V`    | `powerUp(Laser)`       | Masukkan Laser ke slot inventory | Ya — tekan `1`/`2`/`3` |
| `B`    | `powerUp(Bomb)`        | Masukkan Nuke/Bomb ke slot inventory | Ya — tekan `1`/`2`/`3` |
| `N`    | `powerUp(Life)`        | Tambah 1 nyawa langsung | Tidak |

Tombol debug **selalu aktif** selama scene `Game` berjalan. Tidak ada flag on/off untuk `DebugTools` itu sendiri.

---

## 2. Detail per tombol

### F1 — Toggle overlay statistik

Memanggil `DebugOverlay.toggle()`: teks overlay disembunyikan/ditampilkan. Overlay **sudah tampil sejak awal** karena `WorldConfig.debug.enabled = true`, jadi tekan F1 pertama akan menyembunyikannya.

Saat overlay disembunyikan, `DebugOverlay.update()` langsung `return` sehingga tidak ada string yang dibangun tiap frame — biaya performa nol.

Lokasi: `Game.ts:262` → `this.overlay?.toggle()`.

### F2 — Stress test ringan (100 peluru)

Memanggil `spawnStressBullets(100)`: 100 peluru musuh dibuat di `x` acak dalam play area, `y = -offScreenMargin`, kecepatan `EnemyConfig.bullet.speed`. Dipakai untuk melihat baseline FPS dan `spawn ms` saat beban normal.

Lokasi: `Game.ts:263` → `spawnStressBullets(count)` (`Game.ts:510`).

### F3 — Stress test berat (3000 peluru)

Sama seperti F2 dengan jumlah 3000. Gunanya menguji batas pool peluru musuh: perhatikan `aktif / max / overflow` di overlay. Kalau `overflow` naik, pool kehabisan objek dan spawn dibatalkan (bukan crash).

### F4 — Putar jumlah jalur tembak

Memanggil `PlayerWeapon.cycleLanes()`: `lanes` naik satu, dan kalau sudah mencapai `PlayerConfig.weapon.maxLanes` (5) kembali ke 1. Nilai awal `PlayerConfig.weapon.lanes = 1`, jarak antar jalur `laneSpacing = 20`.

Efeknya: pola tembakan berubah langsung (1 peluru → 2 peluru sejajar → dst). Nilai ini **bukan** permanen antar run: `resetForPool()` mengembalikan ke nilai config.

Lokasi: `Game.ts:264` → `PlayerWeapon.cycleLanes()` (`PlayerWeapon.ts:100`).

### Z — Lane (auto-pickup)

`PowerUpType.Lane` termasuk kategori `AutoPickup`, jadi `PowerUpManager.applyBuffType()` langsung memanggil `buff.apply(...)` → `Player.addLane()` → satu jalur tembak tambahan, dijepit ke `maxLanes`.

Beda dengan F4: F4 hanya memutar jumlah jalur (bisa turun lagi), Z menambah permanen sampai batas.

### N — Life (auto-pickup)

`PowerUpType.Life` juga `AutoPickup` → langsung `Player.addLife()`, dijepit ke `PlayerConfig.maxLives` (5).

### X / C / V / B — power-up slotted

`AtkSpeed`, `Shield`, `Laser`, dan `Nuke` berkategori `Slotted`. Menekan tombolnya **tidak** langsung mengaktifkan efek; buff masuk ke slot inventory lewat `PowerUpSlotManager.add()`.

Aturan masuk slot:

1. Kalau sudah ada slot dengan jenis sama dan stack belum penuh → stack bertambah.
2. Kalau tidak ada, dipakai slot kosong pertama.
3. Kalau semua slot penuh atau stack sudah maksimum → **gagal diam-diam** (tidak ada pesan di layar).

Batas stack per jenis ada di `PowerUpConfig.maxStackPerSlot`: AtkSpeed 3, Shield 2, Laser 2, Nuke 1.

Setelah masuk slot, tekan `1`/`2`/`3` untuk memakai, atau tahan `E` lalu tekan `1`/`2`/`3` untuk membuang.

- **X — AtkSpeed**: cooldown tembak dikalikan turun (fire rate naik) untuk durasi tertentu.
- **C — Shield**: lingkaran pelindung di sekitar pemain; menyerap hit.
- **V — Laser**: menembak beam terus-menerus; tembakan biasa diblokir selama aktif.
- **B — Nuke**: saat dipakai, damage besar ke semua musuh aktif dan seluruh peluru musuh dibersihkan (`PowerUpManager.useBomb()`).

---

## 3. Isi overlay (F1)

Overlay menampilkan 5 baris:

| Baris | Isi | Sumber data |
| ----- | --- | ----------- |
| 1 | `FPS`, `frame` (ms), `lanes` | `game.loop.actualFps`, delta frame, `weapon.laneCount` |
| 2 | Peluru pemain: aktif / max / overflow | `PlayerWeapon.bulletGroup`, `playerBulletMax`, `overflowCount` |
| 3 | Peluru musuh: aktif / max / overflow | `EnemyBulletManager.activeCount/maxActive/overflowCount` |
| 4 | Total dibuat / frame ini / `spawn` ms | `totalCreated`, `createdThisFrame`, `spawnMsThisFrame` |
| 5 | Pemain kena / nyawa / status | `playerHitCount`, `player.lives`, rangkaian status |

Status di baris 5 dirakit dari: `dash siap` / `dash cooldown`, lalu tambahan `kebal`, `shield`, `atk+`, `laser` sesuai yang sedang aktif.

---

## 4. Konfigurasi & letak kode

| Hal | Lokasi | Catatan |
| --- | ------ | ------- |
| Tombol & pengecekan | `src/game/systems/DebugTools.ts` | Hardcode sengaja, bukan `InputAction` |
| Aksi yang dipanggil | `src/game/scenes/Game.ts:261-265` | Satu-satunya tempat `new DebugTools(...)` |
| Overlay | `src/game/ui/DebugOverlay.ts` | Visibilitas awal dari `WorldConfig.debug.enabled` |
| Default overlay tampil | `src/game/config/WorldConfig.ts:6-8` | `debug.enabled: true` |
| Stress test | `Game.ts:510` `spawnStressBullets()` | Jumlah datang dari tombol, bukan config |
| Slot & pemakaian | `PowerUpConfig`, `PowerUpSlotManager` | Lihat `doc/asset-system.md` untuk aset, power-up di `plans/5#` |

Tombol debug **tidak** didaftarkan di `InputAction`/`InputBindings` supaya keybind gameplay tetap bersih dan tombol debug bisa dicabut tanpa menyentuh sistem input pemain.

---

## 5. Konflik tombol yang perlu diwaspadai

| Tombol | Konflik | Mitigasi |
| ------ | ------- | -------- |
| `F1` | Chrome/Edge membuka halaman help | Fokuskan window game; kalau tetap ditelan browser, ganti ke tombol lain |
| `F2` | VS Code: rename symbol (hanya saat editor fokus) | Tidak masalah saat game di browser |
| `F3` | Browser: find/search | Sama seperti F1 |
| `F4` | Umumnya aman (di beberapa aplikasi = close window) | Tidak dipakai browser sebagai shortcut utama |
| `F5`, `F11`, `F12` | Reload / fullscreen / devtools | **Sengaja tidak dipakai** — alasan `Z..N` dipilih untuk power-up |
| `Z..N` | Tidak ada; gameplay memakai WASD/arrow, `SPACE`, `SHIFT`, `1/2/3`, `E`, `ESC` | — |

---

## 6. Cara menambah tombol debug baru

1. Tambah aksi di `DebugActions` (`DebugTools.ts:5-11`) — misal `teleportPlayer: () => void`.
2. Implementasikan aksi itu di call site `Game.ts:261-265`.
3. Tambah field `Key` di `DebugTools`, daftarkan lewat `keyboard.addKey(...)` di constructor.
4. Tambah blok `JustDown` di `update()` dengan komentar satu baris: tombol apa, efek apa.
5. Tambah `keyboard.removeKey(...)` di `destroy()` agar tidak bocor saat scene restart.
6. Perbarui tabel di dokumen ini dan `doc/struktur-file.md` bila ada file baru.

Kalau yang ditambah hanya varian jumlah (misal stress 500), cukup tambah satu tombol + satu argumen `stress(n)`; tidak perlu mengubah `Game.ts`.

---

## 7. Di luar cakupan

Belum ada dan sengaja tidak dibuat di sini:

- scene debug terpisah / cheat console
- spawn musuh manual atau wave skipping
- toggle invulnerable, time scale, atau god mode
- teleport pemain
- daftar tombol yang bisa di-rebind (tombol debug selalu hardcode)

`DebugTools` adalah pintu masuk untuk semua itu nanti; tambahkan aksi baru di `DebugActions`, jangan menyebar `keyboard.addKey` ke scene lain.

---

## 8. Checklist verifikasi manual

1. Masuk ke scene `Game`, overlay sudah terlihat (5 baris, FPS bergerak).
2. `F1` → overlay hilang; `F1` lagi → muncul.
3. `F2` → hujan peluru terlihat; baris 3 overlay `aktif` naik.
4. `F3` → `aktif` mendekati `max`, `overflow` boleh naik, game tetap jalan (tidak crash).
5. `F4` → pola tembak berubah 1 → 2 → 3 → 4 → 5 → 1.
6. `Z` → jalur tembak bertambah permanen; `N` → nyawa bertambah (maks 5).
7. `X`/`C`/`V`/`B` → slot terisi, lalu `1/2/3` mengaktifkan; `E` + `1/2/3` membuang.
8. `B` lalu pakai → semua peluru musuh hilang, musuh aktif menerima damage besar.
9. Restart run → jalur kembali 1, slot kosong, nyawa kembali ke `PlayerConfig.lives`.
