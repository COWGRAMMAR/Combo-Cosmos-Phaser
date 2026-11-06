/**
 * Urutan layer render dari belakang ke depan.
 * Jarak antar layer dibuat lebar supaya layer baru bisa disisipkan tanpa
 * menggeser nilai layer lain.
 */
export const DepthConfig = {
    background: 0,
    playerBullet: 100,
    enemy: 200,
    enemyBullet: 300,
    player: 400,
    effect: 500,
    worldUi: 600
} as const;
