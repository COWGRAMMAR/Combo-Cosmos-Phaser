/** Skenario tes Grunt yang bisa dipilih tanpa WaveManager. */
export type EnemyTestScenario =
    | 'single'
    | 'wall'
    | 'stream'
    | 'rain';

/**
 * Konfigurasi harness tes enemy.
 * Ubah `scenario` lalu tekan tombol reset untuk menjalankan skenario dari awal.
 * Skenario single/wall/stream memunculkan satu pola dasar; rain mengulang
 * jenis pola yang dipilih di `GruntConfig.rain`.
 */
export const EnemyTestConfig = {
    /** Matikan untuk menonaktifkan spawn tes dan tombol reset. */
    enabled: false,
    scenario: 'rain' as EnemyTestScenario,
    /** Nama key Phaser untuk memunculkan ulang skenario. */
    resetKey: 'R',
    /** False membuat skenario tetap berjalan sekali, tetapi tombol reset tidak didaftarkan. */
    resetKeyEnabled: true
} as const;
