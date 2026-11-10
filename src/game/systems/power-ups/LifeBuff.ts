import { PowerUpBuffType } from './PowerUpBuffType';
import { PowerUpCategory } from './PowerUpCategory';
import type { IPowerUpBuff } from './IPowerUpBuff';
import type { Player } from '../../entities/player/Player';
import type { PlayerWeapon } from '../../entities/player/PlayerWeapon';
import type { EffectManager } from '../EffectManager';
import { PlayerConfig } from '../../config/PlayerConfig';

/**
 * Buff auto-pickup: menambah satu nyawa sampai batas maksimum.
 * Saat diambil langsung diterapkan, tidak masuk slot inventory.
 */
export class LifeBuff implements IPowerUpBuff
{
    /** Tipe buff ini. */
    public getType(): PowerUpBuffType
    {
        return PowerUpBuffType.Life;
    }

    /** Kategori: auto-pickup, langsung diterapkan saat disentuh. */
    public getCategory(): PowerUpCategory
    {
        return PowerUpCategory.AutoPickup;
    }

    /** Valid jika nyawa belum mencapai maksimum config. */
    public isValid(player: Player): boolean
    {
        return player.lives < PlayerConfig.maxLives;
    }

    /** Bobot tinggi kalau nyawa sedikit, nol kalau sudah maksimal. */
    public getWeight(player: Player): number
    {
        return player.lives < PlayerConfig.maxLives ? 3 : 0;
    }

    /** Tidak memblokir tembakan biasa. */
    public blocksNormalFire(): boolean
    {
        return false;
    }

    /** Menambah satu nyawa, dijepit ke maxLives. */
    public apply(
        _player: Player,
        _weapon: PlayerWeapon,
        _effects: EffectManager,
        _scene: Phaser.Scene
    ): void
    {
        _player.addLife();
    }
}
