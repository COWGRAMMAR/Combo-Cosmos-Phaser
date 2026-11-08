/**
 * Satu-satunya sumber kebenaran ukuran canvas dan tata letak layar.
 * Semua koordinat gameplay memakai ruang lokal play area (0..810 x 0..1080).
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
