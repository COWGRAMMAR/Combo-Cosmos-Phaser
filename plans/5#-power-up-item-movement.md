# Plan 5# — Power-Up Item: Movement, Pool, dan Pickup Terpadu

Status: **Draft rev.2 — menunggu ACC user sebelum eksekusi**
Tanggal: 2026-11-19 (rev.2: kantong kelereng untuk jenis item + pola, pool hard cap 50)
Scope: `src/game/{config,systems/power-ups,scenes}` + `docs/struktur-file.md`

---

## 1. Tujuan

Item power-up saat ini spawn lalu **diam** di posisi acak (dan posisinya salah: memakai ukuran window, bukan play area). Plan ini menambahkan:

1. Gerak jatuh dengan 3 pola: `straight`, `sine`, `infinity`.
2. Posisi selalu dihitung dari base (tidak akumulatif), `age` hanya maju di fixed timestep.
3. Pool item (kantong) + satu method `reset()` sebagai satu-satunya jalur recycle.
4. Pickup berbasis jarak + `canPickup`, menggantikan physics overlap (menghindari pickup ganda).
5. Visual transparan saat item tidak bisa diambil.
6. Debug path preview (titik lintasan 0–3 detik) yang membaca item, tanpa item bergantung ke debug.

## 2. Non-Goal (dilarang)

