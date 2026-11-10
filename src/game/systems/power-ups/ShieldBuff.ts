import { PowerUpBuffType } from './PowerUpBuffType';
import { PowerUpCategory } from './PowerUpCategory';
import type { IPowerUpBuff } from './IPowerUpBuff';
import type { Player } from '../../entities/player/Player';
import type { PlayerWeapon } from '../../entities/player/PlayerWeapon';
import type { EffectManager } from '../EffectManager';
import { PlayerConfig } from '../../config/PlayerConfig';
import { EffectType } from '../../types/EffectType';

/**
 * Buff slotted: kebal semua peluru musuh selama durasi.
 * Pecah saat kena musuh dan buff langsung hilang walau durasi sisa.
 */
export class ShieldBuff implements IPowerUpBuff
{
    /** Tipe buff ini. */
    public getType(): PowerUpBuffType
    {
        return PowerUpBuffType.Shield;
    }

    /** Kategori: slotted, masuk ke inventory sebelum dipakai. */
    public getCategory(): PowerUpCategory
    {
        return PowerUpCategory.Slotted;
    }

    /** Selalu valid untuk masuk slot selama stok belum cap. */
    public isValid(_player: Player): boolean
    {
        return true;
    }

    /** Bobot konstan dalam distribusi spawn. */
    public getWeight(_player: Player): number
    {
        return 2;
    }

    /** Tidak memblokir tembakan biasa. */
    public blocksNormalFire(): boolean
    {
        return false;
    }

    /** Mengaktifkan shield pada player dan EffectManager. */
    public apply(
        _player: Player,
        _weapon: PlayerWeapon,
        effects: EffectManager,
        _scene: Phaser.Scene
    ): void
    {
        _player.setShield(true);
        effects.activate(EffectType.Shield, PlayerConfig.shield.durationMs);
    }
}
