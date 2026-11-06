import type { InputAction } from './InputAction';

/**
 * Kontrak sumber input yang bisa dikonsumsi entity.
 * Implementasi konkret (keyboard, gamepad, touch) berada di layer systems.
 */
export interface IInputSource
{
    /** Apakah aksi sedang ditekan pada frame ini. */
    isDown(action: InputAction): boolean;

    /** Apakah aksi baru saja ditekan pada frame ini. */
    isJustDown(action: InputAction): boolean;

    /** Nilai sumbu: -1 untuk action negatif, 1 untuk action positif, 0 bila netral. */
    getAxis(negative: InputAction, positive: InputAction): number;
}
