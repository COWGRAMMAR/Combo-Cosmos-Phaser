/**
 * Tampilan HUD gameplay: warna panel, gaya teks, ukuran, dan posisi tiap komponen.
 * Satu-satunya sumber kebenaran untuk seluruh tampilan HUD; komponen UI
 * tidak boleh menyimpan magic number ukuran, posisi, maupun warna.
 * Struktur: domain panel (left/right) → domain komponen (score/combo/dash dll) → properti + posisi x,y.
 */
export const HudConfig = {
    /** Gaya teks label HUD (shared kiri & kanan). */
    label: {
        /** Font keluarga untuk seluruh teks HUD. */
        fontFamily: 'Arial' as const,
        /** Warna teks label section. */
        color: '#94a3b8' as const,
        /** Ukuran font label section ('SKOR', 'COMBO', 'PENGALI', 'DASH', 'HP', 'SLOT', 'BUFF AKTIF'). */
        sectionFontSize: 30,
    },

    // ============================================================
    // PANEL KIRI: SKOR, COMBO, PENGALI, DASH
    // ============================================================
    left: {
        /** Padding konten dari tepi panel kiri. */
        padding: 24,
        /** Warna latar panel kiri. */
        bgColor: 0x111827,
        /** Jarak vertikal antar section (SKOR → COMBO → PENGALI → DASH). */
        sectionGap: 18,

        /** Komponen SKOR. */
        score: {
            /** Posisi label 'SKOR' (relatif ke padding kiri). */
            x: 0,
            y: 0,
            /** Ukuran font label. */
            labelFontSize: 24,
            /** Ukuran font nilai skor. */
            valueFontSize: 28,
            /** Warna teks nilai. */
            valueColor: '#ffffff' as const,
            /** Jarak label ke nilai (vertikal). */
            gapLabelValue: 4,
        },

        /** Komponen COMBO. */
        combo: {
            /** Posisi label 'COMBO'. */
            x: 0,
            y: 0, // di-set runtime: di bawah score
            /** Ukuran font label. */
            labelFontSize: 24,
            /** Ukuran font nilai combo (xN). */
            valueFontSize: 28,
            /** Warna teks nilai. */
            valueColor: '#ffffff' as const,
            /** Jarak label ke nilai (vertikal). */
            gapLabelValue: 4,
            /** Offset horizontal nilai dari label (untuk 'x' + angka). */
            valueOffsetX: 0,
            /** Progress bar timer combo. */
            bar: {
                /** Offset horizontal bar dari label. */
                offsetX: 80,
                /** Offset vertikal bar dari label (supaya center dengan value). */
                offsetY: 0,
                /** Lebar bar. */
                width: 200,
                /** Tinggi bar. */
                height: 8,
                /** Radius sudut bar. */
                radius: 4,
                /** Warna latar bar. */
                bgColor: 0x334155,
                /** Transparansi latar bar. */
                bgAlpha: 0.5,
                /** Warna isi bar (hijau). */
                fillColor: 0x22c55e,
            },
        },

        /** Komponen PENGALI (multiplier). */
        multiplier: {
            /** Posisi label 'PENGALI'. */
            x: 0,
            y: 0, // di-set runtime: di bawah combo
            /** Ukuran font label. */
            labelFontSize: 24,
            /** Ukuran font nilai pengali. */
            valueFontSize: 28,
            /** Warna teks nilai. */
            valueColor: '#ffffff' as const,
            /** Jarak label ke nilai (vertikal). */
            gapLabelValue: 4,
        },

        /** Komponen DASH. */
        dash: {
            /** Posisi label 'DASH'. */
            x: 0,
            y: 0, // di-set runtime: di bawah multiplier
            /** Ukuran font label. */
            labelFontSize: 24,
            /** Ukuran font status/teks nilai. */
            valueFontSize: 28,
            /** Jarak label ke status (vertikal). */
            gapLabelValue: 4,
            /** Offset horizontal status dari label. */
            statusOffsetX: 0,
            /** Warna teks status siap (hijau). */
            readyColor: 0x22c55e,
            /** Warna teks status cooldown (merah). */
            cooldownColor: 0xef4444,
            /** Progress bar cooldown dash. */
            bar: {
                /** Offset horizontal bar dari label. */
                offsetX: 100,
                /** Offset vertikal bar dari label (supaya center dengan status). */
                offsetY: 0,
                /** Lebar bar. */
                width: 200,
                /** Tinggi bar. */
                height: 8,
                /** Radius sudut bar. */
                radius: 4,
                /** Warna latar bar. */
                bgColor: 0x334155,
                /** Transparansi latar bar. */
                bgAlpha: 0.5,
                /** Warna isi bar (biru). */
                fillColor: 0x3b82f6,
            },
        },
    } as const,

    // ============================================================
    // PANEL KANAN: HP, SLOT, BUFF ROW
    // ============================================================
    right: {
        /** Padding konten dari tepi panel kanan. */
        padding: 24,
        /** Warna latar panel kanan. */
        bgColor: 0x1f2937,
        /** Jarak vertikal antar section (HP → SLOT → BUFF AKTIF). */
        sectionGap: 18,

        /** Komponen HP. */
        hp: {
            /** Posisi label 'HP'. */
            x: 0,
            y: 0,
            /** Ukuran font label. */
            labelFontSize: 30,
            /** Ukuran lingkaran ikon HP. */
            iconSize: 34,
            /** Jarak ikon ke teks nilai. */
            gap: 10,
            /** Ukuran font teks jumlah nyawa. */
            valueFontSize: 30,
            /** Warna teks jumlah nyawa. */
            valueColor: '#ffffff' as const,
            /** Offset vertikal baris ikon+nilai dari label. */
            valueOffsetY: 8,
        },

        /** Komponen SLOT (3 kotak horizontal). */
        slot: {
            /** Posisi label 'SLOT'. */
            x: 0,
            y: 0, // di-set runtime: di bawah hp
            /** Ukuran font label. */
            labelFontSize: 30,
            /** Offset vertikal baris kotak dari label. */
            rowOffsetY: 50,
            /** Ukuran kotak slot (persegi). */
            size: 64,
            /** Jarak antar kotak slot. */
            gap: 18,
            /** Padding di dalam kotak slot. */
            padding: 8,
            /** Ketebalan border slot. */
            borderThickness: 12,
            /** Warna border slot. */
            borderColor: 0x64748b,
            /** Warna latar kotak slot. */
            bgColor: 0x334155,
            /** Transparansi latar kotak slot. */
            bgAlpha: 0.5,
            /** Offset horizontal kotak pertama dari kiri (center dalam panel). */
            firstBoxOffsetX: -105,
            /** Offset vertikal kotak dari label (center). */
            boxOffsetY: 0,
            /** Jarak bawah kotak (termasuk keybind) ke label 'BUFF AKTIF'. */
            buffLabelGap: 64,
            /** Jarak bawah kotak ke teks keybind. */
            keybindGap: 4,
            /** Ukuran font teks keybind. */
            keybindFontSize: 22,
            /** Warna teks keybind. */
            keybindColor: '#e2e8f0' as const,
            /** Ukuran font angka stack. */
            stackFontSize: 20,
            /** Warna angka stack. */
            stackColor: '#ffffff' as const,
        },

        /** Komponen BUFF AKTIF (daftar baris progress bar). */
        buffRow: {
            /** Posisi label 'BUFF AKTIF'. */
            x: 0,
            y: 0, // di-set runtime: di bawah slot
            /** Ukuran font label. */
            labelFontSize: 30,
            /** Offset vertikal baris pertama dari label. */
            firstRowOffsetY: 72,
            /** Tinggi satu baris. */
            height: 30,
            /** Jarak antar baris. */
            gap: 8,
            /** Ukuran lingkaran ikon buff. */
            iconSize: 24,
            /** Tinggi progress bar. */
            progressBarHeight: 8,
            /** Lebar progress bar penuh. */
            progressBarWidth: 200,
            /** Jarak ikon ke progress bar. */
            gapIconBar: 8,
            /** Warna latar progress bar. */
            barBgColor: 0x334155,
            /** Warna latar progress bar saat pause. */
            barBgPausedColor: 0x475569,
            /** Transparansi latar progress bar saat pause. */
            barBgPausedAlpha: 0.5,
        },
    } as const,
} as const;

// ============================================================
// Type helpers untuk autocomplete & type safety
// ============================================================
export type HudLabelConfig = typeof HudConfig.label;
export type HudLeftConfig = typeof HudConfig.left;
export type HudRightConfig = typeof HudConfig.right;
export type HudLeftScoreConfig = typeof HudConfig.left.score;
export type HudLeftComboConfig = typeof HudConfig.left.combo;
export type HudLeftMultiplierConfig = typeof HudConfig.left.multiplier;
export type HudLeftDashConfig = typeof HudConfig.left.dash;
export type HudRightHpConfig = typeof HudConfig.right.hp;
export type HudRightSlotConfig = typeof HudConfig.right.slot;
export type HudRightBuffRowConfig = typeof HudConfig.right.buffRow;