# Spesifikasi Sistem Combo, Skor, dan Kontrak Damage

Game: Combo-Cosmos (bullet hell vertikal, Phaser + TypeScript)
Dokumen ini dibaca oleh: Cow (power-up, bullet player, combo/skor) dan temen yang pegang sistem enemy.

Label status yang dipakai di dokumen:

- **[FINAL]** sudah diputusin, jangan diubah tanpa diskusi.
- **[DEFAULT]** angka/aturan awal, boleh disetel pas playtest lewat config.
- **[OPEN]** belum diputusin, butuh diskusi.

---

## ✅ Status Implementasi Tahap 1 (2026-11-20)

**Selesai:** Mesin combo & skor murni (tanpa sistem enemy)

| Komponen | Status | File |
|---|---|---|
| Config tunggal (COMBO_CONFIG, SCORE_CONFIG, NUKE_RATIO) | ✅ Selesai | `src/game/config/ComboScoreConfig.ts` |
| ScoreSystem core (combo, timer, multiplier, scoring, batch) | ✅ Selesai | `src/game/systems/ScoreSystem.ts` |
| Debug terisolasi (overlay + hotkey simulasi) | ✅ Selesai | `src/game/debug/ScoreDebug.ts` |
| Event GRAZE, WAVE_CLEARED | ✅ Ditambah | `src/game/config/GameEvents.ts` |
| Hook PLAYER_HIT → onPlayerHit() | ✅ Terhubung | `src/game/scenes/Game.ts:338` |
| Hook POWER_UP_COLLECTED → addFlat(itemPickupScore) | ✅ Terhubung | `src/game/scenes/Game.ts:341` |
| Hook POWER_UP_USED → addFlat(buffActivateScore) | ✅ Terhubung | `src/game/scenes/Game.ts:344` |
| Timer pakai fixed-step delta (otomatis beku pause) | ✅ Terhubung | `src/game/scenes/Game.ts:395` |
| Reset run → scoreSystem.reset() | ✅ Terhubung | `src/game/scenes/Game.ts:528` |

**Belum (Tahap 2 - butuh sistem enemy):**
- `Damageable` interface & `takeDamage` contract (Enemy.ts)
- `enemyKilled` event dengan payload `{ enemy, source }`
- Peluru/laser/ram/nuke memanggil `takeDamage` dengan source benar
- Graze detection (butuh bullet musuh) & disable saat dash
- Wave clear, bonus no-hit, HUD, high score

---

## 1. Tujuan dan pembagian tanggung jawab

| Pihak | Tanggung jawab |
|---|---|
| Cow | Power-up (tembakan, laser, shield, atk speed, nuke, chance add), bullet player, sistem combo dan skor |
| Temen | Enemy: HP, tipe, pola tembak, **keputusan mati atau nggak**, wave |

Prinsip utama **[FINAL]**:

1. Sisi Cow cuma bilang: "tiap kali event ini terjadi, aku ngasih damage segini dari sumber ini."
2. Sisi enemy yang pegang HP dan memutuskan mati atau nggak. Begitu mati, enemy memberi event beserta **sumber kematiannya**.
3. Sistem skor cuma mendengarkan event itu. Sistem skor tidak mengecek HP, tidak mendeteksi tabrakan, dan tidak menebak siapa yang bunuh.

---

## 2. Kontrak damage (bagian terpenting buat temen)

### 2.1 Tipe dan antarmuka

```ts
type DamageSource = 'bullet' | 'laser' | 'ram' | 'nuke';
type EnemyTier = 'common' | 'elite' | 'boss';

// Yang harus disediakan sisi enemy
interface Damageable {
  readonly tier: EnemyTier;   // dibaca nuke buat milih rasio damage
  readonly maxHp: number;     // dibaca nuke buat ngitung damage persentase
  readonly isDead: boolean;
  takeDamage(amount: number, source: DamageSource): void;
}

// Event yang harus dipancarkan sisi enemy
// Nama emitter mengikuti dokumen fondasi (event bus bersama)
interface EnemyKilledPayload {
  enemy: Damageable;
  source: DamageSource;
}
// events.emit('enemyKilled', payload)
```

### 2.2 Aturan `takeDamage` (sisi enemy) **[FINAL]**

