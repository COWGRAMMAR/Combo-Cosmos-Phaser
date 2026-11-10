import { Scene } from 'phaser';
import { ScreenConfig } from '../config/ScreenConfig';
import { HudManager } from '../ui/HudManager';

/**
 * Scene HUD paralel dengan gameplay.
 * Setiap panel memakai kamera sendiri supaya efek kamera gameplay tidak
 * mengenai HUD. Isi panel diatur oleh HudManager.
 */
export class Hud extends Scene
{
    private leftContainer!: Phaser.GameObjects.Container;
    private rightContainer!: Phaser.GameObjects.Container;

    private hudManager?: HudManager;

    /** Mendaftarkan scene Hud. */
    constructor()
    {
        super('Hud');
    }

    /** Membuat dua kamera panel dan inisialisasi HudManager. */
    create(): void
    {
        const leftPanel = ScreenConfig.leftPanel;
        const rightPanel = ScreenConfig.rightPanel;

        const leftCamera = this.cameras.main;
        leftCamera.setViewport(leftPanel.x, leftPanel.y, leftPanel.width, leftPanel.height);

        const rightCamera = this.cameras.add(rightPanel.x, rightPanel.y, rightPanel.width, rightPanel.height);

        this.leftContainer = this.add.container(0, 0);
        this.rightContainer = this.add.container(0, 0);

        // Inisialisasi HudManager dengan referensi scene Game untuk polling data logic.
        const gameScene = this.scene.get('Game');
        this.hudManager = new HudManager(this, gameScene, this.leftContainer, this.rightContainer);

        // Setiap kamera hanya merender panel miliknya sendiri.
        leftCamera.ignore(this.rightContainer);
        rightCamera.ignore(this.leftContainer);
    }

    /** Memperbarui semua panel HUD tiap frame. */
    update(_time: number, delta: number): void
    {
        this.hudManager?.update(_time, delta);
    }
}
