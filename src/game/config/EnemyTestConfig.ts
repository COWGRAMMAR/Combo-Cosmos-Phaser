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
 * Saat ini hanya 'static' yang sudah diimplementasikan; skenario lain
 * menyusul pada fase Rain/Wall/Stream.
 */
export const EnemyTestConfig = {
    /** Matikan untuk menonaktifkan spawn tes dan tombol reset. */
    enabled: true,
    scenario: 'static' as EnemyTestScenario,
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
    rainCount: 12,
    /** Berapa formasi yang dimunculkan sekali run pada tes Wall/Stream. */
    formationRepeat: 2
} as const;
