import * as Phaser from 'phaser';
import { DepthConfig } from '../../config/DepthConfig';
import { EnemyConfig } from '../../config/EnemyConfig';
import { GameEvents } from '../../config/GameEvents';
import type { AssetRef } from '../../types/AssetRef';
import type { EntityConfig } from '../../types/EntityConfig';
import { BaseEntity } from '../BaseEntity';
import { EnemyState } from './EnemyState';

/**
 * Kelas dasar musuh.
 * Perilaku diam/tidak terdorong sengaja tidak dipasang di sini supaya
 * subclass seperti Grunt bisa bergerak dengan velocity.
 */
export class Enemy extends BaseEntity
{
    public entityState: EnemyState = EnemyState.Active;

    /** Sisa waktu siluet merah setelah terkena damage, dalam milidetik. */
    private hitFlashRemainingMs: number = 0;

    /** Menyiapkan sprite musuh pada layer render musuh. */
    constructor(scene: Phaser.Scene, x: number, y: number, asset: AssetRef, config: EntityConfig)
    {
        super(scene, x, y, asset, config);

        this.setDepth(DepthConfig.enemy);
    }

    /** Belum ada perilaku per-frame untuk musuh. */
    protected updateEntity(_time: number, _delta: number): void {}

    /** Menyalakan siluet merah sesaat tanpa tekstur tambahan; bentuk mengikuti aslinya. */
    protected onDamaged(): void
    {
        // Phaser 4 memisahkan warna dan mode tint; FILL membuat siluet penuh
        // berwarna merah, bukan hasil perkalian dengan warna tekstur asli.
        this.setTintMode(Phaser.TintModes.FILL);
        this.setTint(EnemyConfig.hitFlash.color);
        this.hitFlashRemainingMs = EnemyConfig.hitFlash.durationMs;
    }

    /** Mematikan siluet merah saat durasinya habis. */
    public preUpdate(time: number, delta: number): void
    {
        super.preUpdate(time, delta);

        if (this.hitFlashRemainingMs <= 0)
        {
            return;
        }

        this.hitFlashRemainingMs -= delta;

        if (this.hitFlashRemainingMs > 0)
        {
            return;
        }

        this.clearHitFlash();
    }

    /** Mengaktifkan ulang musuh dari pool dengan warna dan timer yang bersih. */
    public resetForPool(x: number, y: number): void
    {
        super.resetForPool(x, y);

        this.clearHitFlash();
    }

    /** Mematikan siluet merah dan mengembalikan mode tint normal. */
    private clearHitFlash(): void
    {
        this.hitFlashRemainingMs = 0;
        this.clearTint();
        this.setTintMode(Phaser.TintModes.MULTIPLY);
    }

    /** Memancarkan event kematian agar scene bisa memunculkan ledakan. */
    protected onDeath(): void
    {
        this.scene.events.emit(GameEvents.ENEMY_KILLED, this.x, this.y);
        this.die();
    }

    /** Membunuh musuh di luar jalur damage, misalnya saat menabrak pemain. */
    public kill(): void
    {
        this.onDeath();
    }

    /** Menonaktifkan musuh saat HP habis atau keluar layar; tidak memunculkan efek. */
    public die(): void
    {
        this.entityState = EnemyState.Dying;
        this.setActive(false);
        this.setVisible(false);

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.enable = false;
    }
}
