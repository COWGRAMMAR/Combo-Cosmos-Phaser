import { Scene } from 'phaser';
import { HudConfig } from '../config/HudConfig';
import { ScreenConfig } from '../config/ScreenConfig';

/**
 * Scene HUD paralel dengan gameplay.
 * Setiap panel memakai kamera sendiri supaya efek kamera gameplay tidak
 * mengenai HUD. Isi panel masih placeholder. TEMP
 */
export class Hud extends Scene
{
    private leftContainer!: Phaser.GameObjects.Container;
    private rightContainer!: Phaser.GameObjects.Container;

    /** Mendaftarkan scene Hud. */
    constructor()
    {
        super('Hud');
    }

    /** Membuat dua kamera panel dan placeholder kotak HUD. */
    create(): void
    {
        const leftPanel = ScreenConfig.leftPanel;
        const rightPanel = ScreenConfig.rightPanel;

        const leftCamera = this.cameras.main;
        leftCamera.setViewport(leftPanel.x, leftPanel.y, leftPanel.width, leftPanel.height);

        const rightCamera = this.cameras.add(rightPanel.x, rightPanel.y, rightPanel.width, rightPanel.height);

        this.leftContainer = this.add.container(0, 0);
        this.rightContainer = this.add.container(0, 0);

        const leftBackground = this.add.rectangle(
            0,
            0,
            leftPanel.width,
            leftPanel.height,
            HudConfig.leftPanel.color
        ).setOrigin(0);

        const leftLabel = this.add.text(
            leftPanel.width / 2,
            leftPanel.height / 2,
            HudConfig.leftPanel.label,
            {
                fontFamily: HudConfig.label.fontFamily,
                fontSize: HudConfig.label.fontSize,
                color: HudConfig.label.color
            }
        ).setOrigin(0.5);

        this.leftContainer.add([leftBackground, leftLabel]);

        const rightBackground = this.add.rectangle(
            0,
            0,
            rightPanel.width,
            rightPanel.height,
            HudConfig.rightPanel.color
        ).setOrigin(0);

        const rightLabel = this.add.text(
            rightPanel.width / 2,
            rightPanel.height / 2,
            HudConfig.rightPanel.label,
            {
                fontFamily: HudConfig.label.fontFamily,
                fontSize: HudConfig.label.fontSize,
                color: HudConfig.label.color
            }
        ).setOrigin(0.5);

        this.rightContainer.add([rightBackground, rightLabel]);

        // Setiap kamera hanya merender panel miliknya sendiri.
        leftCamera.ignore(this.rightContainer);
        rightCamera.ignore(this.leftContainer);
    }
}
