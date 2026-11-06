/** Konfigurasi tingkat dunia: tampilan latar dan saklar debug. */
export const WorldConfig = {
    background: {
        color: 0x1b5e20
    },
    debug: {
        enabled: true
    },
    /** Jeda sebelum scene GameOver tampil, dalam milidetik. */
    gameOverDelayMs: 600,
    /** Garis bantu batas play area; sementara untuk verifikasi. TEMP */
    playAreaFrame: {
        color: 0xffffff,
        alpha: 0.25,
        thickness: 2
    }
} as const;
