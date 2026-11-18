import * as Phaser from 'phaser';
import { AssetKeys } from '../config/AssetKeys';
import { EnemyConfig } from '../config/EnemyConfig';
import { EnemyBullet } from '../entities/bullet/EnemyBullet';
import type { EnemyBulletSpawnOptions } from '../entities/bullet/EnemyBullet';
import type { Player } from '../entities/player/Player';
import type { AssetRef } from '../types/AssetRef';
import { AssetManager } from './AssetManager';

/**
 * Mengelola seluruh peluru musuh dalam satu loop.
 * Peluru tidak memakai body fisika: pergerakan, pengecekan keluar layar, dan
 * tabrakan dengan pemain dihitung manual dalam satu pass per frame.
 */
export class EnemyBulletManager
{
    private readonly group: Phaser.GameObjects.Group;
    /** Cache semua peluru agar loop tidak membuat array baru setiap frame. */
    private readonly bullets: EnemyBullet[];
    private readonly scene: Phaser.Scene;
    private readonly player: Player;
    private readonly onPlayerHit?: () => void;
    /** Referensi tekstur peluru musuh hasil resolve manifest aset. */
    private readonly bulletAsset: AssetRef;
    /** Free-list peluru idle: pop di spawn, push di despawn (O(1), tanpa scan linier). */
    private readonly _idle: EnemyBullet[] = [];

    private _activeCount: number = 0;
    private _maxActive: number = 0;
    private _overflowCount: number = 0;
    private _playerHitCount: number = 0;

    /** Total EnemyBullet objek yang pernah dibuat (termasih pre-warm konstruktor). */
    private _totalCreated: number = 0;
    /** Jumlah objek baru yang dibuat dalam frame ini (harus 0 selama gameplay karena pool pre-warm). */
    private _createdThisFrame: number = 0;
    /** Total waktu yang dihabiskan di spawn() selama frame ini, dalam milidetik. */
    private _spawnMsThisFrame: number = 0;

    /**
     * Membuat pool peluru musuh dan mengisinya di awal.
     * Callback onPlayerHit dipakai tahap berikutnya untuk event 'player-hit'.
     */
    constructor(scene: Phaser.Scene, player: Player, onPlayerHit?: () => void)
    {
        this.scene = scene;
        this.player = player;
        this.onPlayerHit = onPlayerHit;
        this.bulletAsset = AssetManager.resolve(AssetKeys.EnemyBullet);

        this.group = scene.add.group({
            classType: EnemyBullet,
            maxSize: EnemyConfig.bullet.poolSize,
            defaultKey: this.bulletAsset.texture
        });

        for (let i = 0; i < EnemyConfig.bullet.poolSize; i++)
        {
            this.group.create(0, 0, this.bulletAsset.texture, this.bulletAsset.frame, false, false);
            this._totalCreated++;
        }

        this.bullets = Array.from(this.group.children) as EnemyBullet[];

        // Semua peluru pre-warm mulai dalam keadaan idle, siap dipakai lewat free-list.
        for (const bullet of this.bullets)
        {
            this._idle.push(bullet);
        }
    }

    /** Pool peluru musuh, disediakan untuk kebutuhan debug atau sistem lain. */
    get bulletGroup(): Phaser.GameObjects.Group
    {
        return this.group;
    }

    /** Jumlah peluru musuh yang aktif saat ini. */
    get activeCount(): number
    {
        return this._activeCount;
    }

    /** Puncak jumlah peluru aktif sejak terakhir reset. */
    get maxActive(): number
    {
        return this._maxActive;
    }

    /** Berapa kali spawn gagal karena pool penuh. */
    get overflowCount(): number
    {
        return this._overflowCount;
    }

    /** Berapa kali peluru musuh mengenai pemain. */
    get playerHitCount(): number
    {
        return this._playerHitCount;
    }

    /** Total EnemyBullet objek yang pernah dibuat. */
    get totalCreated(): number
    {
        return this._totalCreated;
    }

    /** Jumlah EnemyBullet baru yang dibuat dalam frame ini. */
    get createdThisFrame(): number
    {
        return this._createdThisFrame;
    }

    /** Waktu total yang dihabiskan di spawn() selama frame ini, dalam milidetik. */
    get spawnMsThisFrame(): number
    {
        return this._spawnMsThisFrame;
    }

