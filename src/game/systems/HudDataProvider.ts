import { IHudGameSource } from './IHudGameSource';
import { PowerUpBuffType } from './power-ups/PowerUpBuffType';

/**
 * Pintu baca data HUD (read-only).
 * Membungkus IHudGameSource dan mengekspos getter mentah + flag
 * ketersediaan. Tanpa mutasi, tanpa Phaser, tanpa alokasi snapshot per frame.
 * UI hanya memformat dan menampilkan nilai yang dikembalikan di sini.
 */
export class HudDataProvider
{
    private readonly source: IHudGameSource;

    /**
     * Konstruktor pintu baca HUD.
     * @param source Game scene yang mengimplementasikan IHudGameSource.
     */
    constructor(source: IHudGameSource)
    {
        this.source = source;
    }

    // --- Skor & Combo (panel kiri) ---

    /** Apakah sistem skor tersedia. */
    public get hasScore(): boolean
    {
        return this.source.getScoreSystem() !== undefined;
    }

    /** Skor total. */
    public get score(): number
    {
        return this.source.getScoreSystem()?.score ?? 0;
    }

    /** Nilai combo saat ini. */
    public get combo(): number
    {
        return this.source.getScoreSystem()?.combo ?? 0;
    }

    /** Pengali skor sebagai persen integer (100 = x1, 150 = x1.5). */
    public get multiplierPercent(): number
    {
        return this.source.getScoreSystem()?.multiplier ?? 100;
    }

    /** Sisa timer combo sebagai rasio 0..1 (untuk progress bar). */
    public get comboTimerRatio(): number
    {
        return this.source.getScoreSystem()?.comboTimerRatio ?? 0;
    }

    // --- Pemain & Dash (panel kiri) ---

    /** Apakah entitas pemain tersedia. */
    public get hasPlayer(): boolean
    {
        return this.source.getPlayer() !== undefined;
    }

    /** Sisa nyawa. */
    public get lives(): number
    {
        return this.source.getPlayer()?.lives ?? 0;
    }

    /** Apakah pemain sedang dash. */
    public get isDashing(): boolean
    {
        return this.source.getPlayer()?.isDashing() ?? false;
    }

    /** Apakah cooldown dash sudah selesai (siap dipakai). */
    public get dashReady(): boolean
    {
        return this.source.getPlayer()?.isDashReady() ?? true;
    }

    /** Sisa cooldown dash dalam milidetik. */
    public get dashCooldownRemainingMs(): number
    {
        return this.source.getPlayer()?.dashCooldownRemainingMs ?? 0;
    }

    /** Rasio cooldown dash 0..1 (0 = siap, 1 = baru dipakai). */
    public get dashCooldownRatio(): number
    {
        return this.source.getPlayer()?.dashCooldownRatio ?? 0;
    }

    // --- Slot Inventory (panel kanan) ---

    /** Apakah slot manager tersedia. */
    public get hasSlots(): boolean
    {
        return this.source.getSlotManager() !== undefined;
    }

    /** Tipe buff di slot indeks, atau null jika kosong. */
    public getSlotType(index: number): PowerUpBuffType | null
    {
        return this.source.getSlotManager()?.getSlotType(index) ?? null;
    }

    /** Jumlah stack di slot indeks. */
    public getSlotCountAt(index: number): number
    {
        return this.source.getSlotManager()?.getSlotCountAt(index) ?? 0;
    }

    /** Label keybind untuk slot indeks (1, 2, 3, ...). */
    public getSlotKeybind(index: number): string
    {
        return this.source.getSlotManager()?.getKeybind(index) ?? '';
    }

    // --- Buff Aktif (panel kanan) ---

    /** Daftar tipe buff yang sedang aktif. */
    public getActiveBuffTypes(): PowerUpBuffType[] | undefined
    {
        return this.source.getActiveBuffManager()?.getActiveBuffTypes();
    }

    /** Sisa durasi buff tipe tertentu (ms). */
    public getBuffRemainingMs(type: PowerUpBuffType): number
    {
        return this.source.getActiveBuffManager()?.getRemainingMs(type) ?? 0;
    }

    /** Total durasi konfigurasi buff tipe tertentu (ms), untuk progress bar. */
    public getBuffTotalMs(type: PowerUpBuffType): number
    {
        return this.source.getActiveBuffManager()?.getTotalMs(type) ?? 0;
    }

    /** Apakah seluruh buff sedang di-pause (durasi tidak berkurang). */
    public isBuffsPaused(): boolean
    {
        return this.source.getActiveBuffManager()?.isPaused() ?? false;
    }

    // --- Enemy System (panel kiri/kanan) ---

    /** Apakah Grunt pool tersedia. */
    public get hasGruntPool(): boolean
    {
        return this.source.getGruntPool() !== undefined;
    }

    /** Jumlah Grunt (musuh tipe 1) yang sedang aktif di layar. */
    public get gruntsActiveCount(): number
    {
        return this.source.getGruntPool()?.activeCount ?? 0;
    }
}