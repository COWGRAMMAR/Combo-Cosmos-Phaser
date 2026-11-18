/**
 * Tampilan HUD gameplay: warna panel, gaya teks, ukuran, dan offset tata letak.
 * Satu-satunya sumber kebenaran untuk seluruh tampilan HUD; komponen UI
 * tidak boleh menyimpan magic number ukuran, posisi, maupun warna.
 */
export const HudConfig = {
    /** Panel kiri dan kanan HUD. */
    panel: {
        /** Jarak konten dari tepi panel, dalam piksel. */
        padding: 24,
        /** Warna latar panel kiri. */
        leftColor: 0x111827,
        /** Warna latar panel kanan. */
        rightColor: 0x1f2937,
        /** Judul sementara panel kiri. */
        leftTitle: 'HUD KIRI',
    },

    /** Gaya teks label HUD. */
    label: {
        /** Font keluarga untuk seluruh teks HUD. */
        fontFamily: 'Arial',
        /** Warna teks label section. */
        color: '#94a3b8',
        /** Ukuran font judul panel. */
        titleFontSize: 28,
        /** Ukuran font label section ('HP', 'SLOT', 'BUFF AKTIF'). */
        sectionFontSize: 30,
    },

    /** Indikator HP. */
    hp: {
        /** Ukuran lingkaran ikon HP, dalam piksel. */
        iconSize: 34,
        /** Jarak antar ikon dan teks, dalam piksel. */
        gap: 10,
        /** Ukuran font teks jumlah nyawa. */
        fontSize: 30,
        /** Warna teks jumlah nyawa. */
        valueColor: '#ffffff',
        /** Jarak label 'HP' ke baris ikon/teks nilai, dalam piksel. */
        valueOffsetY: 8,
    },

    /** Kotak slot buff, disusun horizontal. */
    slot: {
        /** Ukuran kotak slot (persegi), dalam piksel. */
        size: 64,
        /** Jarak antar kotak slot, dalam piksel. */
        gap: 18,
        /** Padding di dalam kotak slot, dalam piksel. */
        padding: 8,
        /** Ketebalan border slot, dalam piksel. */
        borderThickness: 12,
        /** Warna border slot kosong maupun terisi. */
        borderColor: 0x64748b,
        /** Warna latar kotak slot. */
        bgColor: 0x334155,
        /** Transparansi latar kotak slot. */
        bgAlpha: 0.5,
        /** Jarak bawah blok HP ke label 'SLOT', dalam piksel. */
        labelOffsetY: 90,
        /** Jarak label 'SLOT' ke baris kotak, dalam piksel. */
        rowGap: 50,
        /** Jarak bawah kotak (termasuk keybind) ke label 'BUFF AKTIF', dalam piksel. */
        buffLabelGap: 64,
        /** Jarak bawah kotak ke teks keybind, dalam piksel. */
        keybindGap: 4,
        /** Ukuran font teks keybind. */
        keybindFontSize: 22,
        /** Warna teks keybind. */
        keybindColor: '#e2e8f0',
        /** Ukuran font angka stack. */
        stackFontSize: 20,
        /** Warna angka stack. */
        stackColor: '#ffffff',
    },

    /** Baris durasi buff aktif. */
    buffRow: {
        /** Tinggi satu baris, dalam piksel. */
        height: 30,
        /** Jarak antar baris, dalam piksel. */
        gap: 8,
        /** Ukuran lingkaran ikon buff, dalam piksel. */
        iconSize: 24,
        /** Tinggi progress bar, dalam piksel. */
        progressBarHeight: 8,
        /** Lebar progress bar penuh, dalam piksel. */
        progressBarWidth: 200,
        /** Jarak antar ikon dan progress bar, dalam piksel. */
        gapIconBar: 8,
        /** Jarak label 'BUFF AKTIF' ke baris pertama, dalam piksel. */
        labelGap: 72,
        /** Warna latar progress bar. */
        barBgColor: 0x334155,
        /** Warna latar progress bar saat pause. */
        barBgPausedColor: 0x475569,
        /** Transparansi latar progress bar saat pause. */
        barBgPausedAlpha: 0.5,
    },
} as const;
