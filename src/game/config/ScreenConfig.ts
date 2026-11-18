/**
 * Satu-satunya sumber kebenaran ukuran desain dan tata letak layar.
 * `width`/`height` adalah ukuran DESAIN, bukan ukuran canvas aktual: canvas
 * mengikuti ukuran window lewat Scale.RESIZE, lalu tiap scene memakai zoom
 * kamera agar ruang desain ini tetap 4:3 dan terpusat.
 * Semua koordinat gameplay memakai ruang lokal play area (0..1060 x 0..1080).
 */
const screenWidth = 2180;
const screenHeight = 1080; //1080
const playWidth = 1060;
const panelWidth = (screenWidth - playWidth) / 2; // 555

export const ScreenConfig = {
  width: screenWidth,
  height: screenHeight,
  center: {
    x: screenWidth / 2,
    y: screenHeight / 2,
  },
  playArea: {
    x: panelWidth,
    y: 0,
    width: playWidth,
    height: screenHeight,
    centerX: screenWidth / 2,
    centerY: screenHeight / 2,
  },
  leftPanel: {
    x: 0,
    y: 0,
    width: panelWidth,
    height: screenHeight,
  },
  rightPanel: {
    x: panelWidth + playWidth,
    y: 0,
    width: panelWidth,
    height: screenHeight,
  },
  spawn: {
    playerX: playWidth / 2,
    playerY: screenHeight - 80,
    enemyX: 405,
    enemyY: 180,
  },
} as const;
