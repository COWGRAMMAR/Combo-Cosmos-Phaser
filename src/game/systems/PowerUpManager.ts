import * as Phaser from 'phaser';
import { GameEvents } from '../config/GameEvents';
import { PlayerConfig } from '../config/PlayerConfig';
import { EffectType } from '../types/EffectType';
import type { EffectManager } from './EffectManager';
import type { EnemyBulletManager } from './EnemyBulletManager';
import type { Player } from '../entities/player/Player';
import type { PlayerWeapon } from '../entities/player/PlayerWeapon';
import type { Enemy } from '../entities/enemy/Enemy';

/** Semua power-up yang bisa didapat pemain. */
export enum PowerUpType
{
    Lane = 'lane',
    AtkSpeed = 'atk-speed',
    Shield = 'shield',
    Laser = 'laser',
    Bomb = 'bomb',
    Life = 'life'
}

/**
 * Menjalankan efek tiap power-up.
 * Kelas ini hanya menerjemahkan jenis power-up menjadi aksi; durasi tetap
 * diurus EffectManager dan damage musuh tetap lewat takeDamage().
 */
export class PowerUpManager
{
    private readonly scene: Phaser.Scene;

    private readonly player: Player;

    private readonly weapon: PlayerWeapon;

    private readonly effects: EffectManager;

    private readonly enemyBullets: EnemyBulletManager;

    private readonly enemies: Enemy[];

    /** Menyimpan referensi sistem yang dipengaruhi power-up. */
    constructor(
        scene: Phaser.Scene,
        player: Player,
        weapon: PlayerWeapon,
        effects: EffectManager,
        enemyBullets: EnemyBulletManager,
        enemies: Phaser.GameObjects.Group
    )
    {
        this.scene = scene;
        this.player = player;
        this.weapon = weapon;
        this.effects = effects;
        this.enemyBullets = enemyBullets;
        this.enemies = enemies.getChildren() as Enemy[];
    }

    /** Menjalankan efek sesuai jenis power-up yang diambil. */
    public apply(kind: PowerUpType): void
    {
        switch (kind)
        {
            case PowerUpType.Lane:
                this.weapon.addLane();
                break;
            case PowerUpType.AtkSpeed:
                this.effects.activate(EffectType.FireRate, PlayerConfig.atkSpeed.durationMs);
                break;
            case PowerUpType.Shield:
                this.effects.activate(EffectType.Shield, PlayerConfig.shield.durationMs);
                break;
            case PowerUpType.Laser:
                this.effects.activate(EffectType.Laser, PlayerConfig.laser.durationMs);
                break;
            case PowerUpType.Bomb:
                this.useBomb();
                break;
            case PowerUpType.Life:
                this.player.addLife();
                break;
        }
    }

    /** Damage besar ke semua musuh aktif lalu bersihkan seluruh peluru musuh. */
    private useBomb(): void
    {
        for (let i = 0; i < this.enemies.length; i++)
        {
            const enemy = this.enemies[i];

            if (enemy.active)
            {
                enemy.takeDamage(PlayerConfig.bomb.damage);
            }
        }

        this.enemyBullets.clearAll();

        this.scene.events.emit(GameEvents.BOMB_USED);
    }
}
