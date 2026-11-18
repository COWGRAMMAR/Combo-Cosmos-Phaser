import { PowerUpBuffType } from './PowerUpBuffType';
import { PowerUpCategory } from './PowerUpCategory';
import type { IPowerUpBuff } from './IPowerUpBuff';
import type { Player } from '../../entities/player/Player';
import type { PlayerWeapon } from '../../entities/player/PlayerWeapon';
import type { EffectManager } from '../EffectManager';
import { PlayerConfig } from '../../config/PlayerConfig';

/**
 * Buff auto-pickup: menambah satu jalur tembakan permanen (max 5).
 * Saat diambil langsung diterapkan, tidak masuk slot inventory.
 */
export class LaneBuff implements IPowerUpBuff
{
    /** Tipe buff ini. */
    public getType(): PowerUpBuffType
    {
        return PowerUpBuffType.Lane;
    }

    /** Kategori: auto-pickup, langsung diterapkan saat disentuh. */
    public getCategory(): PowerUpCategory
    {
        return PowerUpCategory.AutoPickup;
    }

    /**
     * Valid jika jalur belum mencapai maksimal config.
     * Jika sudah max 5, spawn manager tidak akan menampilkan item ini.
     */
    public isValid(player: Player): boolean
    {
        return (player.weapon?.laneCount ?? 0) < PlayerConfig.weapon.maxLanes;
    }

    /** Bobot turun tiap level tembakan agar jarang muncul saat sudah banyak jalur. */
    public getWeight(player: Player): number
    {
        const lanes = player.weapon?.laneCount ?? 0;
        return Math.max(1, PlayerConfig.weapon.maxLanes - lanes);
    }

    /** Tidak memblokir tembakan biasa. */
    public blocksNormalFire(): boolean
    {
        return false;
    }

    /** Menambah satu jalur tembakan permanen, dijepit ke maxLanes. */
    public apply(
        _player: Player,
        weapon: PlayerWeapon,
        _effects: EffectManager,
        _scene: Phaser.Scene
    ): void
    {
        weapon?.addLane();
    }
}
