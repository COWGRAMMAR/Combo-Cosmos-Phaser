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
    [InputAction.Dash]: ['SHIFT']
} as const satisfies InputBindingMap;