1. Kurangi HP sebesar `amount`.
2. Kalau HP <= 0 **dan** `isDead` masih false: set `isDead = true`, lalu emit `enemyKilled` **tepat sekali**.
3. Kalau `isDead` sudah true, abaikan damage berikutnya. Ini mencegah double kill kalau laser dan peluru kena di frame yang sama.
4. **Jangan clamp `amount`** terhadap HP sisa di sisi pemanggil. Damage boleh melebihi HP supaya musuh pasti mati.
5. Kalau musuh tidak mati, **tidak ada event apa pun** yang dipancarkan (tidak ada kill, tidak ada combo, tidak ada skor).

### 2.3 Siapa memanggil `takeDamage` (sisi Cow)

| Sumber | Dipanggil oleh | Damage |
|---|---|---|
| `bullet` | Tembakan player kena musuh | Damage peluru |
| `laser` | Laser kena musuh (per tick selama durasi) | Damage laser per tick |
| `ram` | Shield nabrak musuh | `RAM_DAMAGE` (lihat 2.4) |
| `nuke` | Item nuke diaktifkan | `maxHp × rasio[tier]` per musuh (lihat 6) |

### 2.4 Titik koordinasi yang butuh angka bersama

`RAM_DAMAGE` harus memenuhi dua syarat sekaligus **[FINAL]**:

- Kroco (common) mati karena ram: `RAM_DAMAGE >= HP common`.
- Elite dan boss **tidak** mati karena ram: `RAM_DAMAGE < HP elite` dan `< HP boss`.

Artinya HP common, HP elite, dan `RAM_DAMAGE` harus disepakati bareng. Masukkan ketiganya ke config supaya gampang disetel. Aturan "kroco mati, elite gak mati" **tidak** ditulis sebagai `if` di kode shield; hasilnya murni dari angka-angka ini.

---

## 3. Sistem combo

### 3.1 Aturan dasar **[FINAL]**

- Combo murni dari **kill musuh beruntun** dalam rentang timer.
- Setiap kill menambah combo **+1**, dari cara apa pun: tembakan, laser, ram, nuke.
- **Graze tidak mengubah combo.**
- **Kena hit = combo reset ke 0.**
- **Shield pecah bukan kena hit** (tidak reset combo).
- **Gelombang saat kena hit** (lingkaran yang menghapus bullet) **tidak** memberi skor, combo, maupun reset. Skor dan combo cuma nyambung ke event hit, bukan ke gelombang.
- Kena hit tidak mengurangi skor.
- Urutan: **combo naik dulu, baru multiplier dibaca.** Kill ke-10 langsung memakai tier baru (x1.5).

### 3.2 Timer

- Timer di-refresh **penuh** tiap kill **[FINAL]**.
- Saat timer habis, combo **langsung reset ke 0** **[DEFAULT]** (alternatif "turun satu tier" ditunda; ditimbang lagi kalau pas playtest terasa terlalu kejam).
- Timer ikut **freeze saat pause** **[FINAL]**. Implementasi: hitung mundur dari `delta` game (fixed timestep), **bukan** `Date.now()` atau `performance.now()`. Dengan begitu pause otomatis membekukannya.
- Saat combo 0, timer tidak berjalan.
- Nilai awal: ~2 detik **[DEFAULT]**.

### 3.3 Tier multiplier **[DEFAULT]**

| Combo minimal | Multiplier | Disimpan sebagai integer |
|---|---|---|
| 0 | x1 | 100 |
| 10 | x1.5 | 150 |
| 25 | x2 | 200 |
| 50 | x3 | 300 |
| 100 | x4 | 400 |

Multiplier disimpan sebagai **integer** (x1.5 = 150) supaya tidak kena error floating point.

---

## 4. Rumus skor

### 4.1 Pembulatan **[FINAL]**

Skor selalu integer. Rumus dasar: `base × multiplier / 100`, **dibulatkan ke atas**, dihitung **per kill**.

```ts
// multiplier dalam bentuk integer (150 = x1.5)
// pakai aritmetika integer supaya tidak ada error floating point
const scoreFor = (base: number, mult: number): number =>
  Math.floor((base * mult + 99) / 100); // setara ceil(base * mult / 100)
```

Contoh: base 5 × 150 = 750 / 100 = 7.5, dibulatkan ke atas jadi **8**.

