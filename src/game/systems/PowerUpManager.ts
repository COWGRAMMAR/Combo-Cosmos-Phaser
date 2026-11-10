import * as Phaser from 'phaser';
import { GameEvents } from '../config/GameEvents';
import { PlayerConfig } from '../config/PlayerConfig';
import type { EffectManager } from './EffectManager';
import type { EnemyBulletManager } from './EnemyBulletManager';
import type { Player } from '../entities/player/Player';
import type { PlayerWeapon } from '../entities/player/PlayerWeapon';
import type { Enemy } from '../entities/enemy/Enemy';
import type { IPowerUpBuff } from './power-ups/IPowerUpBuff';
import { PowerUpBuffType } from './power-ups/PowerUpBuffType';
import { PowerUpCategory } from './power-ups/PowerUpCategory';
import type { PowerUpSlotManager } from './power-ups/PowerUpSlotManager';
import type { ActiveBuffManager } from './power-ups/ActiveBuffManager';
import { LaneBuff } from './power-ups/LaneBuff';
import { LifeBuff } from './power-ups/LifeBuff';
import { AtkSpeedBuff } from './power-ups/AtkSpeedBuff';
import { ShieldBuff } from './power-ups/ShieldBuff';
import { LaserBuff } from './power-ups/LaserBuff';
import { NukeBuff } from './power-ups/NukeBuff';

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
 * Dispatcher power-up: menerjemahkan jenis power-up menjadi aksi buff.
 * Auto-pickup (Lane, Life) diterapkan langsung. Slotted (AtkSpeed, Shield, Laser, Nuke)
 * dimasukkan ke slot inventory lewat PowerUpSlotManager.
 */
export class PowerUpManager
{
    private readonly scene: Phaser.Scene;

    private readonly player: Player;

    private readonly weapon: PlayerWeapon;

    private readonly effects: EffectManager;

    private readonly enemyBullets: EnemyBulletManager;

    private readonly enemies: Enemy[];

    private readonly slotManager: PowerUpSlotManager;

    private readonly activeBuffManager: ActiveBuffManager;

    /** Registry tipe buff -> instance kelas buff. */
    private readonly buffRegistry: Map<PowerUpBuffType, IPowerUpBuff> = new Map();

    /** Penyimpan referensi sistem yang dipengaruhi power-up. */
    constructor(
        scene: Phaser.Scene,
        player: Player,
        weapon: PlayerWeapon,
        effects: EffectManager,
        enemyBullets: EnemyBulletManager,
        enemies: Phaser.GameObjects.Group,
        slotManager: PowerUpSlotManager,
        activeBuffManager: ActiveBuffManager
    )
    {
        this.scene = scene;
        this.player = player;
        this.weapon = weapon;
        this.effects = effects;
        this.enemyBullets = enemyBullets;
        this.enemies = enemies.getChildren() as Enemy[];
        this.slotManager = slotManager;
        this.activeBuffManager = activeBuffManager;

        this.registerBuffs();
        this.scene.events.on('nuke-used', () => this.useBomb());
    }

    /** Daftarkan semua kelas buff ke registry. */
    private registerBuffs(): void
    {
        this.buffRegistry.set(PowerUpBuffType.Lane, new LaneBuff());
        this.buffRegistry.set(PowerUpBuffType.Life, new LifeBuff());
        this.buffRegistry.set(PowerUpBuffType.AtkSpeed, new AtkSpeedBuff());
        this.buffRegistry.set(PowerUpBuffType.Shield, new ShieldBuff());
        this.buffRegistry.set(PowerUpBuffType.Laser, new LaserBuff());
        this.buffRegistry.set(PowerUpBuffType.Nuke, new NukeBuff());
    }

    /** Map enum lama PowerUpType ke PowerUpBuffType baru. */
    private mapToBuffType(kind: PowerUpType): PowerUpBuffType
    {
        switch (kind)
        {
            case PowerUpType.Lane:
                return PowerUpBuffType.Lane;
            case PowerUpType.AtkSpeed:
                return PowerUpBuffType.AtkSpeed;
            case PowerUpType.Shield:
                return PowerUpBuffType.Shield;
            case PowerUpType.Laser:
                return PowerUpBuffType.Laser;
            case PowerUpType.Bomb:
                return PowerUpBuffType.Nuke;
            case PowerUpType.Life:
                return PowerUpBuffType.Life;
            default:
                return kind as unknown as PowerUpBuffType;
        }
    }

    /** Menjalankan efek sesuai jenis power-up yang diambil (legacy enum PowerUpType). */
    public apply(kind: PowerUpType): void
    {
        this.applyBuffType(this.mapToBuffType(kind));
    }

    /** Menerapkan buff langsung berdasarkan tipe buff baru (digunakan oleh sistem spawn). */
    public applyBuffType(buffType: PowerUpBuffType): void
    {
        const buff = this.buffRegistry.get(buffType);

        if (!buff)
        {
            return;
        }

        if (buff.getCategory() === PowerUpCategory.AutoPickup)
        {
            buff.apply(this.player, this.weapon, this.effects, this.scene);
        }
        else
        {
            // Slotted: masuk ke slot inventory, tidak diterapkan langsung.
            this.slotManager.add(buffType, buff, this.player);
        }
    }

    /** Damage besar ke semua musuh aktif lalu bersihkan seluruh peluru musuh. */
    public useBomb(): void
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

    /** Mengembalikan registry tipe buff ke instance kelas buff. */
    public getBuffRegistry(): Map<PowerUpBuffType, IPowerUpBuff>
    {
        return this.buffRegistry;
    }

    /** Mengembalikan slot manager untuk akses dari scene. */
    public getSlotManager(): PowerUpSlotManager
    {
        return this.slotManager;
    }

    /** Mengembalikan active buff manager untuk akses dari scene. */
    public getActiveBuffManager(): ActiveBuffManager
    {
        return this.activeBuffManager;
    }
}
