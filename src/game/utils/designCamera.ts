import type { Scene } from 'phaser';
import { ScreenConfig } from '../config/ScreenConfig';
import { computeFit } from './computeFit';

/**
 * Memusatkan kamera scene menu pada ruang desain, bukan pada ukuran window.
 * Dipakai scene yang koordinatnya memakai ScreenConfig.center.
 */
export function applyDesignCamera(scene: Scene): void {
    const fit = computeFit(scene.scale.width, scene.scale.height);
    const camera = scene.cameras.main;

    camera.setZoom(fit.scale);
    camera.centerOn(ScreenConfig.center.x, ScreenConfig.center.y);
}

/**
 * Menerapkan layout kamera desain sekarang dan setiap kali window berubah.
 * Listener otomatis dilepas saat scene shutdown.
 */
export function bindDesignCamera(scene: Scene): void {
    const apply = (): void => applyDesignCamera(scene);

    apply();
    scene.scale.on('resize', apply);
    scene.events.once('shutdown', () => scene.scale.off('resize', apply));
}