Basis skor terkecil adalah 5, sisanya kelipatan 10.

### 4.2 Tabel sumber skor

| Sumber | Rumus | Kena multiplier? | Status |
|---|---|---|---|
| Kill (tembakan) | `scoreFor(base[tier], mult)` | Ya | FINAL |
| Kill (laser) | `scoreFor(base[tier], mult) + bonusLaser` | Base saja, bonus tidak | FINAL |
| Kill (ram) | `scoreFor(base[tier], mult) + bonusRam` | Base saja, bonus tidak | FINAL |
| Kill (nuke) | `scoreFor(base[tier], multAkhir)` per musuh | Ya (multiplier akhir) | FINAL |
| Graze | `scoreFor(nilaiGraze, mult)` | Ya | FINAL |
| Ambil item | flat (5 sampai 10) | Tidak | FINAL |
| Aktivasi buff | flat (5 sampai 10) | Tidak | FINAL |
| Clear wave | flat | Tidak | FINAL (angka DEFAULT) |
| Bonus no-hit | flat | Tidak | FINAL (angka DEFAULT) |

Catatan:

- Multiplier yang dipakai adalah multiplier **saat kill itu terjadi**. Kalau tier naik di tengah rentetan kill, kill berikutnya pakai tier baru.
- Bonus flat (laser/ram) ditambahkan **setelah** pembulatan.
- Selain kill, graze, dan ram, semuanya flat sesuai tabel skor.
- Skor item menempel ke event pickup. Item yang tidak valid (tembakan sudah max 5, HP penuh) sudah di-skip oleh sistem pickup, jadi tidak memberi skor. Exploit skor kecil ini tidak dipermasalahkan.

### 4.3 Angka awal **[DEFAULT]** (semua placeholder, disetel pas playtest)

| Parameter | Nilai awal |
|---|---|
| `base.common` | 10 |
| `base.elite` | 50 |
| `base.boss` | 500 |
| `grazeValue` | 5 |
| `bonusLaser` | 20 |
| `bonusRam` | 20 |
| `itemPickupScore` | 5 |
| `buffActivateScore` | 5 |
| `waveClearScore` | 100 |
| `noHitScore` | 200 |

Aturan angka: basis terkecil 5, sisanya kelipatan 10. Bonus laser/ram boleh di rentang 15 sampai 20 (diputusin satu di config).

---

## 5. Aturan per sumber

### 5.1 Tembakan dan laser

- Tembakan biasa mati selama laser aktif; buff lain tetap jalan; atk speed di-pause.
- Laser punya hitbox besar dan durasi. Tiap musuh yang mati karena laser dapat `base × mult + bonusLaser` dan +1 combo.

### 5.2 Ram (shield nabrak musuh) **[FINAL]**

- Shield kebal tembakan, **pecah saat nabrak musuh**, dan punya durasi.
- Ram memanggil `takeDamage(RAM_DAMAGE, 'ram')`.
- Kalau musuh **mati**: dihitung kill (+1 combo) dan skor `base × mult + bonusRam`.
- Kalau musuh **tidak mati** (elite/boss): tidak ada kill, tidak ada combo, tidak ada skor, **tidak ada bonus ram**. Shield tetap pecah.
- Karena shield pecah di tabrakan pertama, ram cuma terjadi **sekali per shield** dan tidak dikali jumlah musuh.
- Shield pecah **bukan** kena hit.

### 5.3 Graze **[FINAL]**

- Skor: `nilaiGraze × multiplier`. Tidak mengubah combo.
- **Dimatikan selama dash** (mencegah bug).

---

## 6. Nuke

### 6.1 Damage per tipe musuh **[FINAL]**

Nuke menghitung damage per musuh dari `maxHp` dan `tier` (dua properti yang disediakan sisi enemy):

| Tier | Rasio damage | Efek |
|---|---|---|
| common | 100% max HP | Pasti mati |
| elite | 75% max HP | Mati kalau HP sisa <= 75% max HP; kalau tidak, bertahan dengan sisa HP |
| boss | 25% max HP | Hanya kena damage; mati kalau HP sisa <= 25% max HP |

Rasio berbasis **max HP, bukan HP sekarang**. Kalau basisnya HP sekarang, elite tidak akan pernah mati (selalu tersisa 1/4, lalu 1/16, dst).

