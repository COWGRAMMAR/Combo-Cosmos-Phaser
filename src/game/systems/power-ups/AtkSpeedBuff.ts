import { PowerUpBuffType } from './PowerUpBuffType';
import { PowerUpCategory } from './PowerUpCategory';
import type { IPowerUpBuff } from './IPowerUpBuff';
import type { Player } from '../../entities/player/Player';
import type { PlayerWeapon } from '../../entities/player/PlayerWeapon';
import type { EffectManager } from '../EffectManager';
import { PlayerConfig } from '../../config/PlayerConfig';
import { EffectType } from '../../types/EffectType';

/**
 * Buff slotted: tembak lebih cepat selama durasi.
 * Tidak stack - kalau aktif lagi saat masih jalan, pemakaian ditolak.
 * Timer dapat di-pause (misalnya saat Laser aktif).
 */
export class AtkSpeedBuff implements IPowerUpBuff
{
    /** Tipe buff ini. */
    public getType(): PowerUpBuffType
    {
        return PowerUpBuffType.AtkSpeed;
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

    /** Mengaktifkan efek atk speed pada weapon dan EffectManager. */
    public apply(
        _player: Player,
        weapon: PlayerWeapon,
        effects: EffectManager,
        _scene: Phaser.Scene
    ): void
    {
        weapon?.setCooldownMultiplier(PlayerConfig.atkSpeed.cooldownMultiplier);
        effects.activate(EffectType.FireRate, PlayerConfig.atkSpeed.durationMs);
    }
}
