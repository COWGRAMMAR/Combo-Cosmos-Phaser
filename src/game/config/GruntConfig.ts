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
    poolSize: 96,
    weapon: {
        /** Jeda antar tembakan setelah tembakan pertama, dalam milidetik. */
        fireIntervalMs: 1400,
        /** Jeda sebelum tembakan pertama, dalam milidetik. */
        initialFireDelayMs: 700,
        bulletSpeed: 220,
        /** Jarak muzzle dari pusat Grunt, searah sudut tembak. */
        muzzleOffsetY: 18
    }
} as const;
