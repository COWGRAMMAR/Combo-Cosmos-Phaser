import * as Phaser from 'phaser';
import { GruntConfig } from '../../config/GruntConfig';
import { GruntPool } from './GruntPool';
import type { IGruntFormation } from './IGruntFormation';
import { SingleFormation } from './SingleFormation';
import { StreamFormation } from './StreamFormation';
import { WallFormation } from './WallFormation';

/**
 * Formasi hujan pola: memunculkan satu jenis pola dasar (single/wall/stream)
 * berulang sebanyak `rain.count`, dengan jeda setelah tiap pola selesai.
 * Jenis pola dipilih lewat config, bukan rotasi otomatis.
 * Pola berikutnya baru dimulai setelah pola sebelumnya selesai.
 */
export class RainFormation implements IGruntFormation
{
    private readonly pool: GruntPool;

    private remaining: number = 0;
    private delayRemainingMs: number = 0;
    private active?: IGruntFormation;

    /** Menyiapkan rangkaian pola; pola baru muncul saat start()/update(). */
    constructor(pool: GruntPool)
    {
        this.pool = pool;
    }

    /** True kalau semua pola sudah dimunculkan dan pola terakhir selesai. */
    public get finished(): boolean
    {
        return this.remaining <= 0 && !this.active;
    }

    /** Memulai rangkaian pola dan langsung memunculkan pola pertama. */
    public start(): void
    {
        this.remaining = GruntConfig.rain.count;
        this.delayRemainingMs = 0;
        this.active = undefined;

        this.update(0);
    }

    /** Menjalankan pola aktif, lalu menghitung jeda sebelum pola berikutnya. */
    public update(delta: number): void
    {
        if (this.active)
        {
            this.active.update(delta);

            if (!this.active.finished)
            {
                return;
            }

            this.active = undefined;
            this.delayRemainingMs = this.nextDelayMs();
            return;
        }

        if (this.remaining <= 0)
        {
            return;
        }

        this.delayRemainingMs -= delta;

        if (this.delayRemainingMs > 0)
        {
            return;
        }

        this.startNextPattern();
    }

    /** Memunculkan pola berikutnya sesuai jenis yang dipilih di config. */
    private startNextPattern(): void
    {
        this.remaining -= 1;

        const pattern = this.createPattern();

        this.active = pattern;
        pattern.start();

        // Pola instan (single/wall) langsung selesai; jeda berikutnya dimulai sekarang.
        if (pattern.finished)
        {
            this.active = undefined;
            this.delayRemainingMs = this.nextDelayMs();
        }
    }

    /** Membuat pola dasar baru sesuai `rain.type`, dengan X dari config rain. */
    private createPattern(): IGruntFormation
    {
        const spawnX = GruntConfig.rain.spawnX;

        switch (GruntConfig.rain.type)
        {
            case 'wall':
                return new WallFormation(this.pool, spawnX);
            case 'stream':
                return new StreamFormation(this.pool, GruntConfig.stream, spawnX);
            default:
                return new SingleFormation(this.pool, spawnX);
        }
    }

    /** Jeda setelah satu pola selesai, dengan variasi acak opsional. */
    private nextDelayMs(): number
    {
        const jitterMs = GruntConfig.rain.jitterMs;
        const intervalMs = GruntConfig.rain.intervalMs + Phaser.Math.Between(-jitterMs, jitterMs);

        return Math.max(0, intervalMs);
    }
}
