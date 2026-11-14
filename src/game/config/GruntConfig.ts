export type GruntAimMode = 'down' | 'targeted';

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
        aimMode: 'targeted' as GruntAimMode,
        /** Jeda antar tembakan setelah tembakan pertama, dalam milidetik. */
        fireIntervalMs: 1000,
        /** Jeda sebelum tembakan pertama, dalam milidetik. */
        initialFireDelayMs: 700,
        bulletSpeed: 250,
        /** Jarak muzzle dari pusat Grunt, searah sudut tembak. */
        muzzleOffsetY: 18
    },

    rain: {
        /** Batas kiri/kanan posisi X acak saat spawn. */
        spawnXMin: 48,
        spawnXMax: 762,
        /** Jeda dasar antar spawn, dalam milidetik. */
        intervalMs: 1500,
        /** Variasi acak jeda spawn, plus-minus dalam milidetik. */
        jitterMs: 500,
        moveSpeed: 140,
        moveAngleDeg: 0
    }
} as const;
