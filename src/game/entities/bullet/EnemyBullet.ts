import * as Phaser from 'phaser';
import { DepthConfig } from '../../config/DepthConfig';
import { EnemyConfig } from '../../config/EnemyConfig';
import { Bullet } from './Bullet';

/**
 * Hook perilaku gerak peluru musuh.
 * Manager memanggilnya sekali per frame, jadi teman bisa menambah tipe peluru
 * baru (homing, melengkung, dll) tanpa mengubah manager.
 */
export type EnemyBulletMoveStep = (bullet: EnemyBullet, delta: number) => void;

/** Opsi tambahan saat memunculkan peluru musuh. */
export interface EnemyBulletSpawnOptions
{
    /** Ganti perilaku gerak untuk peluru ini saja. */
    moveStep?: EnemyBulletMoveStep;
    /** Override radius tabrakan. */
    radius?: number;
    /** Batas umur sebagai pengaman, dalam milidetik. */
    maxLifetimeMs?: number;
}

/** Gerak lurus default: posisi ditambah kecepatan dikali delta. */
const defaultMoveStep: EnemyBulletMoveStep = (bullet, delta) =>
{
    const step = delta / 1000;

    bullet.x += bullet.velocityX * step;
    bullet.y += bullet.velocityY * step;
};

/**
 * Peluru musuh tanpa body fisika.
 * Posisi dihitung manual oleh manager supaya ribuan peluru tetap ringan.
 */
export class EnemyBullet extends Bullet
{
    public velocityX: number = 0;
    public velocityY: number = 0;

    /**
     * True setelah peluru pernah berada di dalam layar.
     * Mencegah peluru yang sengaja spawn di luar layar langsung dihapus.
     */
    public hasEnteredScreen: boolean = false;

    /** Sisa umur peluru dalam milidetik. */
    public remainingLifetimeMs: number = 0;

    /** Perilaku gerak yang bisa diganti per peluru. */
    public moveStep: EnemyBulletMoveStep = defaultMoveStep;

    /** Signature constructor mengikuti kebutuhan Group.classType. */
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number)
    {
        super(scene, x, y, texture, EnemyConfig.bullet.radius, frame);

        this.setDepth(DepthConfig.enemyBullet);
    }

    /** Menyiapkan peluru dari pool dengan kecepatan dan opsi tertentu. */
    public launch(
        x: number,
        y: number,
        velocityX: number,
        velocityY: number,
        options?: EnemyBulletSpawnOptions
    ): void
    {
        this.activate(x, y);

        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.radius = options?.radius ?? EnemyConfig.bullet.radius;
        this.remainingLifetimeMs = options?.maxLifetimeMs ?? EnemyConfig.bullet.maxLifetimeMs;
        this.hasEnteredScreen = false;
        this.moveStep = options?.moveStep ?? defaultMoveStep;
    }

    /** Mengembalikan perilaku ke default agar tidak terbawa ke spawn berikutnya. */
    public override deactivate(): void
    {
        this.moveStep = defaultMoveStep;

        super.deactivate();
    }
}
