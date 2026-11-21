# HUD System — Dokumentasi untuk Tim Designer

**Versi:** 1.0  
**Terakhir diupdate:** 2026-11-21  
**Target:** Tim Designer/UI — hanya menyentuh **UI Layer** (config + language files)

---

## 1. Arsitektur Singkat: Separation of Concerns

```
┌─────────────────────────────────────────────────────────────────┐
│                      GAME LOGIC LAYER                           │
│  (Scene Game, ScoreSystem, Player, PowerUpSlotManager, ...)     │
│                                                                 │
│  implements IHudGameSource  ──────────────────────────────────► │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA PROVIDER LAYER                         │
│  HudDataProvider (read-only, zero Phaser, zero allocation)      │
│                                                                 │
│  Getters: score, combo, multiplier, timer, lives, dash,        │
│           slots, buffs, gruntsActiveCount                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        UI LAYER (DESIGNER ZONE)                 │
│  HudManager → HudLeftPanel / HudRightPanel                      │
│                                                                 │
│  Hanya baca dari HudDataProvider + HudConfig + Language files   │
│  TIDAK ADA LOGIKA GAMEPLAY DI SINI                              │
└─────────────────────────────────────────────────────────────────┘
```

**Aturan emas:**  
Designer **hanya** menyentuk:
- `src/game/config/HudConfig.ts` — posisi, ukuran, warna, font
- `src/game/config/language/en.json` & `id.json` — teks label & value

---

## 2. HudConfig: Single Source of Truth untuk Tampilan

File: `src/game/config/HudConfig.ts`

Struktur **nested domain**:

```typescript
HudConfig = {
  label: {           // Shared kiri & kanan
    fontFamily,
    color,
    sectionFontSize
  },
  left: {            // Panel kiri: SKOR, COMBO, PENGALI, DASH
    padding, bgColor, sectionGap,
    score:   { x, y, labelFontSize, valueFontSize, valueColor, gapLabelValue },
    combo:   { x, y, labelFontSize, valueFontSize, valueColor, gapLabelValue,
               valueOffsetX, bar: { offsetX, offsetY, width, height, radius,
                                    bgColor, bgAlpha, fillColor } },
    multiplier: { x, y, labelFontSize, valueFontSize, valueColor, gapLabelValue },
    dash:    { x, y, labelFontSize, valueFontSize, gapLabelValue,
               statusOffsetX, readyColor, cooldownColor,
               bar: { offsetX, offsetY, width, height, radius,
                      bgColor, bgAlpha, fillColor } }
  },
  right: {           // Panel kanan: HP, SLOT, BUFF ROW
    padding, bgColor, sectionGap,
    hp:      { x, y, labelFontSize, iconSize, gap, valueFontSize, valueColor, valueOffsetY },
    slot:    { x, y, labelFontSize, rowOffsetY, size, gap, padding,
               borderThickness, borderColor, bgColor, bgAlpha,
               firstBoxOffsetX, boxOffsetY, buffLabelGap, keybindGap,
               keybindFontSize, keybindColor, stackFontSize, stackColor },
    buffRow: { x, y, labelFontSize, firstRowOffsetY, height, gap,
               iconSize, progressBarHeight, progressBarWidth, gapIconBar,
               barBgColor, barBgPausedColor, barBgPausedAlpha }
  }
}
```

### Cara memodifikasi (designer workflow)

| Ingin mengubah... | Ubah di `HudConfig` |
|-------------------|---------------------|
| Posisi panel kiri/kanan | `left.padding`, `right.padding` |
| Warna background panel | `left.bgColor`, `right.bgColor` |
| Jarak antar section (SKOR→COMBO→PENGALI→DASH) | `left.sectionGap`, `right.sectionGap` |
| Font family semua label | `label.fontFamily` |
| Warna label section (SKOR, COMBO, dll) | `label.color` |
| Ukuran font label section | `label.sectionFontSize` |
| Posisi & style komponen SKOR | `left.score.*` |
| Posisi & style komponen COMBO + bar timer | `left.combo.*` |
| Posisi & style komponen PENGALI | `left.multiplier.*` |
| Posisi & style komponen DASH + bar cooldown | `left.dash.*` |
| Posisi & style HP (ikon + teks) | `right.hp.*` |
| Posisi & style 3 kotak SLOT | `right.slot.*` |
| Posisi & style daftar BUFF AKTIF | `right.buffRow.*` |

