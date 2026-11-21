import { ScoreSystem } from './ScoreSystem';
import { Player } from '../entities/player/Player';
import { PowerUpSlotManager } from './power-ups/PowerUpSlotManager';
import { ActiveBuffManager } from './power-ups/ActiveBuffManager';
import { GruntPool } from '../systems/enemy/GruntPool';

/**
 * Kontrak sumber data HUD.
 * Game scene wajib mengimplementasikan getter ini agar HUD bisa
 * membaca data tanpa menyentuh state internal.
 */
export interface IHudGameSource
{
    /** Sistem skor (untuk panel kiri). */
    getScoreSystem(): ScoreSystem | undefined;

    /** Entitas pemain (untuk nyawa & dash). */
    getPlayer(): Player | undefined;

    /** Manajer slot inventory power-up (untuk panel kanan). */
    getSlotManager(): PowerUpSlotManager | undefined;

    /** Manajer buff aktif (untuk panel kanan). */
    getActiveBuffManager(): ActiveBuffManager | undefined;

    /** Pool Grunt (untuk enemy counter di HUD). */
    getGruntPool(): GruntPool | undefined;
}