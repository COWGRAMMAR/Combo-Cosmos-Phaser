/**
 * Nilai konfigurasi untuk sistem power-up.
 * Semua angka dan pengaturan terkait spawn, slot, dan item visual ada di sini,
 * bukan di file implementasi (scenes, entities, systems).
 */
export const PowerUpConfig = {
    /** Jumlah slot inventory power-up. */
    slotCount: 3,

    /** Max stack per slot per jenis buff (hanya Slotted; Lane & Life dikecualikan karena AutoPickup). */
    maxStackPerSlot: {
        'atk-speed': 3,
        shield: 2,
        laser: 2,
        nuke: 1
    },

    /** Interval spawn item power-up, dalam milidetik. */
    spawnIntervalMs: 1000,

    /** Jitter random (±ms) ditambahkan ke interval spawn agar tidak teratur. */
    spawnJitterMs: 1000,

    /** Jarak margin dari tepis area bermain saat spawn item, dalam piksel. */
    spawnMargin: 60,

    /** Radius lingkaran item power-up, dalam piksel. */
    itemRadius: 12,

    /** Warna lingkaran item power-up (hex). */
    itemColor: 0xffd700,

    /** Alpha lingkaran item power-up. */
    itemAlpha: 0.9,

    /** Depth rendering lingkaran item power-up. */
    itemDepth: 50,

    /** Radius body fisika lingkaran item, dalam piksel. */
    itemBodyRadius: 12,

    /** Waktu auto-despawn item jika tidak diambil, dalam milidetik. */
    itemDespawnMs: 10000,

    /** Bobot spawn per jenis power-up (semakin tinggi semakin sering). */
    bobot: {
        lane: 3,
        'atk-speed': 2,
        shield: 2,
        laser: 1,
        nuke: 1,
        life: 2
    },

    /** Warna placeholder ikon per jenis buff (hex). Digunakan AssetManager untuk menggambar lingkaran placeholder. */
    iconColor: {
        'atk-speed': 0x7df9ff,
        shield: 0x4da6ff,
        lane: 0xff8c00,
        laser: 0x8a2be2,
        nuke: 0xff0000,
        life: 0x00ff00,
    },

    /** Kunci aset ikon placeholder per jenis buff (nama properti AssetKeys). Digunakan UI untuk menampilkan ikon yang konsisten. */
    iconKey: {
        'atk-speed': 'powerup-icon-atk-speed',
        shield: 'powerup-icon-shield',
        lane: 'powerup-icon-lane',
        laser: 'powerup-icon-laser',
        nuke: 'powerup-icon-nuke',
        life: 'powerup-icon-life',
    },

    /** Nama properti AssetKeys per jenis buff (digunakan untuk resolve tekstur ikon). */
    iconAssetKey: {
        'atk-speed': 'PowerUpIconAtkSpeed',
        shield: 'PowerUpIconShield',
        lane: 'PowerUpIconLane',
        laser: 'PowerUpIconLaser',
        nuke: 'PowerUpIconNuke',
        life: 'PowerUpIconLife',
    }
} as const;
