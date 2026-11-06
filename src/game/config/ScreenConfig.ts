/**
 * Satu-satunya sumber kebenaran ukuran canvas dan tata letak layar.
 * Semua koordinat gameplay memakai ruang lokal play area (0..810 x 0..1080).
 */
export const ScreenConfig = {
    /** Lebar canvas internal, dalam piksel. */
    width: 1920,
    /** Tinggi canvas internal, dalam piksel. */
    height: 1080,
    /** Titik tengah canvas, dipakai scene menu dan loader. */
    center: {
        x: 960,
        y: 540
    },
    /** Area bermain portrait di tengah canvas. */
    playArea: {
        x: 555,
        y: 0,
        width: 810,
        height: 1080,
        centerX: 960,
        centerY: 540
    },
    /** Panel HUD di sisi kiri canvas. */
    leftPanel: {
        x: 0,
        y: 0,
        width: 555,
        height: 1080
    },
    /** Panel HUD di sisi kanan canvas. */
    rightPanel: {
        x: 1365,
        y: 0,
        width: 555,
        height: 1080
    },
    /** Posisi spawn awal dalam koordinat lokal play area. */
    spawn: {
        playerX: 405,
        playerY: 900,
        enemyX: 405,
        enemyY: 180
    }
} as const;
