import { GruntConfig } from '../../config/GruntConfig';
import { LinearMovement } from '../../entities/enemy/patterns/LinearMovement';
import { GruntPool } from './GruntPool';
import type { IGruntFormation } from './IGruntFormation';

/** Parameter satu rangkaian Stream; diambil dari blok config Grunt. */
export interface IStreamConfig
{
    readonly count: number;
    readonly spacing: number;
    readonly streamDelayMs: number;
    readonly spawnX: number;
    readonly moveSpeed: number;
    readonly moveAngleDeg: number;
}

/**
 * Formasi garis vertikal: Grunt muncul satu per satu dalam satu kolom,
 * sekali per run. Seluruh unit memakai gerak lurus yang sama, jadi satu
 * instance LinearMovement dipakai bersama (instance ini tidak menyimpan
 * state per unit).
 */
export class StreamFormation implements IGruntFormation
{
    private readonly pool: GruntPool;
    private readonly config: IStreamConfig;
    private readonly movement: LinearMovement;

    private spawned: number = 0;
    private spawnRemainingMs: number = 0;

    /** Menyiapkan formasi; unit baru muncul saat start()/update(). */
    constructor(pool: GruntPool, config: IStreamConfig)
    {
        this.pool = pool;
        this.config = config;
        this.movement = new LinearMovement(config.moveSpeed, config.moveAngleDeg);
    }

    /** True kalau seluruh unit satu kolom sudah dimunculkan. */
    public get finished(): boolean
    {
        return this.spawned >= this.config.count;
    }

    /** Memulai kolom baru dan langsung memunculkan unit pertama. */
    public start(): void
    {
        this.spawned = 0;
        this.spawnRemainingMs = 0;

        this.update(0);
    }

    /** Menghitung mundur jeda spawn; tidak mengalokasikan objek per frame. */
    public update(delta: number): void
    {
        if (this.spawned >= this.config.count)
        {
            return;
        }

        this.spawnRemainingMs -= delta;

        if (this.spawnRemainingMs > 0)
        {
            return;
        }

        this.spawnUnit();
        this.spawned += 1;

        this.spawnRemainingMs = this.config.streamDelayMs;
    }

    /** Memunculkan satu unit pada kolom vertikal di `spawnX`. */
    private spawnUnit(): void
    {
        const y = -GruntConfig.spawnMargin - this.spawned * this.config.spacing;

        this.pool.spawn(this.config.spawnX, y, this.movement);
    }
}
