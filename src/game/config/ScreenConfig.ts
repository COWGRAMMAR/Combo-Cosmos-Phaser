/**
 * Satu-satunya sumber kebenaran ukuran desain dan tata letak layar.
 * `width`/`height` adalah ukuran DESAIN, bukan ukuran canvas aktual: canvas
 * mengikuti ukuran window lewat Scale.RESIZE, lalu tiap scene memakai zoom
 * kamera agar ruang desain ini tetap 4:3 dan terpusat.
 * Semua koordinat gameplay memakai ruang lokal play area (0..810 x 0..1080).
 */
export const ScreenConfig = {
    /** Lebar ruang desain, dalam unit desain. */
    width: 1440,
    /** Tinggi ruang desain, dalam unit desain. */
    height: 1080,
    /** Titik tengah ruang desain, dipakai scene menu dan loader. */
    center: {
        x: 720,
        y: 540
    },
    /** Area bermain portrait di tengah ruang desain. */
    playArea: {
        x: 315,
        y: 0,
        width: 810,
        height: 1080,
        centerX: 720,
        centerY: 540
    },
    /** Panel HUD di sisi kiri ruang desain. */
    leftPanel: {
        x: 0,
        y: 0,
        width: 315,
        height: 1080
    },
    /** Panel HUD di sisi kanan ruang desain. */
    rightPanel: {
        x: 1125,
        y: 0,
        width: 315,
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
