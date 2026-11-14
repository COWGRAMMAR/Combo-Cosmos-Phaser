/** Skenario tes Grunt yang bisa dipilih tanpa WaveManager. */
export type EnemyTestScenario =
    | 'static'
    | 'rain'
    | 'wall'
    | 'stream-straight'
    | 'stream-diagonal';

/**
 * Konfigurasi harness tes enemy.
 * Ubah `scenario` lalu tekan tombol reset untuk menjalankan skenario dari awal.
 * Skenario 'static' dan 'rain' sudah tersedia; Wall/Stream menyusul.
 */
export const EnemyTestConfig = {
    /** Matikan untuk menonaktifkan spawn tes dan tombol reset. */
    enabled: true,
    scenario: 'rain' as EnemyTestScenario,
    /** Nama key Phaser untuk memunculkan ulang skenario. */
    resetKey: 'R',
    /** False membuat skenario tetap berjalan sekali, tetapi tombol reset tidak didaftarkan. */
    resetKeyEnabled: true,
    staticSpawn: {
        x: 405,
        y: 180,
        speed: 0,
        angleDeg: 0
    },
    /** Jumlah unit per batch tes Rain. */
    rainCount: 100,
    /** Berapa formasi yang dimunculkan sekali run pada tes Wall/Stream. */
    formationRepeat: 2
} as const;
