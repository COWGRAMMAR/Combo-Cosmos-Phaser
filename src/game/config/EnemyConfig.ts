/**
 * Nilai yang bisa diubah untuk musuh dan peluru musuh.
 * File ini adalah titik utama yang akan diubah saat menambah jenis musuh.
 */
export const EnemyConfig = {
    maxHp: 100,
    moveSpeed: 0,
    bodyRadius: 20,
    /** Jeda sebelum dummy musuh muncul lagi, dalam milidetik. */
    respawnDelayMs: 1000,
    bullet: {
        /** Kecepatan default peluru musuh, dalam piksel per detik. */
        speed: 180,
        radius: 5,
        /** Pool harus muat untuk stress test 3000 peluru. */
        poolSize: 8192,
        /** Jarak di luar layar sebelum peluru dianggap keluar. */
        offScreenMargin: 32,
        /** Batas umur peluru sebagai pengaman kalau tidak pernah keluar layar. */
        maxLifetimeMs: 15000
    }
} as const;
