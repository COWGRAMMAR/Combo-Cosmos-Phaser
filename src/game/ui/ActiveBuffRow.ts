import * as Phaser from 'phaser';
import { HudSizeConfig } from '../config/HudSizeConfig';

/**
 * Satu baris durasi buff aktif di daftar di bawah kotak slot.
 * Menampilkan ikon buff di kiri dan progress bar sisa durasi di sampingnya.
 * UI hanya menampilkan; data datang dari ActiveBuffManager.
 */
export class ActiveBuffRow extends Phaser.GameObjects.Container
{
    private readonly icon: Phaser.GameObjects.Image;

    private readonly barBg: Phaser.GameObjects.Rectangle;

    private readonly barFg: Phaser.GameObjects.Rectangle;

    private readonly _barWidth: number;

    /** Konstruktor baris durasi kosong. */
    constructor(scene: Phaser.Scene, x: number, y: number, barWidth: number)
    {
        super(scene, x, y);

        this._barWidth = barWidth;

        this.icon = scene.add
            .image(0, 0, '')
            .setDisplaySize(HudSizeConfig.buffRow.iconSize, HudSizeConfig.buffRow.iconSize)
            .setVisible(false);

        this.barBg = scene.add
            .rectangle(
                HudSizeConfig.buffRow.iconSize + HudSizeConfig.buffRow.gapIconBar,
                0,
                barWidth,
                HudSizeConfig.buffRow.progressBarHeight,
                0x334155
            )
            .setOrigin(0, 0.5);

        this.barFg = scene.add
            .rectangle(
                HudSizeConfig.buffRow.iconSize + HudSizeConfig.buffRow.gapIconBar,
                0,
                0,
                HudSizeConfig.buffRow.progressBarHeight,
                0x22d3ee
            )
            .setOrigin(0, 0.5);

        this.add([this.icon, this.barBg, this.barFg]);
    }

    /**
     * Tampilkan baris durasi buff.
     * @param texture Tekstur ikon buff.
     * @param color Warna progress bar (dari PowerUpConfig.iconColor).
     * @param remainingMs Sisa durasi dalam milidetik.
     * @param totalMs Durasi total dalam milidetik.
     * @param isPaused Apakah seluruh buff sedang pause (progress bar dibeku).
     */
    public setBuffData(
        texture: string,
        color: number,
        remainingMs: number,
        totalMs: number,
        isPaused: boolean
    ): void
    {
        this.icon.setTexture(texture);
        this.icon.setVisible(true);

        const pct = totalMs > 0 ? remainingMs / totalMs : 0;
        const width = Math.round(barWidthClamp(this._barWidth, pct));

        this.barBg.setVisible(!isPaused);
        this.barFg.setVisible(!isPaused);
        this.barFg.setDisplaySize(width, HudSizeConfig.buffRow.progressBarHeight);
        this.barFg.setFillStyle(color, 1);

        // Visual paused: progress bar diabaikan (di-hidden).
        if (isPaused)
        {
            this.barBg.setFillStyle(0x475569, 0.5);
            this.barFg.setVisible(false);
        }
        else
        {
            this.barBg.setFillStyle(0x334155, 1);
        }
    }
}

function barWidthClamp(maxWidth: number, pct: number): number
{
    return Math.max(0, Math.min(maxWidth, maxWidth * pct));
}
