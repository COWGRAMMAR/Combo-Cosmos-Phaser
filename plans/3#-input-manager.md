# Rencana Input Manager — Combo-Cosmos-Phaser

- **Status:** ACC — dieksekusi 2026-11-05
- **Tanggal:** 2026-11-05
- **Struktur folder:** lihat `doc/struktur-file.md` (sumber kebenaran struktur file)
- **Scope:** abstraksi input pemain, migrasi movement Player, dan dokumentasi arsitektur untuk dilanjutkan.
- **Tidak termasuk:** shooting, HUD, settings UI, persistence keybind, gamepad, touch.

---

## 0. Tujuan

1. Menghapus keybind hardcoded dari `Player`.
2. Menyediakan satu titik mapping tombol fisik ke aksi semantik.
3. Menyiapkan `rebind()` untuk fitur settings di masa depan.
4. Menjaga arah dependensi: `entities` tidak boleh import `systems`.
5. Menjadikan binding sebagai data murni di folder `config/`.

Hasil sesi ini: movement tetap berjalan sama seperti sebelumnya (WASD + arrow, diagonal dinormalisasi), tetapi `Player` hanya tahu `IInputSource`. Tombol `Fire` sudah terikat di `InputManager` walau belum dipakai shooting.

---

## 1. Keputusan desain

| Keputusan | Nilai | Alasan singkat |
| --- | --- | --- |
| Model input | Action-based, bukan key-based | Entity tidak tahu tombol fisik dan bisa rebind |
| Multi-key per action | Didukung | `MoveUp` bisa `UP` dan `W` sekaligus |
| Kontrak input | `IInputSource` di `types/` | `entities` boleh import `types`, tidak boleh import `systems` |
| Implementasi | `InputManager` di `systems/` | Membungkus `Phaser.Input.Keyboard.KeyboardPlugin` |
| Binding default | `config/InputBindings.ts` | Data-driven, bisa dioverride tanpa ubah logika |
| Pemberian dependency | Constructor injection dari scene | Eksplisit, testable, lifecycle jelas |
| `Fire` | Diikat sekarang | Siap dipakai Fase 3 tanpa mengubah manager |
| `rebind()` | Masuk sekarang | Tujuan awal mengganti sistem keybind hardcoded |
| Settings UI / persistence | Ditunda | Butuh scene dan storage terpisah |

---

## 2. Arsitektur dan arah dependensi

```
Game (scenes)
 ├─ new InputManager(scene, bindings?)        // systems
 ├─ new Player(..., inputSource)              // entities
 └─ destroy InputManager saat scene shutdown

InputManager (systems)
 ├─ implements IInputSource                   // types
 ├─ reads InputAction                         // types
 ├─ reads DEFAULT_INPUT_BINDINGS              // config
 └─ wraps Phaser KeyboardPlugin

Player (entities)
 ├─ reads InputAction                         // types
 └─ reads IInputSource                        // types
```

Arah yang dijaga:

```
scenes → systems → entities → types / utils / config
```

`types` adalah lapisan paling bawah. `types` tidak boleh import `config`, `systems`, `entities`, atau `scenes`. `config` boleh import `types`, tetapi tidak boleh import layer di atasnya.

### 2.1 Kenapa `InputAction.ts` di `types/`

- Ini kosakata domain, bukan nilai tuning. `config` memakainya untuk mapping, `systems` untuk implementasi, `entities` untuk konsumsi.
- Kalau ditaruh di `config`, `IInputSource` (types) harus import `config`, sehingga `types` tidak lagi jadi lapisan terbawah.
- Semua enum di repo wajib string enum, nilai kebab-case.

### 2.2 Kenapa `IInputSource.ts` di `types/`

- Interface adalah kontrak, bukan data. Folder `config/` tetap murni data.
- Tanpa import Phaser, sehingga `Player` dan test tidak bergantung pada keyboard plugin.
- Implementasi bisa diganti tanpa mengubah entity: keyboard, gamepad, touch, replay, fake.

### 2.3 Kenapa injection, bukan referensi langsung

| Alternatif | Kenapa ditolak |
| --- | --- |
| `Player` import `InputManager` | Melanggar `entities → systems`; entity jadi bergantung pada Phaser keyboard dan sulit dites |
| `Player` pakai `scene.input.keyboard` | Itu kondisi hardcoded yang sedang dibuang; tidak bisa rebind |
| Singleton global | Hidden dependency, urutan init tidak jelas, key bocor antar scene, test saling ganggu |
| Service locator | Coupling tetap implicit, hanya dipindah ke lookup |
| Event bus untuk movement | Kehilangan polling state per frame; wiring lifecycle lebih rumit untuk kebutuhan sederhana ini |

