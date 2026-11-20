# Plan 6# — Dynamic Spawn Zone + Straight Diagonal + Despawn 4 Sisi

Status: **Draft rev.1 — menunggu ACC final user sebelum eksekusi**
Tanggal: 2026-11-20
Scope: `src/game/{config,systems/power-ups,systems,scenes}` + `docs/struktur-file.md` + `docs/debug-toggles.md`
Prasyarat: Plan 5# sudah diimplementasi (pool 50, `PowerUpItem.reset()`, `ShuffleBag`, movement registry, pickup jarak, despawn y-based).

---

## 1. Tujuan

1. Item power-up tidak lagi selalu spawn dari atas layar, tapi dari **Dynamic Spawn Zone** (kotak 300×300) yang berpindah setelah 2 item sukses di-spawn.
2. Pola `straight` menjadi **diagonal** dengan sudut acak (−30°..+30°), di-roll sekali saat spawn.
3. Spawn divalidasi jarak minimum ke player (150 px, posisi player dibaca segar), dan despawn diperluas ke **4 sisi** play area.
4. Debug F1 menampilkan zona, pusat zona, ring radius spawn player, dan arah diagonal.

Tidak ada pola movement baru. Tidak ada perubahan pada inventory/buff/stack/slot/aturan tembakan.

## 2. Non-Goal (dilarang)

- Tidak menambah pola ke-4 (homing/zigzag/magnet).
- Tidak mengubah distribusi kantong pola (straight×5, sine×3, infinity×1) maupun rentang speed.
- Tidak mengubah cooldown/jitter spawn, filter `isValid`/`getWeight`, mekanik kantong jenis item.
- Tidak mengubah `PowerUpSlotManager` (tidak perlu `canAccept` baru).
- Tidak mengubah ukuran zona secara dinamis (tetap 300×300 walau playArea lebih kecil).
- Tidak membuat sistem debug kedua; semua visual masuk `DebugTools` yang ada.
- Tidak `destroy()` item saat despawn (tetap `releaseItem()` → free-list).
- Tidak menyentuh dependency/versi Phaser.

---

## 3. Keputusan yang sudah disepakati (final)

| # | Pertanyaan | Keputusan |
| - | ---------- | --------- |
| 1 | D1: item bisa spawn dekat batas bawah (centerY max 930) | **(a) ikut spec apa adanya.** Seluruh playArea valid, tanpa `centerYMin`. |
| 2 | D2: deadlock bila player camping di dalam zona | **(b) zona langsung di-roll ulang** ketika randomisasi posisi item gagal total karena validasi jarak player. Counter tidak naik, spawn ditunda 1 tick. |
| 3 | Semua angka konfigurasi | **Wajib masuk `config/`.** Hanya nilai kosmetik/iterasi internal yang benar-benar sepele boleh inline (mis. jumlah segmen kotak debug). |
| 4 | `PowerUpConfig.spawnMargin` | **Dihapus** — satu-satunya pemakai adalah `spawnItem()` lama yang digantikan `rollItemPosition()`. |
| 5 | `dir` untuk pola straight | **Dipaksa `1`.** Arah dibawa oleh `angleDeg`; kalau `dir` acak ±1, sudut diagonal akan ter-mirror dan rentang ±30° jadi palsu. |
| 6 | Formula straight | `dx = sin(θ)·v·t`, `dy = (cos(θ)−1)·v·t` sehingga hasil akhir `predict()` = `x = baseX + sin(θ)·v·t`, `y = baseY + cos(θ)·v·t`. Kecepatan total tetap **persis** `v` (sin²+cos²=1), tidak pernah melebihi gerak vertikal. |
| 7 | Rumus kedua di `PowerUpItem` | **Tidak dibuat.** `predict()` yang ada sudah `x = baseX + dx*dir`, `y = baseY + speed*ageSec + dy`; straight cukup menyumbang offset. Satu jalur rumus saja. |
| 8 | Despawn bawah | Mengikuti spec literal: `y > playArea.height + despawnMargin`. |
| 9 | Despawn atas/kiri/kanan | `y < -despawnMargin - itemRadius`, `x < -despawnMargin - itemRadius`, `x > playArea.width + despawnMargin + itemRadius` — karena item bisa keluar horizontal tanpa pernah melewati batas bawah. |
| 10 | Zona awal & reset | Zona awal di-roll di constructor **tanpa syarat jarak**; `clearAll()` mengembalikan `spawnsInZone = 0` + roll zona baru tanpa syarat jarak (otomatis ikut `resetRun()` dan `handleShutdown()`). |
| 11 | Urutan konsumsi kantong jenis | Posisi divalidasi **sebelum** `drawItemType()`, sehingga spawn gagal tidak memakan kelereng jenis maupun slot pool. |

