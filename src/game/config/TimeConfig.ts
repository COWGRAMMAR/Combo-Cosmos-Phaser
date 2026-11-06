/**
 * Konfigurasi waktu game.
 * Delta dibatasi agar lonjakan frame tidak membuat objek melompat jauh,
 * sementara FPS dibatasi di sisi Phaser agar monitor 144 Hz tetap 60 FPS.
 */
export const TimeConfig = {
    /** FPS target untuk perhitungan waktu Phaser. */
    targetFps: 60,
    /** Batas atas FPS yang benar-benar dijalankan. */
    maxFps: 60,
    /** FPS minimum; delta maksimum diturunkan dari nilai ini. */
    minFps: 30,
    /** Delta maksimum yang boleh masuk ke sistem gameplay, dalam milidetik. */
    maxDeltaMs: 33.333
} as const;
