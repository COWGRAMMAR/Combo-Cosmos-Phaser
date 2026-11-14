import * as Phaser from 'phaser';
import { EnemyConfig } from '../../config/EnemyConfig';
import { Team } from '../../types/Team';
import { Enemy } from './Enemy';
import { EnemyState } from './EnemyState';

/**
 * Musuh sementara untuk menguji damage peluru pemain.
 * PLACEHOLDER: kelas ini akan diganti oleh musuh sungguhan beserta pola
 * tembakannya. Jangan menambah logika gameplay permanen di sini.
 */
export class DummyEnemy extends Enemy
{
    /** Membuat musuh diam dengan konfigurasi default dari EnemyConfig. */
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string)
    {
        super(scene, x, y, texture, {
            team: Team.Enemy,
            maxHp: EnemyConfig.maxHp,
            moveSpeed: EnemyConfig.moveSpeed,
            bodyRadius: EnemyConfig.bodyRadius
        });

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setImmovable(true);
        body.moves = false;
        this.setVelocity(0, 0);
    }

    /** Menghidupkan lagi dummy di posisi baru untuk pengujian berulang. */
    public respawn(x: number, y: number): void
    {
        this.entityState = EnemyState.Active;
        this.resetForPool(x, y);
    }
}
