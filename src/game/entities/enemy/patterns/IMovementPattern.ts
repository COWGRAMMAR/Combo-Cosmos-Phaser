/** Target yang bisa menerima velocity dari sebuah pola gerak. */
export interface IMovementTarget
{
    setVelocity(x: number, y: number): unknown;
}

/** Kontrak pola gerak musuh; satu instance bisa dipakai ulang lewat spawn(). */
export interface IMovementPattern
{
    /** Sudut gerak dari arah bawah, dalam radian. */
    readonly angleRad: number;
    /** Menerapkan velocity pola ini ke target. */
    update(target: IMovementTarget, delta: number): void;
    /** Mengembalikan state internal pola sebelum dipakai lagi. */
    reset(): void;
}
