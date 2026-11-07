import { Scene } from 'phaser';
import { HudConfig } from '../config/HudConfig';
import { ScreenConfig } from '../config/ScreenConfig';
import { computeFit } from '../utils/computeFit';
import type { FitResult } from '../utils/computeFit';

/**
 * Scene HUD paralel dengan gameplay.
 * Setiap panel memakai kamera sendiri supaya efek kamera gameplay tidak
 * mengenai HUD. Isi panel masih placeholder. TEMP
 */
export class Hud extends Scene
{
    private leftContainer!: Phaser.GameObjects.Container;
    private rightContainer!: Phaser.GameObjects.Container;
    private rightCamera!: Phaser.Cameras.Scene2D.Camera;

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
        this.rightCamera = this.cameras.add(0, 0, 1, 1);

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
}
