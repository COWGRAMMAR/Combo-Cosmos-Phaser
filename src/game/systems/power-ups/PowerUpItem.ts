import * as Phaser from 'phaser';
import { PowerUpConfig } from '../../config/PowerUpConfig';
import { computeMovementOffset } from './PowerUpMovement';
import type { PowerUpMovementId, PowerUpMovementParams } from './PowerUpMovement';
import { PowerUpBuffType } from './PowerUpBuffType';

/**
 * Item power-up yang jatuh dari atas area bermain.
 * Posisi selalu dihitung dari base (baseX/baseY) memakai umur item, bukan diakumulasi,
 * sehingga item dapat di-recycle tanpa sisa drift dari pemakaian sebelumnya.
 */
export class PowerUpItem extends Phaser.GameObjects.Arc
{
    private buffType: PowerUpBuffType = PowerUpBuffType.Life;

    private movementId: PowerUpMovementId = 'straight';

    private params: PowerUpMovementParams = { speed: 0, amp: 0, ampY: 0, freq: 0, angleDeg: 0 };

    /** Arah offset horizontal: +1 atau -1. */
    private dir: number = 1;

    private baseX: number = 0;

    private baseY: number = 0;

    /** Umur item sejak spawn, dalam milidetik. Hanya bertambah dari fixed step. */
    private ageMs: number = 0;

    private consumed: boolean = false;

    private blocked: boolean = false;

    /** Membuat item nonaktif di pool; state sebenarnya diisi lewat reset(). */
    constructor (scene: Phaser.Scene)
    {
        super(
            scene,
            0,
            0,
            PowerUpConfig.render.itemRadius,
            0,
            360,
            false,
            PowerUpConfig.render.itemColor,
            PowerUpConfig.render.itemAlpha
        );

        scene.add.existing(this);
        this.setDepth(PowerUpConfig.render.itemDepth);
        this.setActive(false);
        this.setVisible(false);
    }

    /**
     * Satu-satunya pintu masuk untuk init maupun recycle item.
     * INVARIANT: setiap field yang diubah di advance()/consume()/setBlocked() wajib
     * dikembalikan ke nilai awal di sini, supaya item lama tidak membawa state sisa.
     */
    public reset (
        buffType: PowerUpBuffType,
        movementId: PowerUpMovementId,
        params: PowerUpMovementParams,
        dir: number,
        baseX: number,
        baseY: number
    ): void
    {
        this.buffType = buffType;
        this.movementId = movementId;
        this.params = params;
        this.dir = dir;
        this.baseX = baseX;
        this.baseY = baseY;
        this.ageMs = 0;
        this.consumed = false;
        this.blocked = false;

        this.setFillStyle(this.iconColorFor(buffType), PowerUpConfig.render.itemAlpha);
        this.setAlpha(PowerUpConfig.render.itemAlpha);
        this.setPosition(baseX, baseY);
        this.setActive(true);
        this.setVisible(true);
    }

    /** Majukan umur item satu langkah tetap lalu perbarui posisi dari base. */
    public advance (fixedStepMs: number): void
    {
        this.ageMs += fixedStepMs;

        const position = this.predict(this.ageMs);
        this.setPosition(position.x, position.y);
    }

    /**
     * Hitung posisi item jika umurnya mencapai ageMs.
     * Juga dipakai alat debug untuk menggambar prediksi jalur.
     */
    public predict (ageMs: number): { x: number; y: number }
    {
        const ageSec = ageMs / 1000;
        const offset = computeMovementOffset(this.movementId, ageSec, this.params);

        return {
            x: this.baseX + offset.dx * this.dir,
            y: this.baseY + this.params.speed * ageSec + offset.dy
        };
    }

    /** Tandai item tidak bisa diambil (semi-transparan) tanpa menghentikan geraknya. */
    public setBlocked (blocked: boolean): void
    {
        if (this.blocked === blocked)
        {
            return;
        }

        this.blocked = blocked;
        this.setAlpha(blocked ? PowerUpConfig.render.blockedAlpha : PowerUpConfig.render.itemAlpha);
    }

    /** Tandai item sudah diambil agar tidak diproses dua kali dalam frame yang sama. */
    public consume (): void
    {
        this.consumed = true;
    }

    /** Apakah item sudah diambil (menunggu dikembalikan ke pool). */
    public isConsumed (): boolean
    {
        return this.consumed;
    }

    /** Jenis buff yang dibawa item ini. */
    public getBuffType (): PowerUpBuffType
    {
        return this.buffType;
    }

    /** Pola gerak aktif item; dipakai visual debug untuk membedakan pola straight. */
    public getMovementId (): PowerUpMovementId
    {
        return this.movementId;
    }

    /** Sudut arah gerak item dalam derajat (selalu 0 untuk pola non-straight). */
    public getDirectionAngleDeg (): number
    {
        return this.params.angleDeg;
    }

    /** Warna isi item per jenis buff (single source: PowerUpConfig.render.iconColor). */
    private iconColorFor (type: PowerUpBuffType): number
    {
        return (PowerUpConfig.render as { iconColor: Record<string, number> }).iconColor[type];
    }
}
