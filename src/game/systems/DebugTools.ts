import * as Phaser from 'phaser';
import { PowerUpType } from './PowerUpManager';

/** Aksi yang dipanggil oleh tombol debug. */
export interface DebugActions
{
    toggleOverlay: () => void;
    stress: (count: number) => void;
    cycleLanes: () => void;
    powerUp: (kind: PowerUpType) => void;
}

/** Urutan power-up untuk tombol Z sampai N. */
const POWER_UP_KEYS: readonly PowerUpType[] = [
    PowerUpType.Lane,
    PowerUpType.AtkSpeed,
    PowerUpType.Shield,
    PowerUpType.Laser,
    PowerUpType.Bomb,
    PowerUpType.Life
];

/**
 * Tombol debug yang sengaja di-hardcode, terpisah dari InputAction.
 * File ini adalah pintu masuk untuk sistem debug yang lebih lengkap nanti.
 */
export class DebugTools
{
    private readonly scene: Phaser.Scene;
    private readonly actions: DebugActions;
    private readonly toggleKey: Phaser.Input.Keyboard.Key;
    private readonly stress1000Key: Phaser.Input.Keyboard.Key;
    private readonly stress3000Key: Phaser.Input.Keyboard.Key;
    private readonly lanesKey: Phaser.Input.Keyboard.Key;
    private readonly powerUpKeys: Phaser.Input.Keyboard.Key[];

    /** Mendaftarkan tombol debug; melempar error kalau keyboard tidak tersedia. */
    constructor(scene: Phaser.Scene, actions: DebugActions)
    {
        const keyboard = scene.input.keyboard;

        if (!keyboard)
        {
            throw new Error('Keyboard tidak tersedia untuk DebugTools');
        }

        // Tombol debug sengaja hardcode (bukan InputAction) agar bisa dicabut tanpa
        // mengubah keybind gameplay. Daftar lengkap tombol ada di doc/debug-toggles.md.
        const keyCodes = Phaser.Input.Keyboard.KeyCodes;
        // Z..N dipetakan satu-satu ke POWER_UP_KEYS berdasarkan index (Z = Lane, N = Life).
        const powerUpCodes = [
            keyCodes.Z,
            keyCodes.X,
            keyCodes.C,
            keyCodes.V,
            keyCodes.B,
            keyCodes.N
        ];

        this.scene = scene;
        this.actions = actions;
        this.toggleKey = keyboard.addKey(keyCodes.F1);
        this.stress1000Key = keyboard.addKey(keyCodes.F2);
        this.stress3000Key = keyboard.addKey(keyCodes.F3);
        this.lanesKey = keyboard.addKey(keyCodes.F4);
        this.powerUpKeys = powerUpCodes.map((code) => keyboard.addKey(code));
    }

    /** Memeriksa tombol debug sekali per frame. */
    public update(): void
    {
        if (Phaser.Input.Keyboard.JustDown(this.toggleKey))
        {
            // F1: tampilkan/sembunyikan overlay statistik (FPS, isi pool peluru, status buff).
            this.actions.toggleOverlay();
        }

        if (Phaser.Input.Keyboard.JustDown(this.stress1000Key))
        {
            // F2: hujan 100 peluru musuh dari atas layar untuk uji baseline performa.
            this.actions.stress(100);
        }

        if (Phaser.Input.Keyboard.JustDown(this.stress3000Key))
        {
            // F3: hujan 3000 peluru musuh untuk menguji batas pool dan penurunan FPS.
            this.actions.stress(3000);
        }

        if (Phaser.Input.Keyboard.JustDown(this.lanesKey))
        {
            // F4: putar jumlah jalur tembak pemain 1 → 2 → ... → maxLanes → 1.
            this.actions.cycleLanes();
        }

        for (let i = 0; i < this.powerUpKeys.length; i++)
        {
            if (Phaser.Input.Keyboard.JustDown(this.powerUpKeys[i]))
            {
                // Z..N: aktifkan satu power-up langsung (Z=Lane, X=AtkSpeed, C=Shield, V=Laser, B=Bomb, N=Life).
                this.actions.powerUp(POWER_UP_KEYS[i]);
            }
        }
    }

    /** Melepas seluruh tombol debug dari keyboard. */
    public destroy(): void
    {
        const keyboard = this.scene.input.keyboard;

        if (!keyboard)
        {
            return;
        }

        keyboard.removeKey(this.toggleKey);
        keyboard.removeKey(this.stress1000Key);
        keyboard.removeKey(this.stress3000Key);
        keyboard.removeKey(this.lanesKey);

        for (let i = 0; i < this.powerUpKeys.length; i++)
        {
            keyboard.removeKey(this.powerUpKeys[i]);
        }
    }
}


