import { InputAction } from '../types/InputAction';

/** Peta data binding: satu action boleh memiliki beberapa tombol fisik. */
export type InputBindingMap = Readonly<Record<InputAction, readonly string[]>>;

/**
 * Binding default. Nama tombol mengikuti string yang dikenali
 * Phaser KeyboardPlugin.addKey (mis. 'UP', 'W', 'SPACE').
 */
export const DEFAULT_INPUT_BINDINGS = {
    [InputAction.MoveUp]: ['UP', 'W'],
    [InputAction.MoveDown]: ['DOWN', 'S'],
    [InputAction.MoveLeft]: ['LEFT', 'A'],
    [InputAction.MoveRight]: ['RIGHT', 'D'],
    [InputAction.Fire]: ['SPACE'],
    [InputAction.Dash]: ['SHIFT'],
    [InputAction.Slot1]: ['ONE'],
    [InputAction.Slot2]: ['TWO'],
    [InputAction.Slot3]: ['THREE'],
    [InputAction.DiscardModifier]: ['E'],
    [InputAction.Pause]: ['ESC']
} as const satisfies InputBindingMap;

/** Urutan action slot sesuai index slot power-up (0 → Slot1). */
export const SLOT_INPUT_ACTIONS = [
    InputAction.Slot1,
    InputAction.Slot2,
    InputAction.Slot3
] as const;
