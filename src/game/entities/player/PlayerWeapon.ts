import * as Phaser from 'phaser';
import { AssetKeys } from '../../config/AssetKeys';
import { PlayerConfig } from '../../config/PlayerConfig';
import { PlayerBullet } from '../bullet/PlayerBullet';

/**
 * Mengatur cooldown dan jumlah jalur tembakan pemain.
 * Pemain hanya memberi posisi muzzle dan status tombol tembak, sehingga
 * tidak ada ketergantungan balik ke kelas Player.
 */
export class PlayerWeapon
{
    private readonly scene: Phaser.Scene;
    private readonly group: Phaser.Physics.Arcade.Group;
    /** Cache semua peluru agar loop tidak membuat array baru setiap frame. */
    private readonly bullets: PlayerBullet[];
    private cooldownRemainingMs: number = 0;
    private lanes: number = PlayerConfig.weapon.lanes;
    private cooldownMultiplier: number = 1;
    private _overflowCount: number = 0;

    /**
     * Membuat pool peluru pemain dan mengisinya di awal.
     * Pool diisi awal supaya group tidak membuat objek baru saat gameplay berjalan.
     */
    constructor(scene: Phaser.Scene)
    {
        this.scene = scene;
        this.group = scene.physics.add.group({
            classType: PlayerBullet,
            maxSize: PlayerConfig.weapon.poolSize,
            defaultKey: AssetKeys.PlayerBullet
        });

        for (let i = 0; i < PlayerConfig.weapon.poolSize; i++)
        {
            this.group.create(0, 0, AssetKeys.PlayerBullet, undefined, false, false);
        }

        this.bullets = Array.from(this.group.children) as PlayerBullet[];
    }

    /** Pool peluru pemain untuk didaftarkan ke collision. */
    get bulletGroup(): Phaser.Physics.Arcade.Group
    {
        return this.group;
    }

    /** Jumlah jalur tembakan saat ini. */
    get laneCount(): number
    {
        return this.lanes;
    }

    /** Berapa kali spawn gagal karena pool penuh. */
    get overflowCount(): number
    {
        return this._overflowCount;
    }

    /** Menembak jika cooldown sudah habis dan tombol tembak ditekan. */
    public update(
        delta: number,
        muzzleX: number,
        muzzleY: number,
        firing: boolean
    ): void
    {
        this.cullOffScreen();

        if (this.cooldownRemainingMs > 0)
        {
            this.cooldownRemainingMs = Math.max(0, this.cooldownRemainingMs - delta);
        }

        if (!firing || this.cooldownRemainingMs > 0)
        {
            return;
        }

        this.cooldownRemainingMs = PlayerConfig.weapon.fireCooldownMs * this.cooldownMultiplier;
        this.fire(muzzleX, muzzleY);
    }

    /** Menambah satu jalur tembakan, kembali ke 1 setelah mencapai batas. */
    public cycleLanes(): void
    {
        this.lanes = this.lanes >= PlayerConfig.weapon.maxLanes ? 1 : this.lanes + 1;
    }

    /** Mengatur jumlah jalur secara langsung, otomatis dijepit ke batas config. */
    public setLanes(count: number): void
    {
        this.lanes = Phaser.Math.Clamp(count, 1, PlayerConfig.weapon.maxLanes);
    }

    /** Menambah satu jalur permanen selama run, dijepit ke maxLanes. */
    public addLane(): void
    {
        this.setLanes(this.lanes + 1);
    }

    /** Mengubah pengali cooldown selama efek atk speed aktif. */
    public setCooldownMultiplier(multiplier: number): void
    {
        this.cooldownMultiplier = multiplier > 0 ? multiplier : 1;
    }

    /** Mengembalikan cooldown, jalur, dan penghitung overflow ke kondisi awal. */
    public reset(): void
    {
        this.cooldownRemainingMs = 0;
        this.lanes = PlayerConfig.weapon.lanes;
        this.cooldownMultiplier = 1;
        this._overflowCount = 0;
    }

    /** Menonaktifkan semua peluru pemain yang masih aktif. */
    public clearAll(): void
    {
        for (let i = 0; i < this.bullets.length; i++)
        {
            if (this.bullets[i].active)
            {
                this.bullets[i].deactivate();
            }
        }
    }

    /**
     * Mengembalikan peluru yang sudah keluar area permainan ke pool.
     * Dilakukan manual karena collideWorldBounds membuat peluru berhenti di tepi layar.
     */
    private cullOffScreen(): void
    {
        const bounds = this.scene.physics.world.bounds;
        const bullets = this.bullets;

        for (let i = 0; i < bullets.length; i++)
        {
            const bullet = bullets[i];

            if (!bullet.active)
            {
                continue;
            }

            if (
                bullet.y + bullet.radius < bounds.y ||
                bullet.y - bullet.radius > bounds.bottom ||
                bullet.x + bullet.radius < bounds.x ||
                bullet.x - bullet.radius > bounds.right
            ) {
                bullet.deactivate();
            }
        }
    }

    /** Menembakkan satu peluru per jalur dengan offset simetris terhadap pusat. */
    private fire(x: number, y: number): void
    {
        const laneCount = this.lanes;
        const laneCenter = (laneCount - 1) / 2;
        const spacing = PlayerConfig.weapon.laneSpacing;
        const speed = PlayerConfig.weapon.bulletSpeed;

        for (let i = 0; i < laneCount; i++)
        {
            const laneX = x + (i - laneCenter) * spacing;
            const bullet = this.group.get(laneX, y) as PlayerBullet | null;

            if (!bullet)
            {
                this._overflowCount++;
                continue;
            }

            bullet.fire(laneX, y, 0, -speed);
        }
    }
}
