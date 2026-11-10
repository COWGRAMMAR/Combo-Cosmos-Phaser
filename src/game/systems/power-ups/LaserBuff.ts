import { PowerUpBuffType } from './PowerUpBuffType';
import { PowerUpCategory } from './PowerUpCategory';
import type { IPowerUpBuff } from './IPowerUpBuff';
import type { Player } from '../../entities/player/Player';
import type { PlayerWeapon } from '../../entities/player/PlayerWeapon';
import type { EffectManager } from '../EffectManager';
import { PlayerConfig } from '../../config/PlayerConfig';
import { EffectType } from '../../types/EffectType';

/**
 * Buff slotted: laser lurus ke depan selama durasi.
 * blocksNormalFire = true: tembakan biasa tidak dapat ditembak saat laser aktif.
 * Timer dapat di-pause saat buff lain memerlukan prioritas.
 */
export class LaserBuff implements IPowerUpBuff
{
    /** Tipe buff ini. */
    public getType(): PowerUpBuffType
    {
        return PowerUpBuffType.Laser;
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
        return 1;
    }

    /** Apakah buff ini memblokir tembakan biasa saat aktif. */
    public blocksNormalFire(): boolean
    {
        return true;
    }

    /** Mengaktifkan laser via EffectManager; blokir tembakan biasa diatur oleh ActiveBuffManager lewat blocksNormalFire(). */
    public apply(
        _player: Player,
        _weapon: PlayerWeapon,
        effects: EffectManager,
        _scene: Phaser.Scene
    ): void
    {
        effects.activate(EffectType.Laser, PlayerConfig.laser.durationMs);
    }
}
