import * as Phaser from 'phaser';
import { EnemyTestConfig } from '../../config/EnemyTestConfig';
import { GruntConfig } from '../../config/GruntConfig';
import { LinearMovement } from '../../entities/enemy/patterns/LinearMovement';
import { GruntPool } from './GruntPool';
import type { IGruntFormation } from './IGruntFormation';

/**
 * Formasi hujan Grunt: sejumlah unit muncul satu per satu dengan X acak.
 * Semua unit memakai gerak lurus yang sama, jadi satu instance LinearMovement
 * dipakai bersama (instance ini tidak menyimpan state per unit).
 */
export class RainFormation implements IGruntFormation
{
    private readonly pool: GruntPool;
    private readonly movement: LinearMovement;

    private remaining: number = 0;
    private spawnRemainingMs: number = 0;

    /** Menyiapkan formasi; spawn baru terjadi saat start()/update(). */
    constructor(pool: GruntPool)
    {
        this.pool = pool;
        this.movement = new LinearMovement(GruntConfig.rain.moveSpeed, GruntConfig.rain.moveAngleDeg);
    }

    /** True kalau seluruh batch sudah dimunculkan. */
    public get finished(): boolean
    {
        return this.remaining <= 0;
    }

    /** Memulai batch baru dan langsung memunculkan unit pertama. */
    public start(): void
    {
        this.remaining = EnemyTestConfig.rainCount;
        this.spawnRemainingMs = 0;

        this.update(0);
    }

    /** Menghitung mundur jeda spawn; tidak mengalokasikan objek per frame. */
    public update(delta: number): void
    {
        if (this.remaining <= 0)
        {
            return;
        }

        this.spawnRemainingMs -= delta;

        if (this.spawnRemainingMs > 0)
        {
            return;
        }

        this.spawnOne();
        this.remaining -= 1;

        const jitterMs = GruntConfig.rain.jitterMs;
        const intervalMs = GruntConfig.rain.intervalMs + Phaser.Math.Between(-jitterMs, jitterMs);

        this.spawnRemainingMs = Math.max(0, intervalMs);
    }

    /** Memunculkan satu Grunt di X acak, dari atas play area. */
    private spawnOne(): void
    {
        const x = Phaser.Math.FloatBetween(GruntConfig.rain.spawnXMin, GruntConfig.rain.spawnXMax);

        this.pool.spawn(x, -GruntConfig.spawnMargin, this.movement);
    }
}
