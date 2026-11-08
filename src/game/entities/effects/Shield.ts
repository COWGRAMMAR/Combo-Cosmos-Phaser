import * as Phaser from 'phaser';
import { DepthConfig } from '../../config/DepthConfig';
import { PlayerConfig } from '../../config/PlayerConfig';

/**
 * Lingkaran placeholder shield yang muncul di sekitar pemain saat shield aktif.
 * Gambar ulang setiap frame agar mengikuti gerak pemain. Warna sama dengan shockwave.
 */
export class Shield
{
    private readonly graphics: Phaser.GameObjects.Graphics;

    private centerX: number = 0;

    private centerY: number = 0;

    private running: boolean = false;

    /** Menyiapkan objek gambar yang dipakai ulang setiap kali shield dinyalakan. */
    constructor(scene: Phaser.Scene)
    {
        this.graphics = scene.add.graphics();

        this.graphics.setDepth(DepthConfig.effect);
        this.graphics.setVisible(false);
    }

    /** Memulai tampilan shield pada posisi pemain. */
    public start(x: number, y: number): void
    {
        this.centerX = x;
        this.centerY = y;
        this.running = true;

        this.graphics.clear();
        this.graphics.setVisible(true);
    }

    /** Menggambar ulang lingkaran shield di posisi pemain terbaru. */
    public update(x: number, y: number): void
    {
        if (!this.running)
        {
            return;
        }

        this.centerX = x;
        this.centerY = y;

        this.graphics.clear();
        this.graphics.lineStyle(4, 0x7df9ff, 1);
        this.graphics.strokeCircle(this.centerX, this.centerY, PlayerConfig.bodyRadius * 1.5);
    }

    /** Menghentikan dan menyembunyikan tampilan shield. */
    public stop(): void
    {
        this.running = false;
        this.graphics.clear();
        this.graphics.setVisible(false);
    }

    /** Menghapus objek gambar saat scene dimatikan. */
    public destroy(): void
    {
        this.graphics.destroy();
    }
}
