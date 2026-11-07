import { ScreenConfig } from '../config/ScreenConfig';

export interface FitResult {
    /** Faktor skala dari ruang desain ke ukuran window. */
    scale: number;
    /** Jarak horizontal dari tepi kiri window ke tepi kiri ruang desain. */
    offsetX: number;
    /** Jarak vertikal dari tepi atas window ke tepi atas ruang desain. */
    offsetY: number;
    /** Lebar ruang desain setelah diskalakan, dalam piksel window. */
    viewWidth: number;
    /** Tinggi ruang desain setelah diskalakan, dalam piksel window. */
    viewHeight: number;
}

/**
 * Menghitung skala dan offset agar ruang desain 4:3 muat di window dan terpusat.
 * Dipakai semua scene supaya tata letak konsisten di ukuran window apa pun.
 */
export function computeFit(windowWidth: number, windowHeight: number): FitResult {
    const scale = Math.min(
        windowWidth / ScreenConfig.width,
        windowHeight / ScreenConfig.height
    );
    const viewWidth = ScreenConfig.width * scale;
    const viewHeight = ScreenConfig.height * scale;

    return {
        scale,
        offsetX: (windowWidth - viewWidth) / 2,
        offsetY: (windowHeight - viewHeight) / 2,
        viewWidth,
        viewHeight
    };
}
