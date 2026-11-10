/** Kunci tekstur yang dipakai di seluruh game. */
export const AssetKeys = {
    Player: 'player',
    Enemy: 'enemy',
    PlayerBullet: 'player-bullet',
    EnemyBullet: 'enemy-bullet',
    Background: 'background',
    Logo: 'logo',
    /** Frame kedua placeholder player; dihapus saat migrasi atlas. */
    PlayerIdleAlt: 'player-idle-alt',

    /** Ikon placeholder power-up (diganti file asli nanti via manifest). */
    PowerUpIconAtkSpeed: 'powerup-icon-atk-speed',
    PowerUpIconShield: 'powerup-icon-shield',
    PowerUpIconLane: 'powerup-icon-lane',
    PowerUpIconLaser: 'powerup-icon-laser',
    PowerUpIconNuke: 'powerup-icon-nuke',
    PowerUpIconLife: 'powerup-icon-life',
} as const;

/** Gabungan seluruh nilai kunci aset yang sah. */
export type AssetKey = (typeof AssetKeys)[keyof typeof AssetKeys];