```ts
const NUKE_RATIO = { common: 1.0, elite: 0.75, boss: 0.25 }; // di config
for (const e of enemiesOnScreen) {
  e.takeDamage(e.maxHp * NUKE_RATIO[e.tier], 'nuke');
}
```

Nuke juga menghapus semua bullet musuh di layar (1 frame). Nuke tetap terpakai walau layar kosong (tidak ditolak).

### 6.2 Skor dan combo nuke: pendekatan "register dulu" **[FINAL]**

Tujuannya supaya nuke memberi momen skor besar. Alurnya:

1. Nuke memanggil `score.beginBatch()`.
2. Semua event `enemyKilled` dengan `source: 'nuke'` **ditampung**, belum dihitung.
3. Nuke selesai memanggil `takeDamage` ke semua musuh, lalu `score.endBatch()`.
4. `endBatch()`:
   - `N` = jumlah kill yang tertampung.
   - Combo bertambah `min(N, 50)` (cap +50 per nuke, ini batas **tambahan**, bukan batas total).
   - Multiplier dibaca dari combo **akhir**.
   - **Semua** kill nuke dihitung pakai multiplier akhir itu, per kill, dibulatkan ke atas.
   - Timer combo di-refresh sekali.
5. Musuh di atas cap tetap mati dan tetap dapat skor, tapi tidak menambah combo.
6. Kalau musuh yang mati kurang dari cap, combo bertambah sebanyak yang mati.
7. Elite yang selamat dari nuke tidak dihitung apa pun.
8. Farming nuke tidak dipermasalahkan karena stack item nuke cuma 1.

---

## 7. Event dan API sistem skor

### 7.1 Event yang didengarkan sistem skor

| Event | Dari | Efek di sistem skor |
|---|---|---|
| `enemyKilled { enemy, source }` | Sisi enemy | Kill: +1 combo (kecuali di batch nuke, lihat 6.2) dan hitung skor sesuai `source` |
| `playerHit` | Sistem player | Reset combo ke 0; set penanda `hitThisWave = true` |
| `graze` | Sistem bullet | Tambah skor graze (diabaikan saat dash) |
| `itemPickedUp` | Sistem pickup | Skor flat item |
| `buffActivated` | Sistem buff | Skor flat aktivasi |
| `waveCleared` | Sisi enemy/wave | Skor flat clear wave, plus bonus no-hit kalau `hitThisWave` masih false |

### 7.2 API publik (sketsa)

```ts
interface ScoreSystem {
  beginBatch(): void;   // dipanggil nuke sebelum takeDamage massal
  endBatch(): void;     // dipanggil nuke setelahnya

  // Baca-saja, buat HUD nanti
  readonly score: number;
  readonly combo: number;
  readonly multiplier: number;          // integer, 150 = x1.5
  readonly comboTimerRatio: number;     // 0..1, sisa timer untuk progress bar
}
```

### 7.3 Bonus no-hit **[FINAL]**

- Pakai **penanda "pernah kena"** dari event `playerHit`, **bukan** membandingkan angka HP. HP boleh bertambah (chance add), tapi begitu HP pertama kali berkurang karena hit, bonus gugur.
- Penanda di-reset di awal wave.
- Shield pecah tidak dianggap kena.

---

## 8. Config (single source of truth)

Semua angka ada di satu file config dan tidak boleh di-hardcode di logika. Sketsa:

```ts
export const COMBO_CONFIG = {
  timerMs: 2000,
  tiers: [
    { minCombo: 0,   mult: 100 },
    { minCombo: 10,  mult: 150 },
    { minCombo: 25,  mult: 200 },
    { minCombo: 50,  mult: 300 },
    { minCombo: 100, mult: 400 },
  ],
  nukeComboCap: 50,
};

export const SCORE_CONFIG = {
  base: { common: 10, elite: 50, boss: 500 },
  grazeValue: 5,
  bonusLaser: 20,
  bonusRam: 20,
  itemPickupScore: 5,
  buffActivateScore: 5,
  waveClearScore: 100,
  noHitScore: 200,
};

export const NUKE_RATIO = { common: 1.0, elite: 0.75, boss: 0.25 };
```

`RAM_DAMAGE` ditaruh di config damage bersama (lihat 2.4).

---

## 9. Penyimpanan skor

