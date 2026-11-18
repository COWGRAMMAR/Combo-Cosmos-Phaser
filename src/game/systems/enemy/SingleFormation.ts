import { GruntConfig } from '../../config/GruntConfig';
import { LinearMovement } from '../../entities/enemy/patterns/LinearMovement';
import { GruntPool } from './GruntPool';
import type { IGruntFormation } from './IGruntFormation';

/**
 * Pola dasar satu unit: satu Grunt muncul di `single.spawnX` lalu meluncur
 * ke bawah. Pola ini juga dipakai ulang oleh RainFormation.
 */
export class SingleFormation implements IGruntFormation
{
    private readonly pool: GruntPool;
    private readonly movement: LinearMovement;
    private readonly spawnX: number;

    private spawned: boolean = false;

    /** Menyiapkan pola; `spawnX` bisa ditimpa dari luar (dipakai RainFormation). */
    constructor(pool: GruntPool, spawnX: number = GruntConfig.single.spawnX)
    {
        this.pool = pool;
        this.spawnX = spawnX;
        this.movement = new LinearMovement(GruntConfig.single.moveSpeed, GruntConfig.single.moveAngleDeg);
    }

    /** True kalau unit sudah dimunculkan. */
    public get finished(): boolean
    {
        return this.spawned;
    }

    /** Memunculkan satu unit sekali; tidak ada spawn lanjutan. */
    public start(): void
    {
        this.spawned = false;

        this.pool.spawn(this.spawnX, -GruntConfig.spawnMargin, this.movement);
        this.spawned = true;
    }

    /** Pola satu unit tidak punya spawn lanjutan, jadi tidak ada yang dihitung per frame. */
    public update(_delta: number): void {}
}
