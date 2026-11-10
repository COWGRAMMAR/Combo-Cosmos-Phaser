import * as Phaser from 'phaser';
import { HudLeftPanel } from './HudLeftPanel';
import { HudRightPanel } from './HudRightPanel';
import { ScreenConfig } from '../config/ScreenConfig';

/**
 * Manajer utama HUD gameplay.
 * Koordinasi HudLeftPanel dan HudRightPanel, memasang masing-masing ke
 * container scene Hud, dan memanggil update() tiap panel setiap frame.
 * UI hanya menampilkan; data logika diambil dari Game scene melalui getter read-only.
 */
export class HudManager
{
    private readonly leftPanel: HudLeftPanel;

    private readonly rightPanel: HudRightPanel;

    /** Konstruktor manajer HUD. */
    constructor(scene: Phaser.Scene, gameScene: Phaser.Scene, leftContainer: Phaser.GameObjects.Container, rightContainer: Phaser.GameObjects.Container)
    {
        this.leftPanel = new HudLeftPanel(
            scene,
            0, 0,  // posisi relatif dalam container; kamera atur penempatan layar
            ScreenConfig.leftPanel.width,
            ScreenConfig.leftPanel.height
        );
        leftContainer.add(this.leftPanel);

        this.rightPanel = new HudRightPanel(
            scene,
            gameScene,
            0, 0,  // posisi relatif dalam container; kamera atur penempatan layar
            ScreenConfig.rightPanel.width,
            ScreenConfig.rightPanel.height
        );
        rightContainer.add(this.rightPanel);
    }

    /** Memperbarui semua panel HUD. Dipanggil dari Hud.update() tiap frame. */
    public update(_time: number, delta: number): void
    {
        this.leftPanel.update(_time, delta);
        this.rightPanel.update(_time, delta);
    }

    /** Melepas seluruh objek panel. */
    public destroy(): void
    {
        this.leftPanel.destroy(true);
        this.rightPanel.destroy(true);
    }
}