> **Catatan penting:** Property `x` dan `y` di setiap komponen **relatif terhadap padding panel**.  
> `y` beberapa komponen (`combo`, `multiplier`, `dash`, `slot`, `buffRow`) dihitung **otomatis di runtime** berdasarkan tinggi komponen sebelumnya + `sectionGap`.  
> Jadi **jangan set `y` manual** di config untuk komponen tersebut — biarkan `0`, sistem akan override.

---

## 3. Language System: Cara Ganti Teks Tanpa Sentuh Code

File:  
- `src/game/config/language/en.json` (English)  
- `src/game/config/language/id.json` (Indonesian)

### Translation keys untuk HUD

| Key | EN Default | ID Default | Dipakai di |
|-----|------------|------------|------------|
| `hud.left.score_label` | "SCORE" | "SKOR" | Label SKOR |
| `hud.left.combo_label` | "COMBO" | "COMBO" | Label COMBO |
| `hud.left.multiplier_label` | "MULTIPLIER" | "PENGALI" | Label PENGALI |
| `hud.left.dash_label` | "DASH" | "DASH" | Label DASH |
| `hud.left.dash_ready` | "READY" | "SIAP" | Status DASH siap |
| `hud.right.hp_label` | "HP" | "HP" | Label HP |
| `hud.right.hp_value` | `"{lives}x"` | `"{lives}x"` | Value HP (param `lives`) |
| `hud.right.slot_label` | "SLOT" | "SLOT" | Label SLOT |
| `hud.right.buff_label` | "ACTIVE BUFFS" | "BUFF AKTIF" | Label BUFF AKTIF |

### Cara menambah/ubah teks

1. Buka `en.json` dan `id.json`
2. Tambah/edit key dengan prefix `hud.left.` atau `hud.right.`
3. Gunakan placeholder `{paramName}` untuk nilai dinamis (contoh: `{lives}`)
4. **Tidak perlu rebuild/restart** — ganti bahasa lewat debug key (F1–F4) atau ganti `localStorage` → teks update realtime via event `LANGUAGE_CHANGED`

### Fallback chain
```
active language (en/id) → fallback (LanguageConfig.fallbackLanguage = 'en') → raw key
```
Jika key tidak ditemukan di kedua file, **key mentah akan ditampilkan** (debugging mudah).

---

## 4. TranslatedText: Komponen Teks Otomatis Terjemahan

File: `src/game/ui/TranslatedText.ts` (extends `Phaser.GameObjects.Text`)

### Behavior
- Konstruktor: `new TranslatedText(scene, x, y, key, params?, style?)`
- **Sudah otomatis `scene.add.existing(this)`** — jangan `add` manual
- Listen event `LANGUAGE_CHANGED` → auto `refresh()`
- Cleanup listener saat scene `SHUTDOWN` / `destroy()`

### Method yang relevan untuk UI
| Method | Fungsi |
|--------|--------|
| `setKey(key, params?)` | Ganti key + params, trigger re-render |
| `setParams(params)` | Ganti semua params, trigger re-render |
| `setParam(name, value)` | Ganti 1 param (skip kalau nilai sama), trigger re-render |
| `refresh()` | Paksa re-render dari LanguageManager |

### Contoh penggunaan di panel
```typescript
// Label statis (tidak pernah berubah params)
this.scoreLabel = new TranslatedText(scene, x, y, 'hud.left.score_label', undefined, style);

// Value dinamis (update tiap frame via setParam)
this.hpText = new TranslatedText(scene, x, y, 'hud.right.hp_value', { lives: 0 }, style);
// Di update(): this.hpText.setParam('lives', provider.lives);

// Status berubah key (DASH ready/cooldown)
this.dashStatus = new TranslatedText(scene, x, y, 'hud.left.dash_ready', undefined, style);
// Di update():
if (ready) this.dashStatus.setKey('hud.left.dash_ready');
else this.dashStatus.setText(`${seconds}s`); // angka manual, bukan translation key
```

> **⚠️ Gotcha:** `setText()` **bukan** translation-aware — pakai `setKey()` untuk key terjemahan.  
> (Ini penyebab bug "muncul key mentah" yang baru diperbaiki di `HudLeftPanel.ts:272`)

---

## 5. Menambah Komponen Baru ke HUD (Checklist Designer + Dev)

### Jika hanya butuh label/value statis/dinamis (designer bisa 90%)
1. Tambah key di `en.json` & `id.json`
2. Tambah config di `HudConfig.left` atau `HudConfig.right` (copy pattern yang ada)
3. Di panel (`HudLeftPanel`/`HudRightPanel`):
   - Buat `TranslatedText` baru di constructor
   - Update di `update()` via `setKey()` / `setParam()`
4. **Done** — tidak perlu sentuh `HudDataProvider` / `IHudGameSource`

