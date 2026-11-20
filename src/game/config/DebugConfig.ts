import { PowerUpType } from '../types/PowerUpType';

/**
 * Konfigurasi seluruh alat debug: saklar global, tombol, jumlah stress,
 * dan styling visual overlay. Semua nilai debug ada di sini, bukan di
 * file implementasi (DebugTools, DebugOverlay).
 */
export const DebugConfig = {
    /** Saklar global visual debug; false menyembunyikan overlay dan jalur item. */
    enabled: true,

    /** Tombol keyboard untuk tiap aksi debug. */
    keys: {
        /** F1: tampilkan/sembunyikan overlay statistik. */
        overlay: 'F1',

        /** F2: hujan peluru musuh dalam jumlah ringan. */
        stressLight: 'F2',

        /** F3: hujan peluru musuh dalam jumlah berat. */
        stressHeavy: 'F3',

        /** F4: putar jumlah jalur tembak pemain. */
        cycleLanes: 'F4',

        /** Pemetaan tombol Z..N ke jenis power-up, sesuai urutan tombol. */
        powerUps: [
            { type: PowerUpType.Lane, key: 'Z' },
            { type: PowerUpType.AtkSpeed, key: 'X' },
            { type: PowerUpType.Shield, key: 'C' },
            { type: PowerUpType.Laser, key: 'V' },
            { type: PowerUpType.Bomb, key: 'B' },
            { type: PowerUpType.Life, key: 'N' }
        ]
    },

    /** Jumlah peluru yang dijatuhkan saat tombol stress ditekan. */
    stress: {
        /** Jumlah ringan (F2) untuk uji baseline performa. */
        light: 1000,

        /** Jumlah berat (F3) untuk menguji batas pool dan penurunan FPS. */
        heavy: 3000
    },

    /** Styling layer gambar debug. */
    graphics: {
        /** Selisih depth layer debug di atas depth item power-up. */
        depthOffset: 1,

        /** Ketebalan garis untuk kotak zona, ring player, dan arah gerak. */
        lineWidth: 1,

        /** Pengaturan titik prediksi jalur item. */
        path: {
            /** Durasi prediksi jalur yang digambar, dalam milidetik. */
            durationMs: 3000,

            /** Jarak antar titik prediksi, dalam milidetik. */
            stepMs: 100,

            /** Radius tiap titik prediksi, dalam piksel. */
            dotRadius: 2,

            /** Alpha tiap titik prediksi. */
            alpha: 0.35
        },

        /** Pengaturan kotak zona spawn. */
        spawnZone: {
            /** Warna garis kotak dan titik pusat zona (hex). */
            color: 0x00e5ff,

            /** Alpha garis kotak dan garis arah gerak item. */
            alpha: 0.5,

            /** Radius titik penanda pusat zona, dalam piksel. */
            centerRadius: 3
        },

        /** Pengaturan ring jarak minimum spawn di sekitar pemain. */
        playerRing: {
            /** Warna ring (hex). */
            color: 0xff4081,

            /** Alpha ring. */
            alpha: 0.5
        },

        /** Pengaturan garis arah gerak pola straight. */
        direction: {
            /** Panjang garis arah, dalam piksel. */
            length: 40,

            /** Alpha garis arah. */
            alpha: 0.5
        }
    }
} as const;
