import * as Phaser from 'phaser';
import { HudConfig } from '../config/HudConfig';

/**
 * Satu kotak slot buff di panel HUD kanan.
 * Menampilkan ikon item, jumlah stack, dan label keybind.
 * UI hanya menampilkan; data datang dari PowerUpSlotManager.
 */
export class PowerUpSlotBox extends Phaser.GameObjects.Container
{
    private readonly bg: Phaser.GameObjects.Rectangle;

    private readonly icon: Phaser.GameObjects.Image;

    private readonly stackText: Phaser.GameObjects.Text;

    private readonly keybindText: Phaser.GameObjects.Text;

    /** Konstruktor kotak slot kosong. */
    constructor(scene: Phaser.Scene, x: number, y: number, size: number)
    {
        super(scene, x, y);

        const slotCfg = HudConfig.right.slot;

        this.bg = scene.add
            .rectangle(0, 0, size, size, slotCfg.bgColor, slotCfg.bgAlpha)
            .setStrokeStyle(slotCfg.borderThickness, slotCfg.borderColor)
            .setOrigin(0.5);

        this.icon = scene.add
            .image(0, 0, '')
            .setDisplaySize(
                size - slotCfg.padding * 2,
                size - slotCfg.padding * 2
            )
            .setVisible(false);

        this.stackText = scene.add
            .text(
                size / 2 - slotCfg.padding,
                size / 2 - slotCfg.padding,
                '',
                {
                    fontFamily: HudConfig.label.fontFamily,
                    fontSize: slotCfg.stackFontSize,
                    color: slotCfg.stackColor
                }
            )
            // Angka stack ditempel di pojok kanan bawah kotak.
            .setOrigin(1, 1)
            .setVisible(false);

        this.keybindText = scene.add
            .text(
                0,
                size / 2 + slotCfg.padding + slotCfg.keybindGap,
                '',
                {
                    fontFamily: HudConfig.label.fontFamily,
                    fontSize: slotCfg.keybindFontSize,
                    color: slotCfg.keybindColor
                }
            )
            .setOrigin(0.5, 0);

        this.add([this.bg, this.icon, this.stackText, this.keybindText]);

        this.setDepth(5);
    }

    /** Tampilkan slot kosong dengan label keybind. */
    public setEmpty(keybind: string): void
    {
        const slotCfg = HudConfig.right.slot;
        this.icon.setVisible(false);
        this.stackText.setVisible(false);
        this.bg.setStrokeStyle(slotCfg.borderThickness, slotCfg.borderColor);
        this.keybindText.setText(keybind);
        this.keybindText.setVisible(true);
    }

    /** Tampilkan slot terisi dengan ikon, jumlah stack, dan keybind. */
    public setFilled(texture: string, count: number, keybind: string): void
    {
        const slotCfg = HudConfig.right.slot;
        this.icon.setTexture(texture);
        this.icon.setVisible(true);
        this.stackText.setText(String(count));
        this.stackText.setVisible(true);
        // Border tetap netral dan setebal slot kosong; jumlah stack cukup lewat angka.
        this.bg.setStrokeStyle(slotCfg.borderThickness, slotCfg.borderColor);
        this.keybindText.setText(keybind);
        this.keybindText.setVisible(true);
    }
}