### Jika butuh data gameplay baru (perlu dev)
1. Dev tambah getter di `IHudGameSource` (interface)
2. Dev implement di `Game.ts` (scene)
3. Dev tambah getter di `HudDataProvider` (baca dari source)
4. Designer lanjut step 1–3 di atas

### Jika butuh komponen visual kompleks (bar, icon, dll)
- Pattern: buat class terpisah (contoh: `PowerUpSlotBox`, `ActiveBuffRow`) yang extend `Container`
- Terima config dari `HudConfig` + data dari `HudDataProvider` via method `setBuffData()`, `setFilled()`, dll
- Panel instantiate & add ke container

---

## 6. Gotchas & Best Practices

| Issue | Penyebab | Solusi |
|-------|----------|--------|
| Teks muncul key mentah (`hud.left.dash_ready`) | Pakai `setText(key)` bukan `setKey(key)` | Selalu pakai `setKey()` untuk translation key |
| Warna teks tidak berubah | Phaser Text butuh string `#RRGGBB`, config pakai `0xRRGGBB` | Gunakan helper `colorToHex(0xRRGGBB)` → `'#RRGGBB'` |
| Posisi Y komponen aneh | `y` di config ditimpa runtime calculation | Biarkan `y: 0` untuk combo/multiplier/dash/slot/buffRow |
| Bar progress tidak muncul | `Graphics` position salah / `fillWidth` 0 | `setPosition(x, y)` pada fill graphics, draw dari `0,0` |
| Translation tidak update realtime | `LanguageManager` belum `attachEvents(game.events)` | Pastikan `Boot.ts` / `Game.ts` call `attachEvents` sebelum scene HUD dibuat |
| Font tidak load | `fontFamily` tidak ada di sistem / typo | Pakai font web-safe (`Arial`, `Verdana`) atau load custom font via `WebFontLoader` |
| Slot/Buff row tidak center | `firstBoxOffsetX` hardcoded | Config sudah punya `firstBoxOffsetX` untuk fine-tune center |

---

## 7. File Reference Cepat

| File | Layer | Boleh Edit Designer? |
|------|-------|---------------------|
| `src/game/config/HudConfig.ts` | UI Config | ✅ **YA** (utama) |
| `src/game/config/language/en.json` | Language | ✅ **YA** |
| `src/game/config/language/id.json` | Language | ✅ **YA** |
| `src/game/ui/HudLeftPanel.ts` | UI Logic | ⚠️ Hanya tambah komponen (copy pattern) |
| `src/game/ui/HudRightPanel.ts` | UI Logic | ⚠️ Hanya tambah komponen (copy pattern) |
| `src/game/ui/TranslatedText.ts` | UI Core | ❌ **TIDAK** |
| `src/game/systems/HudDataProvider.ts` | Data Provider | ❌ **TIDAK** |
| `src/game/systems/IHudGameSource.ts` | Contract | ❌ **TIDAK** |
| `src/game/systems/LanguageManager.ts` | Language Core | ❌ **TIDAK** |
| `src/game/scenes/Game.ts` | Game Logic | ❌ **TIDAK** |
| `src/game/scenes/Hud.ts` | Scene Setup | ❌ **TIDAK** |

---

## 8. Quick Start: Ganti Warna & Posisi SKOR (Contoh)

```typescript
// HudConfig.ts
left: {
  score: {
    x: 0,           // dari padding kiri
    y: 0,           // sudah benar (paling atas)
    labelFontSize: 24,
    valueFontSize: 28,
    valueColor: '#ffd700',  // ganti jadi emas
    gapLabelValue: 4,
  },
  // ...
}
```

```json
// en.json
"hud.left.score_label": "SCORE",
// id.json
"hud.left.score_label": "SKOR",
```

Reload game → SKOR berwarna emas, label sesuai bahasa.

---

## 9. Debug Hotkeys (untuk testing)

| Key | Aksi |
|-----|------|
| F1–F4 | Ganti bahasa (cycle en/id/...) |
| F5 | Toggle ScoreDebug overlay |
| Q/W/E | Simulasi kill common/elite/boss |
| R | Simulasi laser bonus |
| T | Simulasi ram bonus |
| Y | Simulasi graze |
| U | Simulasi player hit |
| I | Simulasi nuke ×10 |
| O | Simulasi nuke ×60 |
| P | Reset score system |

---

**Dokumen ini di-maintain oleh tim dev. Jika ada config yang butuh ditambah/ubah tapi tidak ada di sini, minta ke dev untuk extend `HudConfig` + `HudDataProvider`.**