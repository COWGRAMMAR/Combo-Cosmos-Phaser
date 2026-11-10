# Rencana: Sistem Power-Up (Spawn + Behavior per Buff)

## Keputusan

**Decision B** — Struktur baru, bukan menyesuaikan plan lama. Plan lama gagal 4 dari 10 persyaratan (isValid/getWeight, auto-pickup vs slotted, pause durasi, 3-slot inventory).

## Tujuan

Mengatur sistem power-up dalam satu folder `src/game/systems/power-ups/` dengan:

- Kontrak `IPowerUpBuff` dengan `isValid(player)` dan `getWeight(player)` yang dipakai spawn manager.
- Pemisahan auto-pickup (Lane, Life) vs slotted (AtkSpeed, Shield, Laser, Nuke).
- Slot inventory: 3 slot, 1 jenis + jumlah per slot, isi kiri-kanan, pakai via keybind, buang via Ctrl+1/2/3.
- Active buff manager: pause/resume durasi, flag `blocksNormalFire` untuk laser.
- Semua angka tuning (cap, durasi, bobot) di `PlayerConfig.ts`.

## Alasan Decision B per Persyaratan

| # | Persyaratan | Status Plan Lama | Alasan Gagal / Penyesuaian |
|---|-------------|-------------------|---------------------------|
| 1 | `isValid(player)` + `getWeight(player)` sebagai kontrak spawn | Gagal | Hanya ada `apply()` dan `getType()`. Tambah interface baru. |
| 2 | Auto pickup vs masuk slot | Gagal | Semua treated sama lewat `apply()`. Tambah `PowerUpCategory` enum. |
| 3 | Buff temporer tidak stack, pause durasi | Gagal | `EffectManager` tidak punya pause/resume. Tambah method. |
| 4 | `blocksNormalFire` flag, tanya ke buff manager | Gagal | `Game.ts` langsung set `weapon._firingEnabled`. Pindahkan ke `ActiveBuffManager`. |
| 5 | Shield pecah saat kena musuh, hilang meski durasi sisa | Parsial | Sudah ada di `Game.ts`, integrasi dengan slot/buff state. |
| 6 | Nuke instan, tetap terpakai walau kosong | Cukup | Sudah ada `useBomb()`. |
| 7 | Slot: 3 slot, stack, kiri-kanan, Ctrl+1/2/3, keybind pakai | Gagal | Tidak ada slot inventory sama sekali. Baru dibuat. |
| 8 | Cap stok per jenis, semua angka di config | Parsial | Ada duration tapi belum ada stockCap dan bobot. Ditambahkan. |
| 9 | Kena peluru cuma kurangi HP, mati = game over | Cukup | Sudah benar di `Player.applyHit()`. |
| 10 | Debug menu keyboard tetap jalan | Parsial | `DebugTools.powerUp()` harus kompatibel dengan struktur baru. |

## Lokasi File (baru)

Semua di `src/game/systems/power-ups/` (3 level nesting, konsisten dengan AGENTS.md):

| File | Tanggung Jawab |
|------|---------------|
| `IPowerUpBuff.ts` | Interface: `getType()`, `getCategory()`, `isValid(player)`, `getWeight(player)`, `apply(...)` |
| `PowerUpBuffType.ts` | Enum tipe buff: Lane, AtkSpeed, Shield, Laser, Nuke, Life |
| `PowerUpCategory.ts` | Enum: AutoPickup, Slotted |
| `LaneBuff.ts` | Auto pickup: +1 lane, permanent, max 5 |
| `LifeBuff.ts` | Auto pickup: +1 nyawa |
| `AtkSpeedBuff.ts` | Slotted: temporary, pauseable, cooldown multiplier |
| `ShieldBuff.ts` | Slotted: temporary, breakable on hit |
| `LaserBuff.ts` | Slotted: temporary, blocksNormalFire=true |
| `NukeBuff.ts` | Slotted: instant, always valid |
| `PowerUpSpawnManager.ts` | Timer spawn, pilih tipe via isValid/getWeight, render item, overlap |
| `PowerUpSlotManager.ts` | 3 slot, stack, isi kiri-kanan, pakai via keybind, Ctrl+1/2/3 buang |
| `ActiveBuffManager.ts` | Buff aktif, pause/resume duration, flag blocksNormalFire |

