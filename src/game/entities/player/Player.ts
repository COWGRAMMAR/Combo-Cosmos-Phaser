import * as Phaser from 'phaser';
import { DepthConfig } from '../../config/DepthConfig';
import { PlayerConfig } from '../../config/PlayerConfig';
import type { EntityConfig } from '../../types/EntityConfig';
import type { IInputSource } from '../../types/IInputSource';
import { InputAction } from '../../types/InputAction';
import { BaseEntity } from '../BaseEntity';
import type { PlayerWeapon } from './PlayerWeapon';
import { PlayerState } from './PlayerState';

/** Entitas pemain yang bergerak empat arah lewat sumber input. */
export class Player extends BaseEntity
{
    public entityState: PlayerState = PlayerState.Alive;

    private readonly inputSource: IInputSource;
    private readonly weapon?: PlayerWeapon;

    private _lives: number = PlayerConfig.lives;
    private shieldActive: boolean = false;

    private dashRemainingMs: number = 0;
    private dashCooldownRemainingMs: number = 0;
    private dashDirX: number = 0;
    private dashDirY: number = 0;

    private _inputAxisX: number = 0;
    private _inputAxisY: number = 0;
    private _inputDashJustDown: boolean = false;
    private _inputFireDown: boolean = false;

    /** Menyimpan sumber input yang di-inject oleh scene. */
    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        texture: string,
        config: EntityConfig,
        inputSource: IInputSource,
        weapon?: PlayerWeapon
    )
    {
        super(scene, x, y, texture, config);

        this.inputSource = inputSource;
        this.weapon = weapon;

        this.setDepth(DepthConfig.player);
    }

    /** Radius hitbox kecil untuk tabrakan peluru musuh. */
    get hitRadius(): number
    {
        return PlayerConfig.hitRadius;
    }

    /** Sisa nyawa pemain pada run ini. */
    get lives(): number
    {
        return this._lives;
    }

    /** Apakah shield sedang aktif. */
    get isShieldActive(): boolean
    {
        return this.shieldActive;
    }

    /**
     * Mengurangi satu nyawa karena peluru musuh.
     * Mengembalikan true kalau nyawa habis dan pemain mati.
     */
    public applyHit(): boolean
    {
        if (!this.active)
        {
            return true;
        }

        this._lives -= 1;

        if (this._lives <= 0)
        {
            this._lives = 0;
            this.die();

            return true;
        }

        this.startInvulnerability(PlayerConfig.invulnMs);

        return false;
    }

    /** Memberi kebal sementara; dipakai kena hit maupun dash. */
    public startInvulnerability(durationMs: number): void
    {
        if (!this.active)
        {
            return;
        }

        this.invulnerableRemainingMs = Math.max(this.invulnerableRemainingMs, durationMs);

        if (this.entityState !== PlayerState.Dead)
        {
            this.entityState = PlayerState.Invulnerable;
        }
    }

    /** Peluru musuh diabaikan saat kebal atau saat shield aktif. */
    public isDamageImmune(): boolean
    {
        return this.isInvulnerable() || this.shieldActive;
    }

    /** Menyalakan atau mematikan shield dari EffectManager. */
    public setShield(active: boolean): void
    {
        this.shieldActive = active;
    }

    /** Menambah nyawa sampai batas maksimum config. */
    public addLife(): void
    {
        this._lives = Math.min(this._lives + 1, PlayerConfig.maxLives);
    }

    /** True selama durasi dash berjalan. */
    public isDashing(): boolean
    {
        return this.dashRemainingMs > 0;
    }

    /** True kalau cooldown dash sudah selesai dan dash bisa dipakai lagi. */
    public isDashReady(): boolean
    {
        return this.dashCooldownRemainingMs <= 0;
    }

    /** Tangkap snapshot input sekali per frame sebelum loop fixed-step berjalan. */
    protected override captureFrameInput(): void
    {
        this._inputAxisX = this.inputSource.getAxis(InputAction.MoveLeft, InputAction.MoveRight);
        this._inputAxisY = this.inputSource.getAxis(InputAction.MoveUp, InputAction.MoveDown);
        this._inputDashJustDown = this.inputSource.isJustDown(InputAction.Dash);
        this._inputFireDown = this.inputSource.isDown(InputAction.Fire);
    }

    /** Membaca snapshot input per frame, lalu menerapkan velocity. */
    protected updateEntity(_time: number, delta: number): void
    {
        const axisX = this._inputAxisX;
        const axisY = this._inputAxisY;

        if (this.dashRemainingMs > 0)
        {
            this.dashRemainingMs = Math.max(0, this.dashRemainingMs - delta);
        }

        if (this.dashCooldownRemainingMs > 0)
        {
            this.dashCooldownRemainingMs = Math.max(0, this.dashCooldownRemainingMs - delta);
        }

        this.tryStartDash(axisX, axisY);
        this.updateBlink();

        if (this.isDashing())
        {
            this.setVelocity(this.dashDirX * PlayerConfig.dash.speed, this.dashDirY * PlayerConfig.dash.speed);
        }
        // Hitung normalisasi dengan skalar agar tidak membuat Vector2 baru tiap frame.
        else if (axisX !== 0 || axisY !== 0)
        {
            const length = Math.sqrt(axisX * axisX + axisY * axisY);
            const speed = this.moveSpeed / length;

            this.setVelocity(axisX * speed, axisY * speed);
        }
        else
        {
            this.setVelocity(0, 0);
        }

        if (this.entityState === PlayerState.Invulnerable && !this.isInvulnerable())
        {
            this.entityState = PlayerState.Alive;
        }

        this.weapon?.update(
            delta,
            this.x,
            this.y + PlayerConfig.weapon.muzzleOffsetY,
            this._inputFireDown
        );
    }

    /** Mengembalikan nyawa, shield, dan status dash ke kondisi awal run. */
    public override resetForPool(x: number, y: number): void
    {
        super.resetForPool(x, y);

        this._lives = PlayerConfig.lives;
        this.shieldActive = false;
        this.dashRemainingMs = 0;
        this.dashCooldownRemainingMs = 0;
        this.dashDirX = 0;
        this.dashDirY = 0;
        this.invulnerableRemainingMs = 0;
        this.entityState = PlayerState.Alive;

        this.setAlpha(PlayerConfig.normalAlpha);
    }

    /** Menonaktifkan pemain saat nyawa habis. */
    public die(): void
    {
        this.entityState = PlayerState.Dead;
        this.setActive(false);
        this.setVisible(false);

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.enable = false;
    }

    /** Memulai dash hanya jika cooldown siap dan ada arah input. */
    private tryStartDash(axisX: number, axisY: number): void
    {
        if (!this._inputDashJustDown)
        {
            return;
        }

        if (!this.isDashReady() || (axisX === 0 && axisY === 0))
        {
            return;
        }

        const length = Math.sqrt(axisX * axisX + axisY * axisY);

        this.dashDirX = axisX / length;
        this.dashDirY = axisY / length;
        this.dashRemainingMs = PlayerConfig.dash.durationMs;
        this.dashCooldownRemainingMs = PlayerConfig.dash.cooldownMs;

        this.startInvulnerability(PlayerConfig.dash.invulnMs);
    }

    /** Mengedipkan alpha selama kebal tanpa membuat tween baru. */
    private updateBlink(): void
    {
        if (this.isDashing())
        {
            this.setAlpha(PlayerConfig.dashAlpha);

            return;
        }

        if (this.isInvulnerable())
        {
            const blinkOn = Math.floor(this.invulnerableRemainingMs / PlayerConfig.invulnBlinkMs) % 2 === 0;

            this.setAlpha(blinkOn ? PlayerConfig.normalAlpha : PlayerConfig.invulnAlpha);

            return;
        }

        this.setAlpha(PlayerConfig.normalAlpha);
    }
}