---

## 4. Model data

### 4.1 `PowerUpConfig.ts` (diubah)

Tambah (semua `as const`):

```ts
/** Zona spawn persegi yang berpindah setelah sejumlah item sukses di-spawn. */
spawnZone: {
    /** Ukuran zona (px). Tetap; tidak diperkecil walau playArea lebih kecil. */
    width: 300,
    height: 300,
    /** Jumlah item sukses sebelum zona di-roll ulang. */
    itemsPerZone: 2,
    /** Rentang jarak minimum antarzona; nilai minimum di-roll tiap perpindahan. */
    minDistanceMin: 200,
    minDistanceMax: 500,
    /** Percobaan acak posisi pusat per putaran relaksasi. */
    maxPositionAttempts: 20,
    /** Putaran penurunan jarak minimum bila tidak ada kandidat yang lolos. */
    maxRelaxRounds: 6,
    /** Penurunan jarak minimum per putaran (px). */
    relaxStep: 50,
    /** Percobaan acak posisi item di dalam zona (validasi jarak ke player). */
    itemSpawnMaxAttempts: 12,
},
/** Jarak minimum pusat item ke pusat player saat spawn (px). */
minPlayerSpawnDistance: 150,
```

Hapus: `spawnMargin` (baris 25) — tidak ada pemakai lain.

### 4.2 `PowerUpMovementConfig.ts` (diubah)

```ts
ranges: {
    straight: { speed: { min: 200, max: 350 }, angle: { min: -30, max: 30 } },
    // sine & infinity TIDAK diubah
},
// tambahan di bagian debug (semua kosmetik tapi tetap di config):
debugZoneColor: 0x00e5ff,
debugZoneAlpha: 0.5,
debugZoneCenterRadius: 3,
debugPlayerRingColor: 0xff4081,
debugPlayerRingAlpha: 0.5,
debugDirectionLineLength: 40,
```

`speed` straight tidak diubah nilainya, hanya ditambah `angle`.

---

## 5. `PowerUpMovement.ts` (diubah)

1. `PowerUpMovementParams` tambah field **wajib** `angleDeg: number` (derajat; 0 untuk sine/infinity).
2. `MovementRanges` tambah `angle?: MovementRange`.
3. `straight` menjadi:

```ts
straight: (ageSec, params) => {
    const rad = Phaser.Math.DegToRad(params.angleDeg);
    return {
        dx: Math.sin(rad) * params.speed * ageSec,
        dy: (Math.cos(rad) - 1) * params.speed * ageSec,
    };
},
```

4. `rollMovementParams(id)` menambah `angleDeg: rollRange(ranges[id].angle)` → otomatis `0` untuk pola tanpa `angle` (perilaku `rollRange` yang sudah ada).
5. `validateMovementConfig()` tambah pemeriksaan: bila `ranges.straight.angle` ada, `min <= 0 <= max` wajib benar, kalau tidak → `throw` dengan angka aktual. Pemeriksaan infinity yang ada tidak diubah.

`sine` dan `infinity` **tidak disentuh sama sekali**.

---

## 6. `PowerUpItem.ts` (diubah)

1. Default field `params` tambah `angleDeg: 0`.
2. Getter baru:

```ts
/** Sudut arah diagonal dalam derajat (0 untuk pola non-straight), untuk visual debug. */
public getDirectionAngleDeg(): number
```

3. `predict()` / `advance()` / `reset()` **tidak diubah logikanya**. Karena `reset()` mengganti seluruh objek `params`, `angleDeg` lama tidak mungkin terbawa saat recycle.

---

## 7. `PowerUpSpawnManager.ts` (diubah — inti plan)

### 7.1 State baru

```ts
zoneCenterX: number;
zoneCenterY: number;
spawnsInZone: number;
```

Constructor: setelah `validateMovementConfig()`, panggil `this.resetSpawnZone(null)`.

