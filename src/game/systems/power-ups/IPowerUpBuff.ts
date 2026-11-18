import type { PowerUpBuffType } from './PowerUpBuffType';
import type { PowerUpCategory } from './PowerUpCategory';
import type { Player } from '../../entities/player/Player';
import type { PlayerWeapon } from '../../entities/player/PlayerWeapon';
import type { EffectManager } from '../EffectManager';

/**
 * Kontrak yang harus diimplementasi setiap kelas buff.
 * Spawn manager hanya bertanya isValid() dan getWeight() tanpa
 * perlu mengetahui detail aturan tiap buff.
 */
export interface IPowerUpBuff {
    /** Tipe buff ini. */
    getType(): PowerUpBuffType;
    /** Kategori: AutoPickup atau Slotted. */
    getCategory(): PowerUpCategory;
    /**
     * Menentukan apakah buff ini boleh muncul/diambil pemain saat ini.
     * Contoh: tembakan sudah max 5, HP penuh, slot penuh jenis lain, stok cap.
     */
    isValid(player: Player): boolean;
    /**
     * Bobot dalam distribusi spawn. Semakin tinggi semakin sering muncul.
     * Spawn manager memanggil ini tanpa peduli alasannya.
     */
    getWeight(player: Player): number;
    /**
     * Menerapkan efek buff kepada pemain.
     * Untuk AutoPickup dipanggil segera saat item disentuh.
     * Untuk Slotted dipanggil saat slot diaktifkan via keybind.
     */
    apply(
        player: Player,
        weapon: PlayerWeapon,
        effects: EffectManager,
        scene: Phaser.Scene
    ): void;
    /**
     * Apakah buff ini memblokir tembakan biasa saat aktif (hanya Slotted).
     * Default false untuk semua buff kecuali Laser.
     */
    blocksNormalFire(): boolean;
}