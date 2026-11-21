import { Scene } from 'phaser';
import { ScreenConfig } from '../config/ScreenConfig';
import { HudManager } from '../ui/HudManager';
import { IHudGameSource } from '../systems/IHudGameSource';
import { computeFit } from '../utils/computeFit';
import type { FitResult } from '../utils/computeFit';

/**
 * Scene HUD paralel dengan gameplay.
 * Setiap panel memakai kamera sendiri supaya efek kamera gameplay tidak
 * mengenai HUD. Isi panel diatur oleh HudManager.
 */
export class Hud extends Scene
{
    private leftContainer!: Phaser.GameObjects.Container;
    private rightContainer!: Phaser.GameObjects.Container;
    private rightCamera!: Phaser.Cameras.Scene2D.Camera;

    private hudManager?: HudManager;

    /** Mendaftarkan scene Hud. */
    constructor()
    {
        super('Hud');
    }

    /** Membuat dua kamera panel dan inisialisasi HudManager. */
    create(): void
    {
        const leftCamera = this.cameras.main;
        this.rightCamera = this.cameras.add(0, 0, 1, 1);

        this.leftContainer = this.add.container(0, 0);
        this.rightContainer = this.add.container(0, 0);

        // Inisialisasi HudManager dengan referensi scene Game (implementasi IHudGameSource) untuk polling data logic.
        const gameScene = this.scene.get('Game') as unknown as IHudGameSource;
        this.hudManager = new HudManager(this, gameScene, this.leftContainer, this.rightContainer);

        // Setiap kamera hanya merender panel miliknya sendiri.
        leftCamera.ignore(this.rightContainer);
        this.rightCamera.ignore(this.leftContainer);

        this.applyCameraLayout();
        this.scale.on('resize', this.applyCameraLayout, this);
        this.events.once('shutdown', this.handleShutdown, this);
    }

    /** Menyesuaikan viewport dan zoom kedua kamera panel saat window berubah. */
    private applyCameraLayout(): void
    {
        const fit = computeFit(this.scale.width, this.scale.height);

        this.applyPanelCamera(this.cameras.main, ScreenConfig.leftPanel, fit);
        this.applyPanelCamera(this.rightCamera, ScreenConfig.rightPanel, fit);
    }

    /** Memetakan satu panel desain ke viewport layar dan memusatkannya. */
    private applyPanelCamera(
        camera: Phaser.Cameras.Scene2D.Camera,
        panel: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
        fit: FitResult
    ): void
    {
        camera.setViewport(
            fit.offsetX + panel.x * fit.scale,
            fit.offsetY + panel.y * fit.scale,
            panel.width * fit.scale,
            panel.height * fit.scale
        );
        camera.setZoom(fit.scale);
        camera.centerOn(panel.width / 2, panel.height / 2);
    }

    /** Melepas listener resize saat scene berhenti. */
    private handleShutdown(): void
    {
        this.scale.off('resize', this.applyCameraLayout, this);
    }

    /** Memperbarui semua panel HUD tiap frame. */
    update(_time: number, delta: number): void
    {
        this.hudManager?.update(_time, delta);
    }
}