- Tidak menambah pola ke-4 (homing/zigzag/dll).
- Tidak ada magnet / auto-collect.
- Tidak ada fase acak; fase awal selalu 0.
- Tidak mengubah cooldown spawn, filter `isValid`/`getWeight` saat draw, aturan stack/slot, atau aturan tembakan max. (Yang berubah: cara memilih jenis item & pola — dari roll independen menjadi kantong kelereng, sesuai keputusan #7–#8.)
- Tidak mengubah `PowerUpConfig.bobot` (tetap tidak dipakai; bobot efektif dari `buff.getWeight`).

---

## 3. Keputusan yang sudah disepakati

| # | Pertanyaan                              | Keputusan                                                                                                       |
| - | --------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1 | Lokasi class item                       | `src/game/systems/power-ups/PowerUpItem.ts` (hindari `entities` import `systems` karena `PowerUpBuffType` enum)   |
| 2 | Pool item                               | **Dibuat**: hard cap `poolSize: 50`, semuanya di-prewarm saat konstruksi; item tidak pernah `destroy()` saat recycle (`setActive(false)`/`setVisible(false)`) |
| 3 | Despawn                                 | Murni keluar play area: `y > playArea.height + despawnMargin`. Timer 10 detik **dihapus**                          |
| 4 | AutoPickup `canPickup`                  | `buff.isValid(player)` dicek ulang saat pickup                                                                  |
| 5 | Jumlah file pola                        | 2 file: `config/PowerUpMovementConfig.ts` (data) + `systems/power-ups/PowerUpMovement.ts` (fungsi + registry)      |
| 6 | `resetRun()`                            | Sekalian `spawnManager.clearAll()` (bug existing: item lama nyangkut saat reset)                                  |
| 7 | Kantong kelereng — jenis item            | Dipakai (`ShuffleBag`). Kelereng dibangun dari `buff.getWeight(player)`; refill saat kosong, rebuild saat set kandidat berubah, kelereng invalid dibuang tanpa memakan draw |
| 8 | Kantong kelereng — pola                  | Dipakai: 9 kelereng (`straight`×5, `sine`×3, `infinity`×1); refill saat kosong                                   |
| 9 | Cap pool                                | Hard cap 50, **tanpa** overflow counter. Free-list kosong → spawn ditunda ke tick berikutnya (praktis tidak pernah terjadi) |
| 10 | Utilitas bag bersama                   | `src/game/utils/ShuffleBag.ts` generik, dipakai bag pola dan bag jenis item (hindari dua implementasi bag)          |

### Fakta yang dikonfirmasi ke user

- **Kantong belum ada untuk item power-up.** Pool yang sudah jalan baru `GruntPool` dan `EnemyExplosionPool`. Item power-up murni `create` → `destroy`.
- **Spawn item sekarang = weighted random *with replacement***, bukan kantong kelereng. "Aturan bag" yang disebut di brief belum ada; plan ini yang membuatnya (bag = draw *without replacement*, refill saat kosong).
- **Pool bullet (`PlayerWeapon`) sudah pakai pola prewarm + free-list** (`physics.add.group({ maxSize: poolSize })`, `bullets = Array.from(group.children)`, `_idle` free-list, `deactivate()` = `setActive(false)` + `setVisible(false)`). Item power-up meniru pola itu, tapi **tanpa** physics group karena tidak butuh body.
- **`lane`/`life` sudah tidak spawn saat penuh** (difilter `buff.isValid(player)` di `trySpawn`). `canPickup` untuk auto-pickup hanya **re-check** saat item menyentuh player, karena state bisa berubah selama item jatuh (mis. lane sudah max atau HP sudah penuh lagi).
- **Belum ada sistem reset item.** Satu-satunya "reset" sekarang adalah destroy. Plan ini memperkenalkannya.

---

## 4. Model data

### 4.1 `PowerUpMovementConfig.ts` (baru, data murni `as const`)

```ts
export const PowerUpMovementConfig = {
    /** Isi kantong pola (draw without replacement); proporsi sama dengan bobot lama 5:3:1. */
    patternBagCounts: { straight: 5, sine: 3, infinity: 1 },
    ranges: {
        straight: { speedMin: 200, speedMax: 350 },
        sine:     { speedMin: 150, speedMax: 280, ampMin: 60, ampMax: 180, freqMin: 1.5, freqMax: 3 },
        infinity: { speedMin: 60,  speedMax: 110, ampMin: 80, ampMax: 140,
                    ampYMin: 40, ampYMax: 80, freqMin: 2, freqMax: 3.5 }
    },
    /** Panjang jendela prediksi jalur debug dan langkah sampling-nya (ms). */
    debugPathDurationMs: 3000,
    debugPathStepMs: 100
} as const;
```

Semua angka di atas hanya titik awal dan **hanya** boleh diubah di file ini.

### 4.2 `PowerUpConfig.ts` (diubah)

Tambah:
- `pickupRadius: 22` (≈1.8× `itemRadius`)
- `blockedAlpha: 0.4`
- `despawnMargin: 60`
- `poolSize: 50` (hard cap; prewarm = `poolSize`, tidak ada grow, tidak ada overflow counter)

Hapus: `itemDespawnMs`, `itemBodyRadius` (keduanya jadi mati setelah body & timer dibuang).

### 4.3 `PowerUpMovement.ts` (baru)

```ts
export type PowerUpMovementId = keyof typeof PowerUpMovementConfig.ranges;

export interface PowerUpMovementParams {
    speed: number;
    amp: number;
    ampY: number;
    freq: number;
}

/** Offset pola terhadap jalur jatuh lurus. dx dikali dir di pemanggil. */
export type PowerUpMovementFn = (ageSec: number, params: PowerUpMovementParams) => { dx: number; dy: number };
```

Fungsi murni (tanpa state, fase awal 0):

| id         | dx                                        | dy                    |
| ---------- | ----------------------------------------- | --------------------- |
| `straight` | `0`                                       | `0`                   |
| `sine`     | `Math.sin(ageSec * freq) * amp`           | `0`                   |
| `infinity` | `Math.sin(ageSec * freq) * amp`           | `Math.sin(ageSec * freq * 2) * ampY` |

Registry + utilitas:
- `POWER_UP_MOVEMENT_REGISTRY: Record<PowerUpMovementId, PowerUpMovementFn>`
- `const patternBag = new ShuffleBag<PowerUpMovementId>()` (module-level, satu instance)
- `pickMovementId(): PowerUpMovementId` — `draw()` dari `patternBag`; jika kosong → `refill()` dari `patternBagCounts` lalu draw. `patternBagCounts` adalah data murni `as const`, jadi bag pola **statis** (tidak bergantung player).
- `rollMovementParams(id): PowerUpMovementParams` — roll tiap field dari `ranges[id]`; field yang tidak ada di pola → `0`.
- `validateMovementConfig(): void` — untuk tiap pola infinity: `2 * ampYMin * freqMin > speedMax`; jika gagal → `throw new Error(...)` dengan angka aktual. Dipanggil sekali di constructor `PowerUpSpawnManager`.

`ShuffleBag<T>` (`src/game/utils/ShuffleBag.ts`) — util generik kantong kelereng:
- `refill(entries: ReadonlyArray<{ value: T; count: number }>): void` — isi ulang; entri `count <= 0` diabaikan.
- `draw(): T | null` — ambil satu kelereng acak (swap-remove O(1)), `null` bila kosong.
- `get size(): number`, `clear(): void`.
- Tidak ada dependency Phaser/config; boleh dipakai bag mana pun.

Menambah pola baru = 1 fungsi + 1 entri `patternBagCounts` + 1 entri `ranges`. Class item & spawner tidak disentuh.

---

## 5. `PowerUpItem.ts` (baru)

`class PowerUpItem extends Phaser.GameObjects.Arc`.

Field runtime: `buffType`, `movementId`, `params`, `dir`, `baseX`, `baseY`, `ageMs`, `consumed`, `blocked`, `active`/`visible`.

```ts
/** Reset SEMUA state item; satu-satunya jalur recycle. */
public reset(buffType, movementId, params, dir, baseX, baseY): void

/** Majukan umur dengan delta fixed step, lalu hitung posisi dari base. */
public advance(fixedStepMs: number): void

/** Tandai item tidak bisa diambil (alpha turun) atau bisa diambil (alpha normal). */
public setBlocked(blocked: boolean): void

/** Pakai item: set consumed + sembunyikan tanpa destroy. */
public consume(): void
```

Posisi di `advance()`:

```
ageSec = ageMs / 1000
{ dx, dy } = POWER_UP_MOVEMENT_REGISTRY[movementId](ageSec, params)
x = baseX + dx * dir
y = baseY + params.speed * ageSec + dy
```

`reset()` wajib mengembalikan: `buffType`, `movementId`, `params` (speed/amp/ampY/freq), `dir`, `baseX`, `baseY`, `ageMs=0`, `consumed=false`, `blocked=false`, `alpha=itemAlpha`, `setVisible(true)`, `setActive(true)`. Setiap field yang berubah di `advance()`/pickup **wajib** ada di `reset()`.

Visual: `scene.add.circle(0, 0, PowerUpConfig.itemRadius, iconColorFor(buffType), PowerUpConfig.itemAlpha)`, `setDepth(itemDepth)`. **Tanpa** `physics.add.existing`, tanpa body, tanpa overlap.

---

## 6. `PowerUpSpawnManager.ts` (diubah)

Constructor: `(scene, player, buffRegistry, slotManager)` — `slotManager` baru dipakai untuk `canAccept`. Game mengirim `powerUps.getSlotManager()`.

### 6.1 Pool

- `pool: PowerUpItem[]` — dibuat **sekali** di constructor sebanyak `PowerUpConfig.poolSize` (50), semuanya `setActive(false).setVisible(false)`.
- `_idle: PowerUpItem[]` — free-list berisi semua item yang nonaktif (awalnya = `pool`).
- `getFreeItem(): PowerUpItem | null` — `_idle.pop() ?? null`. **Tidak ada** pembuatan item baru saat runtime dan **tidak ada** `overflowCount`.
- `returnToPool(item)` → `setActive(false)`, `setVisible(false)`, `_idle.push(item)`; tidak ada `destroy()`.
- Jika `getFreeItem()` mengembalikan `null` (theoretis mustahil: maksimal ~18 item hidup pada 1 spawn/detik + despawn < 20 detik), `trySpawn()` cukup `return` tanpa mengubah timer; spawn berikutnya mencoba lagi.
- `activeItems` tetap ada untuk iterasi + debug.

### 6.2 Spawn (per item)

1. `type` + `buff` diambil dari **kantong jenis item** (mekanik di 6.2a); filter `isValid` + `getWeight > 0` tetap sama.
2. `movementId = pickMovementId()`; `params = rollMovementParams(movementId)`; `dir = Math.random() < 0.5 ? -1 : 1`.
3. `baseX = Between(spawnMargin + params.amp, playArea.width - spawnMargin - params.amp)` (clamp juga via `Phaser.Math.Clamp` sebagai pengaman).
4. `baseY = -spawnMargin` (spawn di atas layar).
5. `item.reset(buffType, movementId, params, dir, baseX, baseY)`; `item.advance(0)` untuk sinkron posisi awal.
6. Push ke `activeItems`. **Tidak ada** `delayedCall` despawn.

### 6.2a Mekanik kantong jenis item

Field baru di spawner: `_itemBag: ShuffleBag<PowerUpBuffType>`, `_bagSignature: string`.

1. Bangun `candidates` seperti sekarang (`buff.isValid(player)` && `buff.getWeight(player) > 0`). Jika kosong → `trySpawn()` berhenti (perilaku lama).
2. `signature = candidates.map(c => c.type).sort().join('|')`.
3. Jika `signature !== _bagSignature` → `_itemBag.clear()`, `refill(candidates.map(c => ({ value: c.type, count: Math.max(1, Math.round(c.weight)) })))`, simpan `_bagSignature`. (Rebuild ini menangani `lane` max / HP penuh yang berubah di tengah run.)
4. Jika `_itemBag.size === 0` → refill ulang dengan aturan yang sama.
5. `drawn = _itemBag.draw()`; jika `drawn` sudah tidak ada di `candidates` (state berubah antar draw) → buang dan draw lagi, maksimal `candidates.length` percobaan; jika tetap gagal → pakai `candidates[0].type`.
6. Ambil `buff` dari `buffRegistry.get(drawn)`.

Efek: satu item = satu kelereng; jenis tidak bisa keluar berulang sebelum kantong habis (distribusi lebih rata daripada roll independen), sementara aturan validitas/stack tidak berubah. `PowerUpConfig.bobot` tetap tidak dipakai.

### 6.3 Update item (single source of truth)

Dipanggil **di dalam fixed step** dari `Game.update` sebagai `updateItems(fixedStepMs)`:

```
for (let i = activeItems.length - 1; i >= 0; i--) {
    item.advance(fixedStepMs);
    const buff = buffRegistry.get(item.buffType);
    const can = this.canPickup(item.buffType, buff);
    item.setBlocked(!can && !item.consumed);

    if (!item.consumed && can && distance(item, player) < pickupRadius) {
        this.collectItem(item, buff);
        continue;
    }
    if (item.y > playArea.height + despawnMargin) {
        this.returnToPool(item);
        activeItems.splice(i, 1);
    }
}
```

Jaminan keluar layar: `y = baseY + speed * age + dy`, `dy ∈ [-ampY, +ampY]` → monoton naik dengan `speed ≥ 60`, jadi selalu melewati batas bawah.

### 6.4 `canPickup(buffType, buff)`

```
category === AutoPickup  → buff.isValid(player)              // re-check lane max / HP penuh
category === Slotted     → slotManager.canAccept(buffType)   // slot kosong ATAU jenis sama & stack < max
```

Tidak ada logika slot yang ditulis ulang di spawner.

### 6.5 Collect

```
collectItem(item, buff) {
    item.consume();
    this.returnToPool(item);
    remove from activeItems;
    scene.events.emit(GameEvents.POWER_UP_COLLECTED, item.buffType, buff.getCategory());
}
```

Urutan tetap: hapus item → emit → `Game.handlePowerUpCollected` → `powerUps.applyBuffType`.

### 6.6 Yang TIDAK berubah

- `start()`, `stop()`, `scheduleNextSpawn()`, `spawnIntervalMs`, `spawnJitterMs`.
- Filter `isValid` + `getWeight > 0` di `trySpawn()`; yang berubah hanya **cara memilih** (kantong, bukan roll independen).
- `update(delta)` untuk timing spawn tetap dipanggil dengan frame delta dari `Game.update`.

---

## 7. `PowerUpSlotManager.ts` (diubah)

Tambah satu method publik:

```ts
/** Cek apakah inventory masih bisa menerima jenis ini (slot kosong atau stack belum max). */
public canAccept(type: PowerUpBuffType): boolean
```

Implementasi memakai state yang sudah ada: `findSlot(type)` → jika `>= 0` cek `getSlotCountAt < getMaxStackAt`; jika tidak ada slot jenis itu → `!isFull()`. Tidak menyentuh `add()`.

---

## 8. `Game.ts` (diubah)

1. `new PowerUpSpawnManager(this, player, powerUps.getBuffRegistry(), powerUps.getSlotManager())`.
2. Di callback `runFixedStepsWithTimeConfig`, tambahkan `this.spawnManager.updateItems(fixedStepMs)` (setelah/bersama `effects.update`).
3. `spawnManager.update(delta)` tetap di tempat lama (frame delta) untuk cadence spawn.
4. `resetRun()`: tambahkan `this.spawnManager.clearAll()` sebelum `stop()`.
5. Debug: setelah `overlay.update(stats)`, panggil `this.debugTools.renderPowerUpPaths(this.spawnManager.getActiveItems(), this.overlay.isVisible)`.
6. `handleShutdown()`/destroy: `spawnManager.clearAll()` (tanpa destroy per item selain saat scene mati).

Pause: `age` hanya maju di fixed step, dan `Game.update` tidak jalan saat scene pause → item beku otomatis. Tidak perlu perubahan `handleScenePause`/`Resume`.

---

## 9. `DebugTools.ts` (diubah)

Tambah satu `Phaser.GameObjects.Graphics` (depth `itemDepth + 1`) dan:

```ts
/** Gambar titik prediksi lintasan tiap item aktif; hanya dipakai saat debug terlihat. */
public renderPowerUpPaths(items: PowerUpItem[], enabled: boolean): void
```

- `enabled === false` → `graphics.clear()` dan return.
- Untuk tiap item: `clear()` sekali di awal; iterasi `age = 0 .. debugPathDurationMs` step `debugPathStepMs` (3000 / 100), hitung posisi dengan rumus yang sama dari `baseX/baseY/params/dir`, `fillCircle(x, y, 2)` dengan warna ikon item, alpha ~0.35. Titik dihitung dari **base spawn**, sehingga seluruh bentuk 8/ombak terlihat.
- `destroy()` juga destroy graphics.

Aturan dependensi: DebugTools (systems) membaca `PowerUpItem`; `PowerUpItem` **tidak** meng-import apa pun dari debug.

Konstanta `debugPathDurationMs` & `debugPathStepMs` masuk `PowerUpMovementConfig`.

---

## 10. `docs/struktur-file.md` (wajib)

Tambah entri:
- `config/PowerUpMovementConfig.ts`
- `systems/power-ups/PowerUpItem.ts`
- `systems/power-ups/PowerUpMovement.ts`
- `utils/ShuffleBag.ts`

Update catatan status: "Power-up item movement + pool + pickup jarak selesai".

---

## 11. Perubahan perilaku vs spawn lama (bahan laporan akhir)

| #  | Aspek        | Sebelum                                                       | Sesudah                                                              |
| -- | ------------ | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1  | Posisi spawn | `Between(margin, scale.width/height - margin)` → acak seluruh window | `baseX` dalam play area (1060) dengan clamp `±amp`, `baseY = -margin` |
| 2  | Gerak        | Diam                                                          | Jatuh: straight 5 : sine 3 : infinity 1                              |
| 3  | Umur item    | Timer 10 detik (`itemDespawnMs`)                               | Sampai `y > 1080 + 60` (bisa >10 detik untuk infinity)                |
| 4  | Pickup       | Arcade overlap radius 12, unconditional                       | Jarak `pickupRadius` 22 + `canPickup`; bisa gagal → item tetap jatuh |
| 5  | Visual gagal | Tidak ada                                                     | Alpha 0.4 saat tidak bisa diambil                                    |
| 6  | Recycle      | `destroy()` + splice                                          | `reset()` + pool 50 (tanpa destroy)                                  |
| 7  | Reset run    | Item lama tidak dibersihkan                                   | `clearAll()` dipanggil                                               |
| 8  | Pemilihan jenis item | Roll independen tiap spawn (with replacement)         | Kantong kelereng dari `getWeight` (without replacement, refill saat kosong) |
| 9  | Pemilihan pola | Tidak ada (item diam)                                       | Kantong pola 9 kelereng: straight×5, sine×3, infinity×1              |
| 10 | Alokasi runtime | `create`/`destroy` tiap item                              | Nol alokasi saat runtime; 50 item dibuat sekali di constructor        |

---

## 12. Urutan eksekusi

1. `utils/ShuffleBag.ts` (generik: refill/draw/clear/size).
2. `PowerUpMovementConfig.ts` + `PowerUpMovement.ts` (fungsi murni, registry, bag pola, roll params, validasi).
3. `PowerUpItem.ts` (class + reset/advance/setBlocked/consume).
4. `PowerUpConfig.ts` (tambah/buang field, `poolSize: 50`).
5. `PowerUpSlotManager.canAccept()`.
6. `PowerUpSpawnManager` (pool 50 + free-list, bag jenis item, spawn atas, updateItems, canPickup, despawn y, collect).
7. `Game.ts` (constructor, fixed-step items, resetRun, debug call).
8. `DebugTools.renderPowerUpPaths()`.
9. JSDoc Bahasa Indonesia di semua member baru (class/interface/function/method/constructor/getter).
10. `docs/struktur-file.md`.

## 13. Verifikasi

- `node "node_modules\typescript\bin\tsc" --noEmit` → exit 0.
- Cek manual di dev server (tanpa build produksi sampai user konfirmasi):
  - Item muncul dari atas, tidak dari tengah/kanan.
  - Ketiga pola terlihat; infinity membentuk 8.
  - Pause → item beku; resume → lanjut tanpa loncatan.
  - Slot penuh jenis lain → item lewat transparan, tidak hilang, tetap jatuh.
  - Stack belum max jenis sama → bisa diambil.
  - Lane max / HP penuh → item `lane`/`life` jadi transparan dan tidak bisa diambil.
  - Item keluar bawah → kembali ke pool (tidak ada `destroy`).
  - Reset run → tidak ada item sisa.
  - F1 debug → titik lintasan tampil; F1 off → graphics bersih.
- Tidak menjalankan `build` sebelum ada konfirmasi user.

## 14. Risiko

| Risiko                                              | Mitigasi                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| `PowerUpItem` extends Arc tidak punya body → tidak bisa overlap | Memang disengaja: pickup manual satu jalur, tidak ada double pickup |
| Infinity dengan amp besar bisa melebihi batas atas sebelum jatuh | `baseY = -margin`; `dy` maksimum `ampY ≤ 80` → tidak muncul di tengah   |
| `baseX` clamp tidak muat jika `amp > (playArea.width - 2*margin)/2` | Divalidasi di `validateMovementConfig()` (throw saat start)              |
| Item lolos dari player karena `canPickup` false → menumpuk          | Despawn y-bound tetap berlaku; tidak ada akumulasi permanen              |
| Kantong pola/bag item bisa "stall" jika semua kelereng invalid (mis. semua tipe `lane` saat lane max) | Signature kandidat memicu rebuild bag; item tidak valid dibuang lalu draw ulang; fallback `candidates[0]` |
| Pool 50 bisa habis jika entah bagaimana despawn tidak jalan         | Guard `null` → spawn ditunda satu tick; tidak ada alokasi baru dan tidak ada item yang hilang |
