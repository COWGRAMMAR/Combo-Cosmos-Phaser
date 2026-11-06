/**
 * Nilai yang bisa diubah untuk pemain dan senjata utamanya.
 * Angka di sini sengaja dipisah dari musuh supaya mudah di-tune sendiri.
 */
export const PlayerConfig = {
    maxHp: 100,
    moveSpeed: 300,
    bodyRadius: 16,
    /** Radius hitbox kecil gaya bullet-hell, terpisah dari ukuran sprite. */
    hitRadius: 6,
    lives: 3,
    /** Batas maksimum nyawa dari power-up tambah nyawa. */
    maxLives: 5,
    /** Durasi kebal setelah terkena tembakan, dalam milidetik. */
    invulnMs: 1200,
    /** Jeda kedip alpha selama kebal, dalam milidetik. */
    invulnBlinkMs: 80,
    dashAlpha: 0.7,
    invulnAlpha: 0.35,
    normalAlpha: 1,
    /** Gelombang kejut yang menghapus peluru musuh di sekitar pemain. */
    shockwave: {
        /** Radius akhir gelombang, dalam piksel. */
        maxRadius: 170,
        /** Kecepatan melebar gelombang, dalam piksel per detik. */
        growSpeed: 900
    },
    /** Efek durasi: menembak lebih cepat. */
    atkSpeed: {
        durationMs: 8000,
        /** Cooldown menembak dikali nilai ini saat efek aktif. */
        cooldownMultiplier: 0.45
    },
    /** Efek durasi: kebal semua peluru musuh. */
    shield: {
        durationMs: 8000
    },
    /** Efek durasi: laser lurus ke depan. */
    laser: {
        durationMs: 6000,
        /** Panjang dan lebar hitbox laser, dalam piksel. */
        length: 560,
        width: 18,
        /** Jeda antar tick damage, dalam milidetik. */
        tickMs: 120,
        /** Damage per tick. */
        damage: 45
    },
    /** Efek durasi: dash untuk menghindar. */
    dash: {
        /** Kecepatan dash, dalam piksel per detik. */
        speed: 900,
        durationMs: 150,
        cooldownMs: 1200,
        /** Kebal selama dash memakai mekanisme invuln yang sama dengan kena hit. */
        invulnMs: 220
    },
    /** Ledakan bom: damage besar ke semua musuh tanpa langsung destroy. */
    bomb: {
        damage: 9999
    },
    weapon: {
        lanes: 1,
        maxLanes: 5,
        /** Jarak horizontal antar jalur tembakan, dalam piksel. */
        laneSpacing: 18,
        fireCooldownMs: 90,
        bulletSpeed: 700,
        bulletDamage: 10,
        bulletRadius: 4,
        /** Ukuran pool; harus cukup untuk kasus terburuk 5 jalur. */
        poolSize: 400,
        /** Offset titik keluar peluru dari pusat pemain (negatif = ke atas). */
        muzzleOffsetY: -24
    }
} as const;
