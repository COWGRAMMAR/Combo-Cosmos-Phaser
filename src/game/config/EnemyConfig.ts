/**
 * Nilai yang bisa diubah untuk musuh dan peluru musuh.
 * File ini adalah titik utama yang akan diubah saat menambah jenis musuh.
 */
export const EnemyConfig = {
    maxHp: 100,
    moveSpeed: 10,
    bodyRadius: 20,
    /** Umpan balik visual saat musuh terkena damage. */
    hitFlash: {
        /** Warna siluet saat tertembak; memakai bentuk asli tekstur. */
        color: 0xff3b30,
        /** Lama siluet bertahan, dalam milidetik; naikkan kalau kurang terlihat. */
        durationMs: 90
    },
    /** Umpan balik visual saat musuh mati. */
    explosion: {
        /** Warna isi lingkaran ledakan. */
        color: 0xff3b30,
        /** Warna cincin luar ledakan. */
        ringColor: 0xff8a7a,
        /** Lama animasi ledakan, dalam milidetik. */
        durationMs: 250,
        /** Skala awal relatif terhadap tekstur (1 = seukuran tekstur 48 px). */
        scaleFrom: 0.8,
        /** Skala akhir saat ledakan hampir hilang. */
        scaleTo: 2.2,
        /** Jumlah sprite yang disiapkan; pool penuh membuat ledakan dilewati. */
        poolSize: 32
    },
    bullet: {
        /** Kecepatan default peluru musuh, dalam piksel per detik. */
        speed: 180,
        radius: 5,
        /** Pool harus muat untuk stress test 3000 peluru. */
        poolSize: 10000,
        /** Jarak di luar layar sebelum peluru dianggap keluar. */
        offScreenMargin: 16,
        /** Batas umur peluru sebagai pengaman kalau tidak pernah keluar layar. */
        maxLifetimeMs: 15000
    }
} as const;
