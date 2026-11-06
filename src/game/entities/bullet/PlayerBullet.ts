import * as Phaser from 'phaser';
import { DepthConfig } from '../../config/DepthConfig';
import { PlayerConfig } from '../../config/PlayerConfig';
import { Bullet } from './Bullet';

/**
 * Peluru pemain yang memakai body fisika Arcade.
 * Pergerakan dan tabrakan ditangani Phaser; kelas ini hanya mengurus
 * aktivasi dari pool dan pengembalian ke pool.
 */
export class PlayerBullet extends Bullet
{
    /** Damage yang diberikan saat mengenai musuh. */
    public damage: number = PlayerConfig.weapon.bulletDamage;

    /**
     * Membuat body fisika untuk peluru.
     * Signature constructor mengikuti kebutuhan Group.classType: (scene, x, y, texture, frame).
     */
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number)
    {
        super(scene, x, y, texture, PlayerConfig.weapon.bulletRadius, frame);

        scene.physics.add.existing(this);

        const body = this.body as Phaser.Physics.Arcade.Body;

        body.setCircle(PlayerConfig.weapon.bulletRadius);

        // Sengaja TIDAK memakai collideWorldBounds: Phaser mengunci body di tepi
        // dunia (kecepatan jadi 0), peluru menumpuk di atas dan pool akhirnya habis.
        // Peluru di luar layar dibuang manual oleh PlayerWeapon.cullOffScreen().

        this.setDepth(DepthConfig.playerBullet);
    }

    /** Menembakkan peluru dari posisi tertentu dengan kecepatan tertentu. */
    public fire(x: number, y: number, velocityX: number, velocityY: number): void
    {
        this.activate(x, y);

        const body = this.body as Phaser.Physics.Arcade.Body;

        body.enable = true;
        body.reset(x, y);
        body.setVelocity(velocityX, velocityY);
    }

    /** Menghentikan body lalu menyembunyikan peluru. */
    public override deactivate(): void
    {
        const body = this.body as Phaser.Physics.Arcade.Body;

        body.stop();
        body.enable = false;

        super.deactivate();
    }
}
