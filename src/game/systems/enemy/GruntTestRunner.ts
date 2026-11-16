import { EnemyTestConfig } from '../../config/EnemyTestConfig';
import { GruntConfig } from '../../config/GruntConfig';
import { GruntPool } from './GruntPool';
import type { IGruntFormation } from './IGruntFormation';
import { RainFormation } from './RainFormation';
import { SingleFormation } from './SingleFormation';
import { StreamFormation } from './StreamFormation';
import { WallFormation } from './WallFormation';

/**
 * Menjalankan satu skenario tes Grunt tanpa WaveManager.
 * Skenario dimulai sekali per start(); tombol reset memanggil restart().
 * Skenario single/wall/stream memunculkan pola sekali, rain mengulanginya.
 */
export class GruntTestRunner
{
    private readonly pool: GruntPool;
    private formation?: IGruntFormation;

    /** Menyimpan pool yang akan diisi sesuai skenario aktif. */
    constructor(pool: GruntPool)
    {
        this.pool = pool;
    }

    /** Mereset pool lalu memulai skenario yang sedang dipilih. */
    public start(): void
    {
        this.pool.reset();
        this.formation = undefined;

        if (!EnemyTestConfig.enabled)
        {
            return;
        }

        switch (EnemyTestConfig.scenario)
        {
            case 'single':
                this.startFormation(new SingleFormation(this.pool));
                break;
            case 'wall':
                this.startFormation(new WallFormation(this.pool));
                break;
            case 'stream':
                this.startFormation(new StreamFormation(this.pool, GruntConfig.stream));
                break;
            case 'rain':
                this.startFormation(new RainFormation(this.pool));
                break;
            default:
                break;
        }
    }

    /** Meneruskan delta ke formasi aktif; formasi selesai tidak diupdate lagi. */
    public update(delta: number): void
    {
        const formation = this.formation;

        if (formation && !formation.finished)
        {
            formation.update(delta);
        }
    }

    /** Memunculkan ulang skenario dari awal (dipakai tombol reset). */
    public restart(): void
    {
        this.start();
    }

    /** Memasang formasi baru lalu menjalankannya. */
    private startFormation(formation: IGruntFormation): void
    {
        this.formation = formation;
        formation.start();
    }
}
