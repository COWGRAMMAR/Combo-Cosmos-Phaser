/** Kontrak untuk entitas yang memiliki HP dan bisa menerima damage. */
export interface IDamageable
{
    readonly hp: number;
    readonly isAlive: boolean;

    /** Mengurangi HP sebesar amount; source opsional untuk info penyerang. */
    takeDamage(amount: number, source?: unknown): void;
}
