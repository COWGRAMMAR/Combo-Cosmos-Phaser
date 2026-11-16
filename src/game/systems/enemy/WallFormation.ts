import { EnemyTestConfig } from '../../config/EnemyTestConfig';
import { GruntConfig } from '../../config/GruntConfig';
import { LinearMovement } from '../../entities/enemy/patterns/LinearMovement';
import { GruntPool } from './GruntPool';
import type { IGruntFormation } from './IGruntFormation';

/**
 * Formasi dinding horizontal: satu baris Grunt muncul bersamaan, lalu diulang
 * sebanyak `formationRepeat` dengan jeda `wall.formationIntervalMs`.
 * Seluruh unit memakai gerak lurus yang sama, jadi satu instance LinearMovement
 * dipakai bersama (instance ini tidak menyimpan state per unit).
 */
export class WallFormation implements IGruntFormation
{
    private readonly pool: GruntPool;
    private readonly movement: LinearMovement;

    private rowsRemaining: number = 0;
    private spawnRemainingMs: number = 0;

    /** Menyiapkan formasi; baris baru muncul saat start()/update(). */
    constructor(pool: GruntPool)
    {
        this.pool = pool;
        this.movement = new LinearMovement(GruntConfig.wall.moveSpeed, GruntConfig.wall.moveAngleDeg);
    }

    /** True kalau seluruh baris sudah dimunculkan. */
    public get finished(): boolean
    {
        return this.rowsRemaining <= 0;
    }

    /** Memulai rangkaian baris baru dan langsung memunculkan baris pertama. */
    public start(): void
    {
        this.rowsRemaining = EnemyTestConfig.formationRepeat;
        this.spawnRemainingMs = 0;

        this.update(0);
    }

    /** Menghitung mundur jeda antar baris; tidak mengalokasikan objek per frame. */
    public update(delta: number): void
    {
        if (this.rowsRemaining <= 0)
        {
            return;
        }

        this.spawnRemainingMs -= delta;

        if (this.spawnRemainingMs > 0)
        {
            return;
        }

        this.spawnRow();
        this.rowsRemaining -= 1;

        this.spawnRemainingMs = GruntConfig.wall.formationIntervalMs;
    }

    /** Memunculkan satu baris Grunt yang terpusat di `wall.centerX`. */
    private spawnRow(): void
    {
        const count = GruntConfig.wall.count;
        const spacing = GruntConfig.wall.spacing;
        const startX = GruntConfig.wall.centerX - ((count - 1) * spacing) / 2;
        const y = -GruntConfig.spawnMargin;

        for (let i = 0; i < count; i++)
        {
            this.pool.spawn(startX + i * spacing, y, this.movement);
        }
    }
}