Batas pusat zona dihitung dari `ScreenConfig.playArea` **saat dipakai** (bukan di-precompute), supaya aman bila playArea berubah:

```
halfW = spawnZone.width / 2
halfH = spawnZone.height / 2
minCX = halfW                      maxCX = playArea.width  - halfW
minCY = halfH                      maxCY = playArea.height - halfH
```

Bila `maxCX < minCX` (playArea lebih sempit dari zona) → `centerX = playArea.width / 2` (rentang collapse ke tengah, ukuran zona **tidak** diubah). Sama untuk Y.

### 7.2 `resetSpawnZone(previous: {x,y} | null)`

```
if (previous === null):
    centerX = randRange(minCX, maxCX)   // atau tengah bila collapse
    centerY = randRange(minCY, maxCY)
    spawnsInZone = 0
    return

for round = 0 .. maxRelaxRounds:
    required = Between(minDistanceMin, minDistanceMax) - round * relaxStep
    for attempt = 0 .. maxPositionAttempts:
        candidate = { rand+clamp X, rand+clamp Y }
        if sqrt((dx)^2 + (dy)^2) >= required:   // Euclidean ke previous
            commit candidate; spawnsInZone = 0; return
    // lanjut putaran berikutnya dengan syarat lebih longgar

// semua gagal → pakai kandidat terakhir (dijamin di dalam playArea)
commit lastCandidate; spawnsInZone = 0
```

Worst case = `(maxRelaxRounds + 1) × (maxPositionAttempts + 1)` ≈ 147 percobaan, tanpa loop tak terbatas.

### 7.3 `rollItemPosition(movementId, params): {x,y} | null`

```
baseMinX = max(0, centerX - halfW) + itemRadius
baseMaxX = min(playArea.width,  centerX + halfW) - itemRadius
(sama untuk Y; inset tambahan params.amp / params.ampY untuk pola berayun)
if baseMaxX < baseMinX (zona terpotong playArea) → x = clamp(centerX, itemRadius, width - itemRadius)
```

Loop `itemSpawnMaxAttempts`:

- `x = Between(minX, maxX)`, `y = Between(minY, maxY)`
- baca posisi player **segar**: `this.player.x`, `this.player.y`
- `if (dx² + dy²) >= minPlayerSpawnDistance²` → return `{x, y}`
- gagal semua → `return null`

Inset `params.amp`/`params.ampY` berlaku universal karena `straight` mendapat `amp = 0` dari `rollRange` (tidak perlu cabang pola).

### 7.4 Urutan `trySpawn()` baru

1. `candidates = buildCandidates()`; kosong → `return` (perilaku lama).
2. `item = getFreeItem()`; `null` → `return` (perilaku lama).
3. `movementId = pickMovementId()`; `params = rollMovementParams(movementId)`.
4. `pos = rollItemPosition(movementId, params)`.
   - `pos === null` → `returnToPool(item)` (push balik ke `idleItems`), lalu **`resetSpawnZone(current)`** (keputusan D2), `return`. **Tidak** menyentuh kantong jenis, **tidak** menaikkan counter.
5. `type = drawItemType(candidates)` (kantong jenis; hanya dieksekusi di jalur sukses).
6. `dir = movementId === 'straight' ? 1 : (Math.random() < 0.5 ? -1 : 1)`.
7. `item.reset(type, movementId, params, dir, pos.x, pos.y)`; `item.advance(0)`; push `activeItems`.
8. `spawnsInZone++`; `if (spawnsInZone >= itemsPerZone) resetSpawnZone({ x: zoneCenterX, y: zoneCenterY })`.

`baseY` kini = `pos.y` (di dalam zona), bukan `-spawnMargin`. Zona bisa berada di bawah player → item lahir di bawah dan langsung despawn; ini konsekuensi D1(a) yang sudah diterima.

### 7.5 `updateItems(fixedStepMs)` — despawn 4 sisi

Setelah blok pickup (`continue` tetap mencegah double-release):

```ts
const r = PowerUpConfig.itemRadius;
const m = PowerUpConfig.despawnMargin;
if (
    item.y > playArea.height + m ||
    item.y < -m - r ||
    item.x < -m - r ||
    item.x > playArea.width + m + r
) {
    this.releaseItem(i);
}
```

Tanpa timer, tanpa `destroy()`, satu jalur release (`releaseItem`).

### 7.6 API baru untuk debug

