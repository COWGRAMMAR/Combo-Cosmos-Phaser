import * as Phaser from 'phaser';
import { DepthConfig } from '../../config/DepthConfig';
import { PlayerConfig } from '../../config/PlayerConfig';
import type { EnemyBulletManager } from '../../systems/EnemyBulletManager';

/**
 * Gelombang kejut melingkar yang melebar dari pemain.
 * Setiap frame ia meminta manager menghapus peluru musuh di dalam radiusnya.
 */
export class Shockwave
{
    private readonly graphics: Phaser.GameObjects.Graphics;

    private readonly enemyBullets: EnemyBulletManager;

    private centerX: number = 0;

    private centerY: number = 0;

    private radius: number = 0;

    private running: boolean = false;

    /** Menyiapkan objek gambar yang dipakai ulang setiap kali kena hit. */
    constructor(scene: Phaser.Scene, enemyBullets: EnemyBulletManager)
    {
        this.enemyBullets = enemyBullets;
        this.graphics = scene.add.graphics();

        this.graphics.setDepth(DepthConfig.effect);
        this.graphics.setVisible(false);
    }

    /** Memulai gelombang baru dari posisi pemain. */
    public start(x: number, y: number): void
    {
        this.centerX = x;
        this.centerY = y;
        this.radius = 0;
        this.running = true;

        this.graphics.clear();
        this.graphics.setVisible(true);
    }

    /** Melebarkan radius, menghapus peluru di area, lalu menggambar ulang. */
    public update(delta: number): void
    {
        if (!this.running)
        {
            return;
        }

        this.radius += PlayerConfig.shockwave.growSpeed * (delta / 1000);

        this.enemyBullets.clearInRadius(this.centerX, this.centerY, this.radius);

        const progress = this.radius / PlayerConfig.shockwave.maxRadius;

        this.graphics.clear();
        this.graphics.lineStyle(4, 0x7df9ff, Math.max(0, 1 - progress));
        this.graphics.strokeCircle(this.centerX, this.centerY, this.radius);

        if (this.radius >= PlayerConfig.shockwave.maxRadius)
        {
            this.stop();
        }
    }

    /** Menghentikan dan menyembunyikan gelombang. */
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
