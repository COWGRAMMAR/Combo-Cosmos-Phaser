/**
 * Nilai yang bisa diubah untuk pemain dan senjata utamanya.
 * Angka di sini sengaja dipisah dari musuh supaya mudah di-tune sendiri.
 */
export const PlayerConfig = {
    /** Kecepatan player */
    moveSpeed: 360,
    /** Radius body fisika */
    bodyRadius: 20,
    /** Radius hitbox kecil gaya bullet-hell, terpisah dari ukuran sprite. */
    hitRadius: 7,
    /** Nyawa awal */
    lives: 3,
    /** Batas maksimum nyawa dari power-up tambah nyawa. */
    maxLives: 5,
    /** HP maksimal (pemain pakai sistem lives, bukan HP; dipertahankan agar BaseEntity.isAlive benar). */
    maxHp: 100,
    /** Durasi kebal setelah terkena tembakan, dalam milidetik. */
    invulnMs: 1100,
    /** Jeda kedip alpha selama kebal, dalam milidetik. */
    invulnBlinkMs: 150,
    dashAlpha: 1,
    invulnAlpha: 0.4,
    normalAlpha: 1,
    /** Gelombang kejut yang menghapus peluru musuh di sekitar pemain. */
    shockwave: {
        /** Radius akhir gelombang, dalam piksel. */
        maxRadius: 100,
        /** Kecepatan melebar gelombang, dalam piksel per detik. */
        growSpeed: 800
    },
    /** Efek durasi: menembak lebih cepat. */
    atkSpeed: {
        durationMs: 7000,
        /** Cooldown menembak dikali nilai ini saat efek aktif. */
        cooldownMultiplier: 0.40
    },
    /** Efek durasi: kebal semua peluru musuh. */
    shield: {
        durationMs: 10000
    },
    /** Efek durasi: laser lurus ke depan. */
    laser: {
        durationMs: 7000,
        /** Panjang dan lebar hitbox laser, dalam piksel. */
        length: 800,
        width: 28,
        /** Jeda antar tick damage, dalam milidetik. */
        tickMs: 140,
        /** Damage per tick. */
        damage: 50
    },
    /** Efek durasi: dash untuk menghindar. */
    dash: {
        /** Kecepatan dash, dalam piksel per detik. */
        speed: 1000,
        durationMs: 100,
        cooldownMs: 1300,
        /** Kebal selama dash memakai mekanisme invuln yang sama dengan kena hit. */
        invulnMs: 200
    },
    /** Ledakan bom: damage besar ke semua musuh tanpa langsung destroy. */
    bomb: {
        damage: 9999
    },
    weapon: {
        lanes: 1,
        maxLanes: 5,
        /** Jarak horizontal antar jalur tembakan, dalam piksel. */
        laneSpacing: 20,
        fireCooldownMs: 170,
        bulletSpeed: 950,
        bulletDamage: 10,
        bulletRadius: 5,
        /** Ukuran pool; harus cukup untuk kasus terburuk 5 jalur. */
        poolSize: 400,
        /** Offset titik keluar peluru dari pusat pemain (negatif = ke atas). */
        muzzleOffsetY: -20
    },
} as const;
