import * as Phaser from 'phaser';
import { HudConfig } from '../config/HudConfig';

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

        const buffRow = HudConfig.right.buffRow;
        this._barWidth = barWidth;

        this.icon = scene.add
            .image(0, 0, '')
            .setDisplaySize(buffRow.iconSize, buffRow.iconSize)
            .setVisible(false);

        this.barBg = scene.add
            .rectangle(
                buffRow.iconSize + buffRow.gapIconBar,
                0,
                barWidth,
                buffRow.progressBarHeight,
                buffRow.barBgColor
            )
            .setOrigin(0, 0.5);

        // Lebar penuh sejak awal: progress diatur lewat scaleX, bukan setDisplaySize.
        this.barFg = scene.add
            .rectangle(
                buffRow.iconSize + buffRow.gapIconBar,
                0,
                barWidth,
                buffRow.progressBarHeight,
                0x22d3ee
            )
            .setOrigin(0, 0.5);

        this.add([this.icon, this.barBg, this.barFg]);
    }

    /**
     * Tampilkan baris durasi buff.
     * @param texture Tekstur ikon buff.
     * @param color Warna progress bar (dari PowerUpConfig.render.iconColor).
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
        const buffRow = HudConfig.right.buffRow;

        this.icon.setTexture(texture);
        this.icon.setVisible(true);

        const pct = totalMs > 0 ? remainingMs / totalMs : 0;
        const width = Math.round(barWidthClamp(this._barWidth, pct));

        this.barBg.setVisible(!isPaused);
        this.barFg.setVisible(!isPaused);
        this.barFg.setScale(this._barWidth > 0 ? width / this._barWidth : 0, 1);
        this.barFg.setFillStyle(color, 1);

        // Visual paused: progress bar diabaikan (di-hidden).
        if (isPaused)
        {
            this.barBg.setFillStyle(buffRow.barBgPausedColor, buffRow.barBgPausedAlpha);
            this.barFg.setVisible(false);
        }
        else
        {
            this.barBg.setFillStyle(buffRow.barBgColor, 1);
        }
    }
}

function barWidthClamp(maxWidth: number, pct: number): number
{
    return Math.max(0, Math.min(maxWidth, maxWidth * pct));
}
