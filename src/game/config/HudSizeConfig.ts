/**
 * Ukuran dan tata letak elemen HUD.
 * Satu-satunya sumber kebenaran untuk ukuran/posisi elemen UI;
 * UI dilarang menyimpan magic number untuk ukuran maupun koordinat.
 */
export const HudSizeConfig = {
    /** Jarak padding dalam panel kanan, dalam piksel. */
    rightPanelPadding: 24,

    /** Indikator HP. */
    hp: {
        /** Ukuran lingkaran ikon HP, dalam piksel. */
        iconSize: 24,
        /** Jarak antar ikon dan teks, dalam piksel. */
        gap: 8,
        /** Ukuran font teks jumlah nyawa. */
        fontSize: 28,
    },

    /** Kotak slot buff. */
    slot: {
        /** Ukuran kotak slot (persegi), dalam piksel. */
        size: 64,
        /** Jarak antar kotak slot, dalam piksel. */
        gap: 12,
        /** Padding di dalam kotak slot, dalam piksel. */
        padding: 8,
        /** Ketebalan border slot kosong, dalam piksel. */
        emptyBorderThickness: 20,
        /** Ketebalan border slot penuh stack, dalam piksel. */
        fullBorderThickness: 40,
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
    },

    /** Jarak vertikal antar komponen utama di panel kanan, dalam piksel. */
    sectionGap: 20,
} as const;
