import * as Phaser from 'phaser';
import { DepthConfig } from '../../config/DepthConfig';
import { EnemyConfig } from '../../config/EnemyConfig';
import type { AssetRef } from '../../types/AssetRef';

/**
 * Ledakan musuh yang diisi di awal dan dipakai ulang lewat spawn().
 * Animasi (membesar + memudar) dihitung manual dari delta supaya tidak ada
 * tween atau alokasi objek baru di hot loop.
 */
export class EnemyExplosionPool
{
    private readonly sprites: Phaser.GameObjects.Sprite[] = [];

    /** Sisa umur tiap sprite; indeks sejajar dengan `sprites`. */
    private readonly remainingMs: Float32Array;

    private readonly durationMs: number = EnemyConfig.explosion.durationMs;
    private readonly scaleFrom: number = EnemyConfig.explosion.scaleFrom;
    private readonly scaleTo: number = EnemyConfig.explosion.scaleTo;

    /** Membuat seluruh sprite ledakan sekali di awal, lalu menonaktifkannya. */
    constructor(scene: Phaser.Scene, asset: AssetRef)
    {
        const count = EnemyConfig.explosion.poolSize;

        // Float32Array dipakai agar penghitung umur tidak menghasilkan objek baru.
        this.remainingMs = new Float32Array(count);

        for (let i = 0; i < count; i++)
        {
            const sprite = scene.add.sprite(0, 0, asset.texture, asset.frame);

            sprite.setDepth(DepthConfig.effect);
            sprite.setActive(false);
            sprite.setVisible(false);

            this.sprites.push(sprite);
        }
    }

    /**
     * Memunculkan satu ledakan di posisi tertentu.
     * Kalau pool penuh, ledakan dilewati karena ini hanya efek visual.
     */
    public spawn(x: number, y: number): void
    {
        for (let i = 0; i < this.sprites.length; i++)
        {
            const sprite = this.sprites[i];

            if (sprite.active)
            {
                continue;
            }

            this.remainingMs[i] = this.durationMs;

            sprite.setPosition(x, y);
            sprite.setScale(this.scaleFrom);
            sprite.setAlpha(1);
            sprite.setActive(true);
            sprite.setVisible(true);

            return;
        }
    }

    /** Membesarkan dan memudarkan ledakan yang masih aktif. */
    public update(delta: number): void
    {
        for (let i = 0; i < this.sprites.length; i++)
        {
            const sprite = this.sprites[i];

            if (!sprite.active)
            {
                continue;
            }

            const remaining = this.remainingMs[i] - delta;

            if (remaining <= 0)
            {
                this.remainingMs[i] = 0;
                sprite.setActive(false);
                sprite.setVisible(false);
                continue;
            }

            this.remainingMs[i] = remaining;

            const progress = 1 - remaining / this.durationMs;

            sprite.setScale(this.scaleFrom + (this.scaleTo - this.scaleFrom) * progress);
            sprite.setAlpha(1 - progress);
        }
    }

    /** Menyembunyikan semua ledakan tanpa menghancurkan sprite. */
    public reset(): void
    {
        for (let i = 0; i < this.sprites.length; i++)
        {
            this.remainingMs[i] = 0;
            this.sprites[i].setActive(false);
            this.sprites[i].setVisible(false);
        }
    }

    /** Menghancurkan seluruh sprite saat scene dimatikan. */
    public destroy(): void
    {
        for (let i = 0; i < this.sprites.length; i++)
        {
            this.sprites[i].destroy();
        }

        this.sprites.length = 0;
    }
}
