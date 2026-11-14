import { EnemyTestConfig } from '../../config/EnemyTestConfig';
import { LinearMovement } from '../../entities/enemy/patterns/LinearMovement';
import { GruntPool } from './GruntPool';
import type { IGruntFormation } from './IGruntFormation';
import { RainFormation } from './RainFormation';

/**
 * Menjalankan satu skenario tes Grunt tanpa WaveManager.
 * Skenario dimulai sekali per start(); tombol reset memanggil restart().
 * Skenario Wall/Stream ditambahkan pada fase implementasi berikutnya.
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
            case 'static':
                this.spawnStatic();
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

    /** Satu Grunt diam di atas tengah play area. */
    private spawnStatic(): void
    {
        const spawn = EnemyTestConfig.staticSpawn;

        this.pool.spawn(
            spawn.x,
            spawn.y,
            new LinearMovement(spawn.speed, spawn.angleDeg)
        );
    }
}
