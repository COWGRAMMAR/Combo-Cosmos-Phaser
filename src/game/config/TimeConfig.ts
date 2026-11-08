/**
 * Konfigurasi waktu game.
 * Delta dibatasi agar lonjakan frame tidak membuat objek melompat jauh,
 * sementara FPS dibatasi di sisi Phaser agar konsisten dengan target FPS.
 */
export const TimeConfig = {
    /** FPS target untuk perhitungan waktu Phaser. */
    targetFps: 60,
    /** Batas atas FPS yang benar-benar dijalankan. */
    maxFps: 0,
    /** FPS minimum; delta maksimum diturunkan dari nilai ini. */
    minFps: 30,

    /** Langkah waktu tetap untuk logika gameplay (1 frame pada 60 FPS), dalam milidetik. */
    fixedStepMs: 1000 / 60,
    /** Batas maksimal akumulasi delta untuk mencegah spiral of death saat frame lonjak besar. */
    maxAccumulatorMs: 100,
    /** Batas jumlah fixed-step yang dijalankan dalam satu frame, mencegah game ngebut setelah lag. */
    maxStepsPerFrame: 4
} as const;