Constructor injection membuat dependency terlihat di signature, dicek compiler, dan bisa diganti implementasinya. Scene tetap pemilik resource Phaser, jadi scene yang membuat dan menghancurkan manager.

---

## 3. File yang ditambah dan diubah

### Baru

| File | Isi |
| --- | --- |
| `src/game/types/InputAction.ts` | String enum 5 aksi |
| `src/game/types/IInputSource.ts` | Interface `isDown`, `isJustDown`, `getAxis` |
| `src/game/config/InputBindings.ts` | `InputBindingMap` + `DEFAULT_INPUT_BINDINGS` |
| `src/game/systems/InputManager.ts` | Implementasi keyboard, rebind, refcount, destroy |
| `plans/3#-input-manager.md` | Dokumen ini |

### Diubah

| File | Perubahan |
| --- | --- |
| `src/game/entities/player/Player.ts` | Hapus `cursors` + `keyW/A/S/D`; constructor terima `IInputSource`; `updateEntity` pakai `getAxis` |
| `src/game/scenes/Game.ts` | Buat `InputManager`, inject ke `Player`, destroy saat shutdown |
| `AGENTS.md` | Tambah aturan arsitektur data-driven |
| `doc/struktur-file.md` | Update status, tree, dan aturan data-driven |

---

## 4. API

### 4.1 `InputAction`

```ts
export enum InputAction
{
    MoveUp = 'move-up',
    MoveDown = 'move-down',
    MoveLeft = 'move-left',
    MoveRight = 'move-right',
    Fire = 'fire'
}
```

### 4.2 `IInputSource`

```ts
export interface IInputSource
{
    isDown(action: InputAction): boolean;
    isJustDown(action: InputAction): boolean;
    getAxis(negative: InputAction, positive: InputAction): number;
}
```

- `getAxis` mengembalikan `-1`, `0`, atau `1`.
- Jika dua action pada axis yang sama ditekan bersamaan, hasilnya `0` (netral).
- Normalisasi diagonal tetap tanggung jawab `Player`, bukan sumber input.

### 4.3 `InputBindings`

```ts
export type InputBindingMap = Readonly<Record<InputAction, readonly string[]>>;

export const DEFAULT_INPUT_BINDINGS = {
    [InputAction.MoveUp]: ['UP', 'W'],
    [InputAction.MoveDown]: ['DOWN', 'S'],
    [InputAction.MoveLeft]: ['LEFT', 'A'],
    [InputAction.MoveRight]: ['RIGHT', 'D'],
    [InputAction.Fire]: ['SPACE']
} as const satisfies InputBindingMap;
```

Nama tombol memakai string yang dikenali `KeyboardPlugin.addKey` (`UP`, `W`, `SPACE`, dan seterusnya).

### 4.4 `InputManager`

```ts
class InputManager implements IInputSource
{
    constructor(scene: Phaser.Scene, bindings?: InputBindingMap);

    isDown(action: InputAction): boolean;
    isJustDown(action: InputAction): boolean;
    getAxis(negative: InputAction, positive: InputAction): number;

    rebind(action: InputAction, keyNames: readonly string[]): void;
    getBinding(action: InputAction): readonly string[];

    destroy(): void;
}
```

- Constructor menerima override binding untuk masa depan (settings/persistence).
- `rebind` menghapus binding lama action tersebut, lalu memasang yang baru.
- `getBinding` mengembalikan salinan nama tombol aktif, untuk ditampilkan di settings nanti.
- `destroy` melepas semua `Key` yang dikelola manager.

---

## 5. Binding default

| Action | Tombol |
| --- | --- |
| `MoveUp` | `UP`, `W` |
| `MoveDown` | `DOWN`, `S` |
| `MoveLeft` | `LEFT`, `A` |
| `MoveRight` | `RIGHT`, `D` |
| `Fire` | `SPACE` |

`Fire` terikat tetapi belum dikonsumsi `Player` di sesi ini.

---

## 6. Alur per frame

1. `Game.create()` membuat `InputManager` sekali.
2. `InputManager` mendaftarkan semua `Key` dari binding.
3. `Player.updateEntity()` memanggil:
   - `getAxis(MoveLeft, MoveRight)` untuk sumbu X.
   - `getAxis(MoveUp, MoveDown)` untuk sumbu Y.
