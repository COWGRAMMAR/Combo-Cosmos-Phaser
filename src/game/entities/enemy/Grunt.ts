import * as Phaser from 'phaser';
import { GruntConfig } from '../../config/GruntConfig';
import type { IEnemyBulletSpawner } from '../../types/IEnemyBulletSpawner';
import { Team } from '../../types/Team';
import { Enemy } from './Enemy';
import { EnemyState } from './EnemyState';
import type { IMovementPattern } from './patterns/IMovementPattern';

/**
 * Musuh Tipe 1.
 * Pergerakan diserahkan ke IMovementPattern, sedangkan Grunt mengurus HP,
 * timer tembak, despawn, dan pengembalian ke pool.
 */
export class Grunt extends Enemy
{
    private readonly bulletSpawner: IEnemyBulletSpawner;

    private movement?: IMovementPattern;

    private fireRemainingMs: number = 0;

    /** Membuat satu Grunt untuk diisi ke pool; perilaku aktif dimulai lewat spawn(). */
    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        texture: string,
        bulletSpawner: IEnemyBulletSpawner
    )
    {
        super(scene, x, y, texture, {
            team: Team.Enemy,
            maxHp: GruntConfig.maxHp,
            moveSpeed: GruntConfig.moveSpeed,
            bodyRadius: GruntConfig.bodyRadius
        });

        this.bulletSpawner = bulletSpawner;

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setImmovable(true);

        // Grunt harus bisa muncul di atas layar dan dibuang manual saat despawn.
        this.setCollideWorldBounds(false);
    }

    /** Menyiapkan Grunt dari pool dengan pola gerak tertentu. */
    public spawn(x: number, y: number, movement: IMovementPattern): void
    {
        this.movement = movement;
        this.entityState = EnemyState.Active;
        this.fireRemainingMs = GruntConfig.weapon.initialFireDelayMs;

        this.resetForPool(x, y);

        movement.reset();
        movement.update(this, 0);
    }

    /** Menggerakkan Grunt, membuang yang keluar layar, dan menjalankan timer tembak. */
    protected updateEntity(_time: number, delta: number): void
    {
        const movement = this.movement;

        if (!this.active || this.entityState !== EnemyState.Active || !movement)
        {
            return;
        }

        movement.update(this, delta);

        if (this.y > GruntConfig.despawnY)
        {
            this.die();
            return;
        }

        // Grunt yang masih di atas layar belum boleh menembak.
        if (this.y < 0)
        {
            return;
        }

        this.fireRemainingMs -= delta;

        if (this.fireRemainingMs > 0)
        {
            return;
        }

        this.fireRemainingMs = GruntConfig.weapon.fireIntervalMs;
        this.fire();
    }

    /** Menembak satu peluru searah sudut gerak Grunt. */
    private fire(): void
    {
        const angleRad = this.movement?.angleRad ?? 0;
        const speed = GruntConfig.weapon.bulletSpeed;
        const directionX = Math.sin(angleRad);
        const directionY = Math.cos(angleRad);
        const offset = GruntConfig.weapon.muzzleOffsetY;

        this.bulletSpawner.spawn(
            this.x + directionX * offset,
            this.y + directionY * offset,
            directionX * speed,
            directionY * speed
        );
    }
}
