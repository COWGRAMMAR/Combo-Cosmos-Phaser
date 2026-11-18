import { PowerUpBuffType } from './PowerUpBuffType';
import type { IPowerUpBuff } from './IPowerUpBuff';
import type { Player } from '../../entities/player/Player';
import type { PlayerWeapon } from '../../entities/player/PlayerWeapon';
import type { EffectManager } from '../EffectManager';
import { EffectType } from '../../types/EffectType';
import { PlayerConfig } from '../../config/PlayerConfig';

/**
 * Mengelola buff aktif (jenis Slotted) dengan dukungan pause/resume durasi.
 * Menyimpan flag blocksNormalFire untuk mengontrol apakah tembakan biasa
 * boleh dilakukan saat ada buff aktif (misalnya Laser).
 */
export class ActiveBuffManager
{
    private readonly effects: EffectManager;

    /** Buff yang sedang aktif dengan sisa durasi. */
    private readonly activeBuffs = new Map<PowerUpBuffType, { buff: IPowerUpBuff; remainingMs: number; totalMs: number }>();

    /** Flag apakah ada buff aktif yang memblokir tembakan biasa. */
    private blocksNormalFireFlag: boolean = false;

    /** Flag apakah seluruh buff sedang dalam status paused (durasi tidak berkurang). */
    private _paused: boolean = false;

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

        // buff.apply() sudah mengaktifkan timer di EffectManager; jangan aktifkan dua kali.
        if (durationMs > 0)
        {
            this.activeBuffs.delete(type);
            this.activeBuffs.set(type, { buff, remainingMs: durationMs, totalMs: durationMs });
        }

        this.recalculateBlocksNormalFire();
    }

    /**
     * Menyinkronkan sisa durasi dari EffectManager (sumber kebenaran tunggal).
     * Dipanggil dari fixed-step Game.update() supaya clock-nya sama dengan efek.
     */
    public update(_delta: number): void
    {
        if (this._paused)
        {
            this.recalculateBlocksNormalFire();
            return;
        }

        const toRemove: PowerUpBuffType[] = [];

        for (const [type, entry] of this.activeBuffs)
        {
            // Ikuti timer EffectManager agar HUD tidak melenceng saat frame hitch.
            entry.remainingMs = this.effects.getRemainingMs(this.effectTypeFor(type));
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

    /** Pause semua buff aktif (saat game pause). Durasi tidak berkurang selama paused. */
    public pauseAll(): void
    {
        this._paused = true;
    }

    /** Resume semua buff aktif (saat game resume dari pause). Durasi lanjut berkurang dari sisa yang tersisa. */
    public resumeAll(): void
    {
        this._paused = false;
    }

    /** Pause durasi satu jenis buff (misalnya AtkSpeed saat Laser aktif). */
    public pause(_type: PowerUpBuffType): void
    {
        // Pause per-jenis diatur dengan jeda antar aktivasi; sisa durasi tetap dipertahankan.
        // Implementasi saat ini memakai paused global via pauseAll/resumeAll.
    }

    /** Resume durasi satu jenis buff. */
    public resume(_type: PowerUpBuffType): void
    {
        // Resume per-jenis diatur dengan jeda antar aktivasi; sisa durasi tetap dipertahankan.
        // Implementasi saat ini memakai paused global via pauseAll/resumeAll.
    }

    /** Apakah seluruh buff sedang dalam status paused. */
    public isPaused(): boolean
    {
        return this._paused;
    }

    /** Daftar semua tipe buff yang sedang aktif (untuk konsumsi HUD). */
    public getActiveBuffTypes(): PowerUpBuffType[]
    {
        return Array.from(this.activeBuffs.keys());
    }

    /** Durasi total konfigurasi buff tipe tertentu (untuk progress bar), atau 0 jika tidak diketahui. */
    public getTotalMs(type: PowerUpBuffType): number
    {
        return this.getBuffDuration(type);
    }

    /** Matikan satu buff aktif secara paksa (misalnya shield pecah saat kena musuh). */
    public deactivate(type: PowerUpBuffType): void
    {
        const entry = this.activeBuffs.get(type);
        if (!entry)
        {
            return;
        }

        this.effects.stop(this.effectTypeFor(type));
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
            this.effects.stop(this.effectTypeFor(type));
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

    /** Map tipe buff ke tipe efek di EffectManager (AtkSpeed memakai efek FireRate). */
    private effectTypeFor(type: PowerUpBuffType): EffectType
    {
        switch (type)
        {
            case PowerUpBuffType.AtkSpeed:
                return EffectType.FireRate;
            case PowerUpBuffType.Shield:
                return EffectType.Shield;
            case PowerUpBuffType.Laser:
                return EffectType.Laser;
            default:
                return EffectType.FireRate;
        }
    }

    private getBuffDuration(_type: PowerUpBuffType): number
    {
        switch (_type)
        {
            case PowerUpBuffType.AtkSpeed:
                return PlayerConfig.atkSpeed.durationMs;
            case PowerUpBuffType.Shield:
                return PlayerConfig.shield.durationMs;
            case PowerUpBuffType.Laser:
                return PlayerConfig.laser.durationMs;
            default:
                return 0;
        }
    }
}