```ts
/** Snapshot zona spawn aktif untuk visualisasi debug. */
public getSpawnZone(): { x: number; y: number; width: number; height: number }
```

### 7.7 `clearAll()`

Tambah di akhir: `this.resetSpawnZone(null)` (tanpa syarat jarak). Otomatis berlaku untuk `resetRun()` dan `handleShutdown()` karena keduanya sudah memanggil `clearAll()`.

---

## 8. `DebugTools.ts` (diubah)

Signature diperluas (bukan sistem baru):

```ts
public renderPowerUpPaths(
    items: PowerUpItem[],
    enabled: boolean,
    zone: { x: number; y: number; width: number; height: number } | null,
    playerPos: { x: number; y: number },
): void
```

Saat `enabled === false` → `pathGraphics.clear()` lalu return (perilaku lama).

Saat aktif, semua digambar di `pathGraphics` yang sama:

1. Kotak zona: `strokeRect(zone.x - w/2, zone.y - h/2, w, h)` + `lineStyle` tipis, warna/alpha dari config.
2. Titik pusat zona: `fillCircle(zone.x, zone.y, debugZoneCenterRadius)`.
3. Ring jarak spawn player: `strokeCircle(playerPos.x, playerPos.y, minPlayerSpawnDistance)`.
4. Per item: titik prediksi lintasan (logika lama, tetap pakai `item.predict(ageMs)`).
5. Khusus `movementId === 'straight'`: garis arah panjang `debugDirectionLineLength` dari posisi item mengikuti `getDirectionAngleDeg()` (`x2 = x + sin(rad)*len`, `y2 = y + cos(rad)*len`).

`destroy()` tidak berubah.

---

## 9. `Game.ts` (diubah)

Hanya 1 call site (baris ~402–405):

```ts
this.debugTools.renderPowerUpPaths(
    this.spawnManager?.getActiveItems() ?? [],
    this.overlay?.isVisible ?? false,
    this.spawnManager?.getSpawnZone() ?? null,
    { x: this.player.x, y: this.player.y },
);
```

Tidak ada perubahan lain: constructor, `updateItems` di fixed step, `update(delta)`, `resetRun()`, `handleShutdown()` tetap seperti Plan 5.

---

## 10. Dokumentasi (wajib)

- `docs/struktur-file.md`: update status/tanggal + deskripsi 5 file yang berubah (`PowerUpConfig.ts`, `PowerUpMovementConfig.ts`, `PowerUpMovement.ts`, `PowerUpItem.ts`, `PowerUpSpawnManager.ts`, `DebugTools.ts`, `Game.ts`). **Tidak ada file baru.**
- `docs/debug-toggles.md`: tambah isi visual F1 (kotak zona, pusat zona, ring 150 px, garis arah straight).

---

## 11. Perubahan perilaku vs Plan 5

| # | Aspek | Sesudah Plan 5 | Sesudah Plan 6 |
| - | ----- | -------------- | -------------- |
| 1 | Titik lahir item | `baseX` acak di play area, `baseY = -spawnMargin` | Posisi acak di dalam zona 300×300, inset `itemRadius` (+amp) |
| 2 | Perpindahan zona | Tidak ada | Tiap 2 item sukses, jarak minimum antarzona 200–500 px |
| 3 | Jarak ke player | Tidak divalidasi | Pusat item ≥ 150 px dari pusat player (posisi dibaca segar) |
| 4 | Pola straight | Jatuh lurus (`dx=0`) | Diagonal sudut −30°..+30°, `dir` dipaksa 1 |
| 5 | Despawn | Hanya `y > height + margin` | 4 sisi (bawah/atas/kiri/kanan) |
| 6 | Spawn gagal | Hanya pool/kandidat | + posisi invalid → pool dikembalikan, zona di-roll ulang (D2) |
| 7 | Debug F1 | Titik prediksi lintasan | + kotak zona, pusat zona, ring 150 px, garis arah straight |
| 8 | `spawnMargin` | Dipakai | Dihapus (dead config) |

Yang **tidak** berubah: pool 50 + prewarm + free-list, `reset()` sebagai satu-satunya pintu recycle, kantong jenis & pola beserta distribusinya, `canAccept`, pickup radius 22, re-check `isValid` saat pickup, alpha 0.4 item blocked, fixed timestep, jitter/cooldown spawn, pause/resume, `clearAll()`.

