/**
 * Kontrak posisi target tembakan.
 * Entity memakai kontrak ini agar tidak perlu mengimpor `entities/player/Player`.
 */
export interface ITargetPosition
{
    readonly x: number;
    readonly y: number;
    readonly active: boolean;
}
