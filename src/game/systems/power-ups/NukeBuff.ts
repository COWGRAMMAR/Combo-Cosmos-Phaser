import { PowerUpBuffType } from './PowerUpBuffType';
import { PowerUpCategory } from './PowerUpCategory';
import type { IPowerUpBuff } from './IPowerUpBuff';
import type { Player } from '../../entities/player/Player';
import type { PlayerWeapon } from '../../entities/player/PlayerWeapon';
import type { EffectManager } from '../EffectManager';

/**
 * Buff slotted: bom instan, damage besar ke semua musuh + clear peluru musuh.
 * Tetap terpakai walau musuh kosong (tidak ditolak).
 */
export class NukeBuff implements IPowerUpBuff
{
    /** Tipe buff ini. */
    public getType(): PowerUpBuffType
    {
        return PowerUpBuffType.Nuke;
    }

    /** Kategori: slotted, masuk ke inventory sebelum dipakai. */
    public getCategory(): PowerUpCategory
    {
        return PowerUpCategory.Slotted;
    }

    /** Selalu valid, bahkan kalau musuh kosong. */
    public isValid(_player: Player): boolean
    {
        return true;
    }

    /** Bobot rendah karena efeknya kuat dan instan. */
    public getWeight(_player: Player): number
    {
        return 1;
    }

    /** Tidak memblokir tembakan biasa. */
    public blocksNormalFire(): boolean
    {
        return false;
    }

    /** Memakai bom: damage semua musuh aktif lalu clear peluru musuh. */
    public apply(
        _player: Player,
        _weapon: PlayerWeapon,
        _effects: EffectManager,
        scene: Phaser.Scene
    ): void
    {
        // Damage dan clear handled oleh PowerUpManager.useBomb() yang memiliki
        // referensi enemyBullets dan enemies. Di sini hanya trigger event.
        scene.events.emit('nuke-used');
    }
}
