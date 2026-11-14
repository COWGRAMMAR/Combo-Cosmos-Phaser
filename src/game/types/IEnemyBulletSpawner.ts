/**
 * Kontrak spawner peluru musuh.
 * Entity memakai kontrak ini agar tidak perlu mengimpor `systems/` secara runtime.
 */
export interface IEnemyBulletSpawner
{
    spawn(x: number, y: number, velocityX: number, velocityY: number): unknown;
}
