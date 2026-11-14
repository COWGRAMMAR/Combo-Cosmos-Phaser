import * as Phaser from 'phaser';
import { AssetKeys } from '../../config/AssetKeys';
import { GruntConfig } from '../../config/GruntConfig';
import { Grunt } from '../../entities/enemy/Grunt';
import type { IMovementPattern } from '../../entities/enemy/patterns/IMovementPattern';
import type { IEnemyBulletSpawner } from '../../types/IEnemyBulletSpawner';

/**
 * Pool Grunt yang diisi di awal dan dipakai ulang lewat spawn().
 * Group-nya dipakai bersama oleh overlap peluru pemain, laser, dan bom.
 */
export class GruntPool
{
    private readonly group: Phaser.GameObjects.Group;
    /** Cache seluruh Grunt agar loop reset tidak memanggil getChildren() berulang. */
    private readonly grunts: Grunt[];

    private _overflowCount: number = 0;

    /** Membuat seluruh Grunt sekali di awal, lalu menonaktifkannya. */
    constructor(scene: Phaser.Scene, bulletSpawner: IEnemyBulletSpawner)
    {
        this.group = scene.add.group({
            maxSize: GruntConfig.poolSize
        });

        for (let i = 0; i < GruntConfig.poolSize; i++)
        {
            const grunt = new Grunt(scene, 0, 0, AssetKeys.Enemy, bulletSpawner);

            grunt.setActive(false);
            grunt.setVisible(false);

            const body = grunt.body as Phaser.Physics.Arcade.Body;
            body.enable = false;

            this.group.add(grunt, false);
        }

        this.grunts = this.group.getChildren() as Grunt[];
    }

    /** Group yang berisi seluruh Grunt, aktif maupun tidak. */
    get poolGroup(): Phaser.GameObjects.Group
    {
        return this.group;
    }

    /** Jumlah Grunt yang sedang aktif. */
    get activeCount(): number
    {
        return this.group.countActive(true);
    }

    /** Berapa kali spawn gagal karena seluruh pool sedang aktif. */
    get overflowCount(): number
    {
        return this._overflowCount;
    }

    /** Memunculkan satu Grunt dari pool; null kalau pool penuh. */
    public spawn(x: number, y: number, movement: IMovementPattern): Grunt | null
    {
        const grunt = this.group.getFirstDead(false) as Grunt | null;

        if (!grunt)
        {
            this._overflowCount++;
            return null;
        }

        grunt.spawn(x, y, movement);

        return grunt;
    }

    /** Menonaktifkan seluruh Grunt dan mengembalikan penghitung overflow. */
    public reset(): void
    {
        for (let i = 0; i < this.grunts.length; i++)
        {
            const grunt = this.grunts[i];

            if (grunt.active)
            {
                grunt.die();
            }
        }

        this._overflowCount = 0;
    }
}