4. `Player` membuat `Phaser.Math.Vector2`, menormalisasi bila panjang > 0, lalu `scale(moveSpeed)`.
5. `setVelocity` dipanggil setiap frame; tanpa input hasilnya `(0, 0)` sehingga pemain berhenti.

---

## 7. Rebind dan kepemilikan `Key`

`KeyboardPlugin.keys` di-index berdasarkan keyCode, sehingga `addKey` dengan tombol yang sama mengembalikan object `Key` yang sama. Karena itu manager memakai refcount:

- `Map<InputAction, Key[]>` menyimpan key per action.
- `Map<keyCode, { key, count }>` menyimpan jumlah action yang memakai key tersebut.
- Saat bind: `addKey`, lalu `count++`.
- Saat unbind/rebind: `count--`; `removeKey` hanya dipanggil jika `count` mencapai 0.
- Nama tombol duplikat dalam satu action di-dedupe.

Konsekuensi yang harus diketahui:

1. `InputManager` menganggap dirinya pemilik key yang ia daftarkan. Jangan mendaftarkan key yang sama lewat jalur lain tanpa memperhitungkan refcount.
2. `Phaser.Input.Keyboard.JustDown` mengonsumsi flag `justDown`. Jika satu keyCode dipakai dua action dan keduanya memanggil `isJustDown` di frame yang sama, panggilan kedua bisa `false`. Binding default tidak berbagi keyCode antar action, jadi aman. Jika nanti ada sharing, ganti ke pelacakan event per frame.

---

## 8. Aturan data-driven

Rencana ini mengikuti aturan yang ditambahkan ke `AGENTS.md` dan `doc/struktur-file.md`:

- Semua nilai yang bisa di-tuning masuk `src/game/config/`.
- `config/` hanya data murni (`as const`), tanpa logika, object Phaser, atau side effect.
- `config/` boleh import `types/` saja.
- `types/` adalah lapisan terbawah dan tidak boleh import layer lain.
- Nilai runtime seperti `hp`, `score`, dan `combo` bukan config.
- `scenes/`, `entities/`, `systems/` tidak boleh menyimpan magic number/string untuk nilai yang bisa di-tuning.

Contoh yang sudah data-driven: `Balance`, `AssetKeys`, `GameEvents`, dan sekarang `InputBindings`.

---

## 9. Integrasi `Game.ts`

- `InputManager` dibuat sebelum `Player`.
- Instance dioper sebagai parameter terakhir constructor `Player`.
- `Game` mendaftarkan listener `shutdown` untuk memanggil `destroy()`.
- Jika scene berhenti dan restart, `Key` lama tidak tertinggal.

---

## 10. Kriteria selesai

1. `npx tsc --noEmit` bersih.
2. `npm run dev` menampilkan scene seperti sebelumnya.
3. WASD dan arrow tetap menggerakkan pemain empat arah.
4. Diagonal tetap tidak lebih cepat dari gerakan lurus.
5. Pemain berhenti saat tidak ada input dan tetap clamp di bounds.
6. Tidak ada error console.
7. `Fire` terdaftar di binding dan bisa dicek lewat `isDown(InputAction.Fire)`, walau belum memicu tembakan.
8. `rebind()` bisa dipanggil tanpa meninggalkan `Key` lama.
9. Scene shutdown tidak meninggalkan key aktif.
10. `doc/struktur-file.md` sudah memuat file baru.

---

## 11. Rencana lanjutan (di luar sesi ini)

1. **Shooting (Fase 3):** `Player.attack()` memakai `isDown(Fire)` dan cooldown dari `Balance`.
2. **Settings scene:** tampilkan `getBinding`, panggil `rebind`, simpan ke `localStorage`.
3. **Gamepad:** `GamepadInputSource implements IInputSource`.
4. **Touch:** `TouchInputSource implements IInputSource`, tombol virtual di HUD.
5. **Skill:** action baru `Skill1`, `Skill2`, dan seterusnya, cukup ditambah di enum + binding.
6. **Pause/menu:** manager yang sama bisa dipakai scene lain selama lifecycle-nya dikelola.

---

## 12. Catatan untuk yang melanjutkan

- Jangan import `InputManager` dari folder `entities`; gunakan `IInputSource`.
- Jangan menaruh nama tombol fisik di `Player` atau entity lain.
- Tambah action baru dengan urutan: `types/InputAction.ts` → `config/InputBindings.ts` → konsumen.
- Setiap file baru wajib dicatat di `doc/struktur-file.md`.
- Jika binding dipersist, validasi nama tombol sebelum `addKey` dan sediakan fallback ke default.
