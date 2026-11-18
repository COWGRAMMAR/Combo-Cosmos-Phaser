import { GruntConfig } from '../../config/GruntConfig';
import { LinearMovement } from '../../entities/enemy/patterns/LinearMovement';
import { GruntPool } from './GruntPool';
import type { IGruntFormation } from './IGruntFormation';

/**
 * Formasi dinding horizontal: satu baris Grunt muncul bersamaan, sekali per run.
 * Seluruh unit memakai gerak lurus yang sama, jadi satu instance LinearMovement
 * dipakai bersama (instance ini tidak menyimpan state per unit).
 */
export class WallFormation implements IGruntFormation
{
    private readonly pool: GruntPool;
    private readonly movement: LinearMovement;
    private readonly centerX: number;

    private spawned: boolean = false;

    /** Menyiapkan formasi; `centerX` bisa ditimpa dari luar (dipakai RainFormation). */
    constructor(pool: GruntPool, centerX: number = GruntConfig.wall.centerX)
    {
        this.pool = pool;
        this.centerX = centerX;
        this.movement = new LinearMovement(GruntConfig.wall.moveSpeed, GruntConfig.wall.moveAngleDeg);
    }

    /** True kalau baris sudah dimunculkan. */
    public get finished(): boolean
    {
        return this.spawned;
    }

    /** Memunculkan baris sekali; tidak ada spawn lanjutan. */
    public start(): void
    {
        this.spawned = false;

        this.spawnRow();
        this.spawned = true;
    }

    /** Baris tunggal tidak punya spawn lanjutan, jadi tidak ada yang dihitung per frame. */
    public update(_delta: number): void {}

    /** Memunculkan satu baris Grunt yang terpusat di `centerX`. */
    private spawnRow(): void
    {
        const count = GruntConfig.wall.count;
        const spacing = GruntConfig.wall.spacing;
        const startX = this.centerX - ((count - 1) * spacing) / 2;
        const y = -GruntConfig.spawnMargin;

        for (let i = 0; i < count; i++)
        {
            this.pool.spawn(startX + i * spacing, y, this.movement);
        }
    }
}