---

## 12. Edge case 1–16 → penanganan

| # | Edge case | Penanganan |
| - | --------- | ---------- |
| 1 | Pusat zona dekat batas | Clamp `[half, playArea - half]` per sumbu |
| 2 | Zona baru gagal syarat jarak setelah clamp | `maxRelaxRounds` menurunkan `required` sebesar `relaxStep`; gagal total → pakai kandidat terakhir yang tetap valid di dalam playArea |
| 3 | Randomisasi gagal berkali-kali | Batas hard iterasi (≈147), tanpa loop tak terbatas |
| 4 | playArea < zona (300×300) | Rentang clamp collapse ke tengah playArea; ukuran zona **tidak** diubah; `rollItemPosition` memakai irisan zona∩playArea |
| 5 | Item gagal 150 px dari player | `itemSpawnMaxAttempts`; habis → spawn dibatalkan (pool dikembalikan, counter tetap) |
| 6 | Player bergerak antar spawn | Posisi player dibaca di dalam loop `rollItemPosition`, bukan snapshot |
| 7 | Pool penuh saat zona harus pindah | `getFreeItem() === null` → return sebelum counter naik; zona hanya pindah setelah spawn sukses |
| 8 | Tidak ada kandidat buff | `buildCandidates()` kosong → return sebelum mengambil item dari pool |
| 9 | Counter tidak naik saat gagal | `spawnsInZone++` hanya di baris setelah `reset()` + push |
| 10 | Item diagonal keluar kiri/kanan | Despawn sisi X |
| 11 | Item keluar atas/bawah | Despawn sisi Y (bawah sesuai spec literal) |
| 12 | Pickup & despawn di siklus sama | `continue` setelah pickup → tidak ada double-release |
| 13 | Sudut item lama terbawa | `reset()` mengganti seluruh objek `params` |
| 14 | Reset run bersih | `clearAll()` → release semua + `resetSpawnZone(null)` |
| 15 | Debug tertinggal | `clear()` saat nonaktif, `destroy()` saat shutdown, satu graphics |
| 16 | playArea berubah | Bound zona & posisi dihitung dari `ScreenConfig.playArea` tiap pemakaian |

---

## 13. Urutan eksekusi

1. `PowerUpConfig.ts` — tambah `spawnZone`, `minPlayerSpawnDistance`, hapus `spawnMargin`.
2. `PowerUpMovementConfig.ts` — `ranges.straight.angle` + konstanta debug.
3. `PowerUpMovement.ts` — `angleDeg`, straight diagonal, `validateMovementConfig`.
4. `PowerUpItem.ts` — default `angleDeg`, getter.
5. `PowerUpSpawnManager.ts` — state zona, `resetSpawnZone`, `rollItemPosition`, `trySpawn` baru, despawn 4 sisi, `getSpawnZone`, `clearAll`.
6. `DebugTools.ts` — signature + visual zona/ring/arah.
7. `Game.ts` — 1 call site.
8. JSDoc Bahasa Indonesia semua member baru.
9. `docs/struktur-file.md` + `docs/debug-toggles.md`.

## 14. Verifikasi

- `node "node_modules\typescript\bin\tsc" --noEmit` → exit 0.
- `grep spawnMargin src/` → kosong.
- Uji dev server **di-skip** sesuai instruksi user (hanya build/typecheck).
- **Tidak** menjalankan `npm run build` sebelum konfirmasi user.
- Tidak mengubah dependency/versi Phaser, tidak menghapus file/fitur lain.

## 15. Risiko

| Risiko | Mitigasi |
| ------ | -------- |
| Zona di area bawah → item langsung despawn | Konsekuensi D1(a) yang sudah disetujui; tidak menimbulkan bug, hanya spawn kurang berguna |
| Player camping di zona → spawn terus dibatalkan | D2: zona di-roll ulang segera setelah posisi gagal total |
| Item diagonal keluar layar lebih cepat | Despawn 4 sisi menangkap semua kasus; tidak ada kebocoran pool |
| `params.amp` inset membuat zona efektif kecil | Hanya memengaruhi sumbu X untuk sine/infinity; `straight` (mayoritas, 5/9) tidak terpengaruh |
| Zona terpotong playArea membuat irisan kosong | Fallback clamp ke batas playArea dengan inset `itemRadius` |
