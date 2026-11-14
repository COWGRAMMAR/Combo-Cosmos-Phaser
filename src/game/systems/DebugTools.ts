import * as Phaser from 'phaser';
import { PowerUpType } from './PowerUpManager';

/** Aksi yang dipanggil oleh tombol debug. */
export interface DebugActions
{
    toggleOverlay: () => void;
    stress: (count: number) => void;
    cycleLanes: () => void;
    powerUp: (kind: PowerUpType) => void;
    resetEnemyTest: () => void;
}

/** Opsi tombol debug yang berasal dari config. */
export interface DebugOptions
{
    /** Nama key Phaser untuk reset skenario; undefined membuat tombol tidak didaftarkan. */
    resetKey?: string;
}

/** Urutan power-up untuk tombol angka 1 sampai 6. */
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
    private readonly resetKey?: Phaser.Input.Keyboard.Key;

    /** Mendaftarkan tombol debug; melempar error kalau keyboard tidak tersedia. */
    constructor(scene: Phaser.Scene, actions: DebugActions, options?: DebugOptions)
    {
        const keyboard = scene.input.keyboard;

        if (!keyboard)
        {
            throw new Error('Keyboard tidak tersedia untuk DebugTools');
        }

        const keyCodes = Phaser.Input.Keyboard.KeyCodes;
        const numberCodes = [
            keyCodes.ONE,
            keyCodes.TWO,
            keyCodes.THREE,
            keyCodes.FOUR,
            keyCodes.FIVE,
            keyCodes.SIX
        ];

        this.scene = scene;
        this.actions = actions;
        this.toggleKey = keyboard.addKey(keyCodes.F1);
        this.stress1000Key = keyboard.addKey(keyCodes.F2);
        this.stress3000Key = keyboard.addKey(keyCodes.F3);
        this.lanesKey = keyboard.addKey(keyCodes.F4);
        this.powerUpKeys = numberCodes.map((code) => keyboard.addKey(code));
        this.resetKey = options?.resetKey ? keyboard.addKey(options.resetKey) : undefined;
    }

    /** Memeriksa tombol debug sekali per frame. */
    public update(): void
    {
        if (Phaser.Input.Keyboard.JustDown(this.toggleKey))
        {
            this.actions.toggleOverlay();
        }

        if (Phaser.Input.Keyboard.JustDown(this.stress1000Key))
        {
            this.actions.stress(1000);
        }

        if (Phaser.Input.Keyboard.JustDown(this.stress3000Key))
        {
            this.actions.stress(3000);
        }

        if (Phaser.Input.Keyboard.JustDown(this.lanesKey))
        {
            this.actions.cycleLanes();
        }

        for (let i = 0; i < this.powerUpKeys.length; i++)
        {
            if (Phaser.Input.Keyboard.JustDown(this.powerUpKeys[i]))
            {
                this.actions.powerUp(POWER_UP_KEYS[i]);
            }
        }

        if (this.resetKey && Phaser.Input.Keyboard.JustDown(this.resetKey))
        {
            this.actions.resetEnemyTest();
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

        if (this.resetKey)
        {
            keyboard.removeKey(this.resetKey);
        }
    }
}
