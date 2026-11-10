import { AssetKeys } from './AssetKeys';
import type { AssetKey } from './AssetKeys';

/** Sumber fisik sebuah aset: file statis atau hasil generate runtime. */
export type AssetSource = 'file' | 'generated';

/** Entri aset yang dimuat dari file statis. */
export interface AssetFileEntry
{
    readonly key: AssetKey;
    readonly source: 'file';
    readonly path: string;
    /** Frame di dalam tekstur; dipakai saat aset berubah jadi atlas. */
    readonly frame?: string | number;
}

/** Entri aset placeholder yang digenerate runtime. */
export interface AssetGeneratedEntry
{
    readonly key: AssetKey;
    readonly source: 'generated';
    /** Jumlah frame di dalam tekstur ini (placeholder sekarang selalu 1). */
    readonly frameCount: 1 | 2;
    /** Frame di dalam tekstur; dipakai saat aset berubah jadi atlas. */
    readonly frame?: string | number;
}

/** Satu frame animasi: tekstur asal + frame opsional. */
export interface AssetAnimationFrame
{
    readonly texture: string;
    readonly frame?: string | number;
}

/** Definisi animasi yang didaftarkan AssetManager. */
export interface AssetAnimation
{
    readonly key: string;
    readonly frames: readonly AssetAnimationFrame[];
    readonly frameRate: number;
    readonly repeat: number;
}

/** Bentuk keseluruhan manifest aset. */
export interface AssetManifestShape
{
    readonly boot: readonly AssetFileEntry[];
    readonly main: readonly AssetFileEntry[];
    readonly placeholders: readonly AssetGeneratedEntry[];
    readonly animations: Readonly<Record<string, AssetAnimation>>;
}

/**
 * Satu-satunya sumber kebenaran aset ber-key.
 * Saat migrasi ke atlas spritesheet, cukup ubah `source`/`path`/`frame`/`frames`
 * di sini; `AssetKeys` dan seluruh konsumen tidak perlu diubah.
 */
export const AssetManifest = {
    /** Dimuat di scene Boot (aset minimal untuk Preloader). */
    boot: [
        { key: AssetKeys.Background, source: 'file', path: 'assets/bg.png' }
    ],
    /** Dimuat di scene Preloader. */
    main: [
        { key: AssetKeys.Logo, source: 'file', path: 'assets/logo.png' }
    ],
    /** Digenerate saat Preloader.create() sebagai placeholder sementara. */
    placeholders: [
        { key: AssetKeys.Player, source: 'generated', frameCount: 1 },
        { key: AssetKeys.PlayerIdleAlt, source: 'generated', frameCount: 1 },
        { key: AssetKeys.Enemy, source: 'generated', frameCount: 1 },
        { key: AssetKeys.PlayerBullet, source: 'generated', frameCount: 1 },
        { key: AssetKeys.EnemyBullet, source: 'generated', frameCount: 1 },
        { key: AssetKeys.PowerUpIconAtkSpeed, source: 'generated', frameCount: 1 },
        { key: AssetKeys.PowerUpIconShield, source: 'generated', frameCount: 1 },
        { key: AssetKeys.PowerUpIconLane, source: 'generated', frameCount: 1 },
        { key: AssetKeys.PowerUpIconLaser, source: 'generated', frameCount: 1 },
        { key: AssetKeys.PowerUpIconNuke, source: 'generated', frameCount: 1 },
        { key: AssetKeys.PowerUpIconLife, source: 'generated', frameCount: 1 }
    ],
    /** Animasi global yang didaftarkan sekali di Preloader. */
    animations: {
        playerIdle: {
            key: 'player-idle',
            frames: [
                { texture: AssetKeys.Player },
                { texture: AssetKeys.PlayerIdleAlt }
            ],
            frameRate: 2,
            repeat: -1
        }
    }
} satisfies AssetManifestShape;

/** Kunci animasi yang dipakai entity. */
export const AnimKeys = {
    PlayerIdle: AssetManifest.animations.playerIdle.key
} as const;
