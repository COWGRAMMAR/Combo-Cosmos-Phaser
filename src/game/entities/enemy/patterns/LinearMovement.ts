import type { IMovementPattern, IMovementTarget } from './IMovementPattern';

const DEG_TO_RAD = Math.PI / 180;

/**
 * Gerak lurus dengan kecepatan dan sudut tetap.
 * Sudut 0 berarti lurus ke bawah; sudut positif membelok ke kanan.
 */
export class LinearMovement implements IMovementPattern
{
    public readonly speed: number;
    public readonly angleRad: number;

    private readonly velocityX: number;
    private readonly velocityY: number;

    /** Menghitung velocity sekali agar tidak ada alokasi di hot loop. */
    constructor(speed: number, angleDeg: number)
    {
        this.speed = speed;
        this.angleRad = angleDeg * DEG_TO_RAD;
        this.velocityX = Math.sin(this.angleRad) * speed;
        this.velocityY = Math.cos(this.angleRad) * speed;
    }

    /** Menerapkan velocity tetap setiap frame. */
    public update(target: IMovementTarget, _delta: number): void
    {
        target.setVelocity(this.velocityX, this.velocityY);
    }

    /** Gerak linear tidak menyimpan state yang perlu direset. */
    public reset(): void {}
}
