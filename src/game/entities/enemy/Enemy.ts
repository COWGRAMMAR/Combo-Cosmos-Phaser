import * as Phaser from 'phaser';
import { DepthConfig } from '../../config/DepthConfig';
import type { EntityConfig } from '../../types/EntityConfig';
import { BaseEntity } from '../BaseEntity';
import { EnemyState } from './EnemyState';

/** Entitas musuh statis yang belum memiliki pola serangan. */
export class Enemy extends BaseEntity
{
    public entityState: EnemyState = EnemyState.Active;

    /** Membuat body musuh tidak bergerak dan tidak terdorong. */
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, config: EntityConfig)
    {
        super(scene, x, y, texture, config);

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setImmovable(true);
        body.moves = false;
        this.setVelocity(0, 0);

        this.setDepth(DepthConfig.enemy);
    }

    /** Belum ada perilaku per-frame untuk musuh. */
    protected updateEntity(_time: number, _delta: number): void {}

    /** Menonaktifkan musuh saat HP habis. */
    public die(): void
    {
        this.entityState = EnemyState.Dying;
        this.setActive(false);
        this.setVisible(false);

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.enable = false;
    }
}