    /**
     * Memunculkan satu peluru dari pool.
     * Mengembalikan null tanpa error kalau pool sudah penuh.
     */
    public spawn(
        x: number,
        y: number,
        velocityX: number,
        velocityY: number,
        options?: EnemyBulletSpawnOptions
    ): EnemyBullet | null
    {
        const bullet = this._idle.pop() as EnemyBullet | null;

        if (!bullet)
        {
            this._overflowCount++;
            return null;
        }

        bullet.launch(x, y, velocityX, velocityY, options);

        this._activeCount++;

        if (this._activeCount > this._maxActive)
        {
            this._maxActive = this._activeCount;
        }

        return bullet;
    }

    /** Satu pass per frame: gerak, tabrakan pemain, lalu buang yang keluar layar. */
    public update(delta: number): void
    {
        this._createdThisFrame = 0;
        this._spawnMsThisFrame = 0;

        const bounds = this.scene.physics.world.bounds;
        const margin = EnemyConfig.bullet.offScreenMargin;
        const player = this.player;
        const canHitPlayer = player.active && player.isAlive && !player.isDamageImmune();

        // Maksimal satu peluru yang dihitung mengenai pemain per frame
        // supaya pemain tidak kehilangan banyak HP sekaligus.
        let playerHitThisFrame = false;

        for (let i = 0; i < this.bullets.length; i++)
        {
            const bullet = this.bullets[i];

            if (!bullet.active)
            {
                continue;
            }

            bullet.moveStep(bullet, delta);

            const bulletX = bullet.x;
            const bulletY = bullet.y;

            if (
                !bullet.hasEnteredScreen &&
                bulletX >= bounds.x && bulletX <= bounds.right &&
                bulletY >= bounds.y && bulletY <= bounds.bottom
            )
            {
                bullet.hasEnteredScreen = true;
            }

            if (canHitPlayer && !playerHitThisFrame)
            {
                const dx = bulletX - player.x;
                const dy = bulletY - player.y;
                const hitRadius = player.hitRadius + bullet.radius;

                if (dx * dx + dy * dy <= hitRadius * hitRadius)
                {
                    playerHitThisFrame = true;
                    this._playerHitCount++;
                    this.despawn(bullet);
                    this.onPlayerHit?.();
                    continue;
                }
            }

            bullet.remainingLifetimeMs -= delta;

            const outside = bullet.hasEnteredScreen && (
                bulletX < bounds.x - margin ||
                bulletX > bounds.right + margin ||
                bulletY < bounds.y - margin ||
                bulletY > bounds.bottom + margin
            );

            if (outside || bullet.remainingLifetimeMs <= 0)
            {
                this.despawn(bullet);
            }
        }
    }

    /** Menonaktifkan seluruh peluru musuh (dipakai nuke dan reset). */
    public clearAll(): void
    {
        for (let i = 0; i < this.bullets.length; i++)
        {
            this.despawn(this.bullets[i]);
        }
    }

    /** Menonaktifkan peluru musuh di dalam radius tertentu. */
    public clearInRadius(x: number, y: number, radius: number): void
    {
        const radiusSq = radius * radius;

        for (let i = 0; i < this.bullets.length; i++)
        {
            const bullet = this.bullets[i];

            if (!bullet.active)
            {
                continue;
            }

            const dx = bullet.x - x;
            const dy = bullet.y - y;

            if (dx * dx + dy * dy <= radiusSq)
            {
                this.despawn(bullet);
            }
        }
    }

    /** Mengosongkan pool dan mengembalikan seluruh statistik ke nol. */
    public reset(): void
    {
        this.clearAll();

        this._maxActive = 0;
        this._overflowCount = 0;
        this._playerHitCount = 0;
        this._totalCreated = 0;
        this._createdThisFrame = 0;
        this._spawnMsThisFrame = 0;
    }

    /** Mengembalikan satu peluru ke pool sambil menjaga penghitung tetap akurat. */
    private despawn(bullet: EnemyBullet): void
    {
        if (!bullet.active)
        {
            return;
        }

        bullet.deactivate();
        this._activeCount--;
        this._idle.push(bullet);
    }
}
