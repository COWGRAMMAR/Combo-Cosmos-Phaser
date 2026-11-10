/**
 * Aksi input semantik yang dikenali game.
 * Entity tidak boleh tahu tombol fisik; semua mapping ada di config/InputBindings.
 */
export enum InputAction
{
    MoveUp = 'move-up',
    MoveDown = 'move-down',
    MoveLeft = 'move-left',
    MoveRight = 'move-right',
    Fire = 'fire',
    Dash = 'dash',
    Slot1 = 'slot-1',
    Slot2 = 'slot-2',
    Slot3 = 'slot-3',
    DiscardModifier = 'discard-modifier',
    Pause = 'pause'
}
