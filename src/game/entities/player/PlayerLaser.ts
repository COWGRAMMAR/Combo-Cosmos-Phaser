import * as Phaser from 'phaser';
import { DepthConfig } from '../../config/DepthConfig';
import { PlayerConfig } from '../../config/PlayerConfig';
import type { Enemy } from '../enemy/Enemy';
import type { Player } from './Player';

/**
 * Laser vertikal yang menempel di depan pemain selama efek aktif.
 * Damage diberikan per interval, bukan setiap frame, memakai hitbox persegi.
 */
export class PlayerLaser
{
    private readonly beam: Phaser.GameObjects.Rectangle;

    private readonly player: Player;

    private readonly enemies: Enemy[];

    private tickAccumulator: number = 0;

    private running: boolean = false;

    /** Membuat beam tersembunyi dan menyimpan daftar musuh untuk tick damage. */
    constructor(scene: Phaser.Scene, player: Player, enemies: Phaser.GameObjects.Group)
    {
        this.player = player;
        this.enemies = enemies.getChildren() as Enemy[];
        this.beam = scene.add.rectangle(0, 0, PlayerConfig.laser.width, PlayerConfig.laser.length, 0x7df9ff, 0.35);

        this.beam.setOrigin(0.5, 0.5);
        this.beam.setDepth(DepthConfig.effect);
        this.beam.setVisible(false);
    }

    /** Menyalakan laser dan langsung memberi satu tick damage pertama. */
    public activate(): void
    {
        this.running = true;
        this.tickAccumulator = PlayerConfig.laser.tickMs;

        this.beam.setVisible(true);
    }

    /** Mematikan laser tanpa menghapus objeknya. */
    public deactivate(): void
    {
        this.running = false;
        this.tickAccumulator = 0;

        this.beam.setVisible(false);
    }

    /** Mengikuti pemain dan memberi damage setiap interval tick. */
    public update(delta: number): void
    {
        if (!this.running)
        {
            return;
        }

        this.beam.setPosition(this.player.x, this.player.y - PlayerConfig.laser.length / 2);

        this.tickAccumulator += delta;

        if (this.tickAccumulator < PlayerConfig.laser.tickMs)
        {
            return;
        }

        this.tickAccumulator -= PlayerConfig.laser.tickMs;
        this.damageEnemiesInBeam();
    }

    /** Membersihkan state saat run di-reset. */
    public reset(): void
    {
        this.deactivate();
        this.beam.setAlpha(1);
    }

    /** Menghapus objek beam saat scene dimatikan. */
    public destroy(): void
    {
        this.beam.destroy();
    }

    /** Mengecek tabrakan persegi beam dengan pusat musuh secara manual. */
    private damageEnemiesInBeam(): void
    {
        const halfWidth = PlayerConfig.laser.width / 2;
        const bottom = this.player.y;
        const top = this.player.y - PlayerConfig.laser.length;

        for (let i = 0; i < this.enemies.length; i++)
        {
            const enemy = this.enemies[i];

            if (!enemy.active)
            {
                continue;
            }

            if (Math.abs(enemy.x - this.player.x) > halfWidth || enemy.y < top || enemy.y > bottom)
            {
                continue;
            }

            enemy.takeDamage(PlayerConfig.laser.damage);
        }
    }
}
