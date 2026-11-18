import { ScreenConfig } from './ScreenConfig';

export type GruntAimMode = 'down' | 'targeted';

/** Jenis pola dasar yang bisa diulang oleh RainFormation. */
export type GruntRainType = 'single' | 'wall' | 'stream';

/** X tengah play area dalam koordinat lokal gameplay. */
const PLAY_CENTER_X = ScreenConfig.playArea.width / 2;

/**
 * Nilai yang bisa diubah untuk Grunt (Tipe 1).
 * Parameter pola gerak ditambahkan per fase saat polanya benar-benar dipakai.
 */
export const GruntConfig = {
    maxHp: 30,
    bodyRadius: 20,
    /** Nilai dasar BaseEntity; kecepatan sebenarnya diatur oleh movement pattern. */
    moveSpeed: 0,
    /** Batas Y untuk membuang Grunt yang sudah melewati bawah play area. */
    despawnY: 1128,
    /** Jarak spawn di atas play area; spawn memakai y = -spawnMargin. */
    spawnMargin: 48,
    poolSize: 96,
    weapon: {
        /**
         * Arah tembakan: 'down' mengikuti sudut gerak Grunt,
         * 'targeted' mengarah ke posisi target saat peluru ditembakkan.
         */
        aimMode: 'down' as GruntAimMode,
        /** Jeda antar tembakan setelah tembakan pertama, dalam milidetik. */
        fireIntervalMs: 1000,
        /** Jeda sebelum tembakan pertama, dalam milidetik. */
        initialFireDelayMs: 700,
        bulletSpeed: 250,
        /** Jarak muzzle dari pusat Grunt, searah sudut tembak. */
        muzzleOffsetY: 18
    },

    single: {
        /** X spawn unit tunggal; mengikuti tengah play area. */
        spawnX: PLAY_CENTER_X,
        moveSpeed: 140,
        moveAngleDeg: 0
    },

    rain: {
        /** Jenis pola dasar yang diulang; bukan rotasi otomatis. */
        type: 'wall' as GruntRainType,
        /** X spawn untuk semua pola saat mode rain; menggantikan X bawaan pola. */
        spawnX: 450,
        /** Berapa pola yang dimunculkan sebelum rain selesai. */
        count: 10,
        /** Jeda setelah satu pola selesai, sebelum pola berikutnya, dalam milidetik. */
        intervalMs: 1000,
        /** Variasi acak jeda, plus-minus dalam milidetik; 0 membuat jeda tetap. */
        jitterMs: 0
    },

    wall: {
        /** Jumlah Grunt dalam satu baris. */
        count: 3,
        /** Jarak antar pusat Grunt dalam baris. */
        spacing: 84,
        /** X pusat baris; mengikuti tengah play area. */
        centerX: PLAY_CENTER_X,
        moveSpeed: 120,
        moveAngleDeg: 0
    },

    stream: {
        /** Jumlah Grunt dalam satu kolom. */
        count: 10,
        /** Jarak vertikal antar Grunt dalam kolom. */
        spacing: 72,
        /** Jeda antar unit dalam satu kolom, dalam milidetik. */
        streamDelayMs: 200,
        /** X kolom; mengikuti tengah play area. */
        spawnX: PLAY_CENTER_X,
        moveSpeed: 150,
        moveAngleDeg: 0
    }
} as const;
