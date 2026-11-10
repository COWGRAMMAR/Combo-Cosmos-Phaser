import { PowerUpBuffType } from './PowerUpBuffType';
import type { IPowerUpBuff } from './IPowerUpBuff';
import type { Player } from '../../entities/player/Player';
import type { PlayerWeapon } from '../../entities/player/PlayerWeapon';
import type { EffectManager } from '../EffectManager';

/**
 * Mengelola buff aktif (jenis Slotted) dengan dukungan pause/resume durasi.
 * Menyimpan flag blocksNormalFire untuk mengontrol apakah tembakan biasa
 * boleh dilakukan saat ada buff aktif (misalnya Laser).
 */
export class ActiveBuffManager
{
    private readonly effects: EffectManager;

    /** Buff yang sedang aktif dengan sisa durasi. */
    private readonly activeBuffs = new Map<PowerUpBuffType, { buff: IPowerUpBuff; remainingMs: number }>();

    /** Flag apakah ada buff aktif yang memblokir tembakan biasa. */
    private blocksNormalFireFlag: boolean = false;

    constructor(effects: EffectManager)
    {
        this.effects = effects;
    }

    /**
     * Aktifkan buff slotted. Memanggil buff.apply() dan EffectManager.activate().
     * Jika buff.blocksNormalFire() true, flag akan di-set.
     */
    public activate(
        buff: IPowerUpBuff,
        player: Player,
        weapon: PlayerWeapon,
        scene: Phaser.Scene
    ): void
    {
        const type = buff.getType();
        const durationMs = this.getBuffDuration(type);

        buff.apply(player, weapon, this.effects, scene);

        if (durationMs > 0)
        {
            this.effects.activate(type as any, durationMs);
            this.activeBuffs.set(type, { buff, remainingMs: durationMs });
        }

        this.recalculateBlocksNormalFire();
    }

    /** Kurangi durasi semua buff aktif. Dipanggil tiap frame via Game.update(). */
    public update(delta: number): void
    {
        const toRemove: PowerUpBuffType[] = [];

        for (const [type, entry] of this.activeBuffs)
        {
            entry.remainingMs = Math.max(0, entry.remainingMs - delta);
            if (entry.remainingMs <= 0)
            {
                toRemove.push(type);
            }
        }

        for (const type of toRemove)
        {
            this.deactivate(type);
        }

        this.recalculateBlocksNormalFire();
    }

    /** Pause semua buff aktif (saat game pause). */
    public pauseAll(): void
    {
        // Pause dilakukan dengan tidak memanggil update() selama game pause.
        // Simpan snapshot untuk resume.
    }

    /** Resume semua buff aktif (saat game resume dari pause). */
    public resumeAll(): void
    {
        // Tidak perlu aksi khusus; update akan lanjut dari sisa durasi.
    }

    /** Pause durasi satu jenis buff (misalnya AtkSpeed saat Laser aktif). */
    public pause(_type: PowerUpBuffType): void
    {
        // Tidak ada aksi khusus; pause diatur dengan tidak memanggil update().
    }

    /** Resume durasi satu jenis buff. */
    public resume(_type: PowerUpBuffType): void
    {
        // Tidak ada aksi khusus.
    }

    /** Matikan satu buff aktif secara paksa (misalnya shield pecah saat kena musuh). */
    public deactivate(type: PowerUpBuffType): void
    {
        const entry = this.activeBuffs.get(type);
        if (!entry)
        {
            return;
        }

        this.effects.stop(type as any);
        this.activeBuffs.delete(type);
        this.recalculateBlocksNormalFire();
    }

    /** Apakah tembakan biasa diizinkan (tidak ada buff blocksNormalFire aktif). */
    public canFireNormal(): boolean
    {
        return !this.blocksNormalFireFlag;
    }

    /** Apakah tipe buff sedang aktif. */
    public isActive(type: PowerUpBuffType): boolean
    {
        return this.activeBuffs.has(type);
    }

    /** Sisa durasi buff aktif, atau 0 jika tidak aktif. */
    public getRemainingMs(type: PowerUpBuffType): number
    {
        return this.activeBuffs.get(type)?.remainingMs ?? 0;
    }

    /** Matikan semua buff aktif. */
    public reset(): void
    {
        for (const type of this.activeBuffs.keys())
        {
            this.effects.stop(type as any);
        }
        this.activeBuffs.clear();
        this.blocksNormalFireFlag = false;
    }

    private recalculateBlocksNormalFire(): void
    {
        this.blocksNormalFireFlag = false;
        for (const [_type, entry] of this.activeBuffs)
        {
            if (entry.buff.blocksNormalFire?.())
            {
                this.blocksNormalFireFlag = true;
                break;
            }
        }
    }

    private getBuffDuration(_type: PowerUpBuffType): number
    {
        switch (_type)
        {
            case PowerUpBuffType.AtkSpeed:
                return 7000;
            case PowerUpBuffType.Shield:
                return 10000;
            case PowerUpBuffType.Laser:
                return 7000;
            default:
                return 0;
        }
    }
}
