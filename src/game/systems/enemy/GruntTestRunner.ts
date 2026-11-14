import { EnemyTestConfig } from '../../config/EnemyTestConfig';
import { LinearMovement } from '../../entities/enemy/patterns/LinearMovement';
import { GruntPool } from './GruntPool';

/**
 * Menjalankan satu skenario tes Grunt tanpa WaveManager.
 * Spawn hanya dilakukan sekali per start(); tombol reset memanggil restart().
 * Skenario selain 'static' ditambahkan pada fase implementasi berikutnya.
 */
export class GruntTestRunner
{
    private readonly pool: GruntPool;

    /** Menyimpan pool yang akan diisi sesuai skenario aktif. */
    constructor(pool: GruntPool)
    {
        this.pool = pool;
    }

    /** Mereset pool lalu memunculkan skenario yang sedang dipilih. */
    public start(): void
    {
        this.pool.reset();

        if (!EnemyTestConfig.enabled)
        {
            return;
        }

        switch (EnemyTestConfig.scenario)
        {
            case 'static':
                this.spawnStatic();
                break;
            default:
                break;
        }
    }

    /** Memunculkan ulang skenario dari awal (dipakai tombol reset). */
    public restart(): void
    {
        this.start();
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
