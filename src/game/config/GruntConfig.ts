import { ScreenConfig } from './ScreenConfig';

export type GruntAimMode = 'down' | 'targeted';

/** Jenis pola dasar yang bisa diulang oleh RainFormation. */
export type GruntRainType = 'single' | 'wall' | 'stream';

/** X tengah play area dalam koordinat lokal gameplay. */
const PLAY_CENTER_X = ScreenConfig.playArea.centerX;

/** Tinggi play area dalam koordinat lokal gameplay. */
const PLAY_HEIGHT = ScreenConfig.playArea.height;

/**
 * Jarak Grunt di luar batas play area, dipakai dua arah:
 * spawn di atas (`-OFF_SCREEN_MARGIN`) dan despawn di bawah (`PLAY_HEIGHT + margin`).
 */
const OFF_SCREEN_MARGIN = 48;

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
    despawnY: PLAY_HEIGHT + OFF_SCREEN_MARGIN,
    /** Jarak spawn di atas play area; spawn memakai y = -spawnMargin. */
    spawnMargin: OFF_SCREEN_MARGIN,
    poolSize: 96,
    weapon: {
        /**
         * Arah tembakan: 'down' mengikuti sudut gerak Grunt,
         * 'targeted' mengarah ke posisi target saat peluru ditembakkan.
         */
        aimMode: 'targeted' as GruntAimMode,
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
        /**
         * X spawn untuk semua pola saat mode rain; menggantikan X bawaan pola.
         * Default di tengah play area; geser nilainya (mis. `PLAY_CENTER_X - 80`)
         * untuk menguji bahwa override benar-benar bekerja.
         */
        spawnX: PLAY_CENTER_X,
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
