/** Kategori power-up menentukan cara item diperoleh dan digunakan. */
export enum PowerUpCategory {
    /** Diambil langsung saat disentuh pemain, tanpa masuk slot. */
    AutoPickup = 'auto-pickup',
    /** Masuk ke slot inventory, dipakai manual via keybind. */
    Slotted = 'slotted'
}