import * as Phaser from 'phaser';
import { HudSizeConfig } from '../config/HudSizeConfig';
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

        this.bg = scene.add
            .rectangle(0, 0, size, size, 0x334155, 0.5)
            .setStrokeStyle(HudSizeConfig.slot.emptyBorderThickness, 0x94a3b8)
            .setOrigin(0.5);

        this.icon = scene.add
            .image(0, 0, '')
            .setDisplaySize(
                size - HudSizeConfig.slot.padding * 2,
                size - HudSizeConfig.slot.padding * 2
            )
            .setVisible(false);

        this.stackText = scene.add
            .text(
                size / 2 - HudSizeConfig.slot.padding,
                size / 2 - HudSizeConfig.slot.padding,
                '',
                {
                    fontFamily: HudConfig.label.fontFamily,
                    fontSize: 20,
                    color: '#ffffff'
                }
            )
            .setOrigin(1, 0)
            .setVisible(false);

        this.keybindText = scene.add
            .text(
                0,
                size / 2 + HudSizeConfig.slot.padding + 4,
                '',
                {
                    fontFamily: HudConfig.label.fontFamily,
                    fontSize: 18,
                    color: '#e2e8f0'
                }
            )
            .setOrigin(0.5, 0);

        this.add([this.bg, this.icon, this.stackText, this.keybindText]);

        this.setDepth(5);
    }

    /** Tampilkan slot kosong dengan label keybind. */
    public setEmpty(keybind: string): void
    {
        this.icon.setVisible(false);
        this.stackText.setVisible(false);
        this.bg.setStrokeStyle(HudSizeConfig.slot.emptyBorderThickness, 0x64748b);
        this.keybindText.setText(keybind);
        this.keybindText.setVisible(true);
    }

    /** Tampilkan slot terisi dengan ikon, stack, dan keybind. */
    public setFilled(texture: string, count: number, maxStack: number, keybind: string): void
    {
        this.icon.setTexture(texture);
        this.icon.setVisible(true);
        this.stackText.setText(`${count}/${maxStack}`);
        this.stackText.setVisible(true);
        this.bg.setStrokeStyle(
            count >= maxStack ? HudSizeConfig.slot.fullBorderThickness : HudSizeConfig.slot.emptyBorderThickness,
            0x22d3ee
        );
        this.keybindText.setText(keybind);
        this.keybindText.setVisible(true);
    }
}