- High score disimpan lewat sistem save. Format yang direncanakan: **JSON**, kemungkinan **[OPEN]** karena sistem save (Java vs alternatif) belum dikunci.
- Saran: tambahkan field `version` di JSON supaya perubahan struktur nanti gampang di-migrate.

```json
{ "version": 1, "highScore": 0 }
```

- Scope awal: high score dan progress. Multi-profile kalau sempat.

---

## 10. Edge case dan jawabannya

| Kasus | Perilaku |
|---|---|
| Laser dan peluru kena musuh yang sama di satu frame | Kill dihitung sekali (flag `isDead`) |
| Pause saat combo berjalan | Timer beku, lanjut setelah resume |
| Tier naik di tengah rentetan kill | Kill berikutnya pakai multiplier baru |
| Shield pecah | Bukan hit, tidak reset combo |
| Ram ke elite/boss | Tidak ada kill/combo/skor/bonus; shield tetap pecah |
| Gelombang bullet saat kena hit | Tidak ada skor, combo, atau reset dari gelombang |
| Graze saat dash | Tidak dihitung |
| Item tidak valid (max/penuh) | Di-skip sistem pickup, tidak ada skor |
| Nuke saat layar kosong | Tetap terpakai |
| Musuh di atas cap nuke | Mati dan dapat skor, combo tidak bertambah |
| Kena hit | Combo reset, skor tidak berkurang |
| HP bertambah lalu berkurang dalam satu wave | Bonus no-hit gugur |

---

## 11. Yang belum final **[OPEN]**

1. **Definisi wave clear**: apakah kroco yang keluar map dihitung "selesai" atau tidak. Butuh keputusan bareng temen yang pegang enemy/wave.
2. **Bonus tambahan skor** dari lama waktu main atau jumlah buff terkumpul.
3. **Tabel angka final** (semua nilai di 4.3 masih placeholder).
4. **Reset combo saat timer habis**: langsung ke 0 (default sekarang) atau turun bertahap per tier.
5. **Indikator timer combo di HUD** (progress bar kecil): nunggu desain dari desainer. API `comboTimerRatio` sudah disiapkan.
6. **Feedback visual skor/combo**: angka melayang, efek naik tier. Dibahas di sesi lain.
7. **Format penyimpanan** high score (ikut keputusan sistem save).

---

## 12. Checklist

### Sisi temen (enemy)

- [ ] `Damageable` tersedia: `tier`, `maxHp`, `isDead`, `takeDamage(amount, source)`.
- [ ] `takeDamage` emit `enemyKilled { enemy, source }` tepat sekali, dengan guard `isDead`.
- [ ] Damage tidak di-clamp; damage berlebih tetap membunuh.
- [ ] Event `waveCleared` dipancarkan (definisi wave clear disepakati dulu).
- [ ] Angka HP common/elite dan `RAM_DAMAGE` disepakati bareng Cow.

### Sisi Cow (power-up dan skor)

- [ ] Peluru, laser, ram, nuke memanggil `takeDamage` dengan `source` yang benar.
- [ ] Nuke menghitung damage dari `maxHp × NUKE_RATIO[tier]`, dibungkus `beginBatch()` / `endBatch()`.
- [ ] `ScoreSystem` mendengarkan semua event di 7.1.
- [ ] Timer combo memakai delta game (bukan jam dinding), beku saat pause.
- [ ] Semua angka diambil dari config.
- [ ] Debug (tampil combo/skor, set combo manual) ditaruh di file debug terisolasi: debug boleh menempel ke sistem lain, sistem lain tidak boleh bergantung ke debug.

### Tes cepat setelah jadi

- [ ] Kill ke-10 langsung pakai x1.5.
- [ ] Skor base 5 × x1.5 menghasilkan 8.
- [ ] Ram ke kroco: combo +1, skor `base × mult + bonusRam`. Ram ke elite: tidak ada perubahan skor/combo.
- [ ] Nuke dengan 60 musuh common: combo +50, semua 60 dapat skor di multiplier akhir.
- [ ] Nuke ke elite penuh: selamat dengan 25% HP; elite yang HP-nya <= 75% max: mati.
- [ ] Pause 5 detik di tengah combo: combo tidak hilang setelah resume.
- [ ] Kena hit lalu dapat HP: bonus no-hit tetap gugur.