File yang diubah (existensi):

| File | Perubahan |
|------|-----------|
| `src/game/systems/PowerUpManager.ts` | Ganti switch dengan delegasi ke buff class. Terjadi jadi dispatcher untuk auto-pickup + entry point untuk slotted. |
| `src/game/scenes/Game.ts` | Inisialisasi PowerUpSlotManager, ActiveBuffManager, PowerUpSpawnManager. Integrasi blocksNormalFire ke weapon. Overlap player-item. |
| `src/game/config/GameEvents.ts` | Tambah `POWER_UP_COLLECTED`, `POWER_UP_USED`. |
| `src/game/config/PlayerConfig.ts` | Tambah `stockCap` per jenis, `spawnInterval`, bobot default per jenis. |
| `src/game/entities/player/PlayerWeapon.ts` | Cek `canFireNormal()` lewat ActiveBuffManager, bukan cek laser aktif langsung. |
| `doc/struktur-file.md` | Catat folder `power-ups/` dan semua file baru. |

## Arsitektur

```
Game.ts (scene)
├─ PowerUpSlotManager      # 3 slot inventory, stack, keybind, Ctrl+1/2/3
├─ ActiveBuffManager       # Buff aktif, pause/resume, blocksNormalFire
├─ PowerUpSpawnManager     # Timer spawn → item visual → overlap player
│   └─ IPowerUpBuff (via isValid/getWeight)
└─ PowerUpManager          # Dispatcher: apply(kind) → buff.apply() (auto-pickup langsung, slotted ke slot)
```

### Alur saat power-up diambil pemain (auto-pickup)

1. `PowerUpSpawnManager` deteksi overlap item dengan player.
2. Emit `GameEvents.POWER_UP_COLLECTED`.
3. `PowerUpManager.apply(type)` → `LaneBuff.apply()` atau `LifeBuff.apply()` langsung.
4. Item hilang.

### Alur saat power-up diambil pemain (slotted)

1. `PowerUpSpawnManager` deteksi overlap item dengan player.
2. Emit `GameEvents.POWER_UP_COLLECTED`.
3. `PowerUpSlotManager.add(type)` → cek `isValid()`, cek slot tersedia, masuk ke slot kosong pertama atau stack di slot jenis sama.
4. Item hilang jika berhasil masuk slot, tetap ada jika gagal.

### Alur pakai slot (keybind)

1. Pemain tekan keybind untuk slot 1/2/3.
2. `PowerUpSlotManager.use(slotIndex)` → ambil satu stack, kurangi jumlah.
3. Jika duration-based (AtkSpeed, Shield, Laser): `ActiveBuffManager.activate(buff)` → `EffectManager.activate()`.
4. Jika instant (Nuke): `NukeBuff.apply()` langsung.
5. Emit `GameEvents.POWER_UP_USED`.

### Pause durasi

Saat `LaserBuff` aktif, timer `AtkSpeedBuff` di-pause via `ActiveBuffManager.pause(type)`. Saat laser habis, `ActiveBuffManager.resume(type)`.

### blocksNormalFire

`ActiveBuffManager.canFireNormal()` mengembalikan false jika ada buff aktif dengan `blocksNormalFire = true` (Laser). `PlayerWeapon.update()` cek ini sebelum menembak.

## Atur dependensi (anti circular import)

- `systems/power-ups/*` → boleh impor `config/`, `types/`, `entities/`.
- `systems/power-ups/*` → **tidak boleh** impor `scenes/`.
- `scenes/Game.ts` → impor `systems/power-ups/*` (arah benar).

## Hal yang TIDAK dalam Scope

- Animasi sprite power-up asli (placeholder graphics).
- Drop rate berdasarkan wave/dificulty.
- Simpan status power-up ke `ProfileService` (belum ada).
- UI indikator power-up di HUD.

## Estimasi

12 file baru + 6 file diubah. Semua bisa dikerjakan paralel setelah plan ACC.

## Persetujuan

Mohon konfirmasi (ACC) sebelum saya mulai implementasi. Jika ada bagian yang ingin diubah, sampaikan sekarang.