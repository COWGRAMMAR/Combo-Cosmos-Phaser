import * as Phaser from 'phaser';
import { DEFAULT_INPUT_BINDINGS } from '../config/InputBindings';
import type { InputBindingMap } from '../config/InputBindings';
import { InputAction } from '../types/InputAction';
import type { IInputSource } from '../types/IInputSource';

interface KeyUsage
{
    key: Phaser.Input.Keyboard.Key;
    count: number;
}

/**
 * Sumber input berbasis keyboard Phaser.
 * Scene pemilik instance ini bertanggung jawab memanggil destroy() saat shutdown.
 */
export class InputManager implements IInputSource
{
    private readonly keyboard: Phaser.Input.Keyboard.KeyboardPlugin;
    private readonly keysByAction = new Map<InputAction, Phaser.Input.Keyboard.Key[]>();
    private readonly currentBindings = new Map<InputAction, readonly string[]>();
    private readonly keyUsage = new Map<number, KeyUsage>();
    private destroyed = false;

    /** Mendaftarkan seluruh binding default atau binding override dari caller. */
    constructor(scene: Phaser.Scene, bindings: InputBindingMap = DEFAULT_INPUT_BINDINGS)
    {
        const keyboard = scene.input.keyboard;

        if (!keyboard)
        {
            throw new Error('InputManager requires a keyboard plugin, but it is unavailable.');
        }

        this.keyboard = keyboard;

        for (const action of Object.values(InputAction) as InputAction[])
        {
            this.bindAction(action, bindings[action]);
        }
    }

    /** Apakah aksi sedang ditekan pada frame ini. */
    public isDown(action: InputAction): boolean
    {
        if (this.destroyed)
        {
            return false;
        }

        const keys = this.keysByAction.get(action);

        return keys !== undefined && keys.some((key) => key.isDown);
    }

    /** Apakah aksi baru saja ditekan pada frame ini. */
    public isJustDown(action: InputAction): boolean
    {
        if (this.destroyed)
        {
            return false;
        }

        const keys = this.keysByAction.get(action);

        return keys !== undefined && keys.some((key) => Phaser.Input.Keyboard.JustDown(key));
    }

    /** Nilai sumbu dari pasangan action negatif dan positif. */
    public getAxis(negative: InputAction, positive: InputAction): number
    {
        const positiveDown = this.isDown(positive);
        const negativeDown = this.isDown(negative);

        return (positiveDown ? 1 : 0) - (negativeDown ? 1 : 0);
    }

    /** Mengganti binding satu action tanpa menyentuh action lain. */
    public rebind(action: InputAction, keyNames: readonly string[]): void
    {
        if (this.destroyed)
        {
            return;
        }

        this.bindAction(action, keyNames);
    }

    /** Mengembalikan salinan nama tombol aktif untuk action tertentu. */
    public getBinding(action: InputAction): readonly string[]
    {
        return [...(this.currentBindings.get(action) ?? [])];
    }

    /** Mereset state tombol satu action agar tidak terbaca sebagai "baru ditekan" lagi. */
    public clearJustDown(action: InputAction): void
    {
        const keys = this.keysByAction.get(action);

        if (!keys)
        {
            return;
        }

        for (const key of keys)
        {
            key.reset();
        }
    }

    /** Melepas seluruh Key yang dikelola manager dan menonaktifkan instance. */
    public destroy(): void
    {
        if (this.destroyed)
        {
            return;
        }

        for (const action of Object.values(InputAction) as InputAction[])
        {
            this.unbindAction(action);
        }

        this.keyUsage.clear();
        this.keysByAction.clear();
        this.currentBindings.clear();
        this.destroyed = true;
    }

    /** Memasang binding baru untuk satu action. */
    private bindAction(action: InputAction, keyNames: readonly string[]): void
    {
        this.unbindAction(action);

        const uniqueNames = [...new Set(keyNames)];
        const keys: Phaser.Input.Keyboard.Key[] = [];

        for (const keyName of uniqueNames)
        {
            const key = this.keyboard.addKey(keyName);
            const usage = this.keyUsage.get(key.keyCode);

            if (usage)
            {
                usage.count += 1;
            }
            else
            {
                this.keyUsage.set(key.keyCode, { key, count: 1 });
            }

            keys.push(key);
        }

        this.keysByAction.set(action, keys);
        this.currentBindings.set(action, uniqueNames);
    }

    /** Melepas binding satu action dengan menghormati Key yang dipakai action lain. */
    private unbindAction(action: InputAction): void
    {
        const keys = this.keysByAction.get(action);

        if (!keys)
        {
            this.currentBindings.delete(action);
            return;
        }

        for (const key of keys)
        {
            const usage = this.keyUsage.get(key.keyCode);

            if (!usage)
            {
                continue;
            }

            usage.count -= 1;

            if (usage.count <= 0)
            {
                this.keyboard.removeKey(key);
                this.keyUsage.delete(key.keyCode);
            }
        }

        this.keysByAction.delete(action);
        this.currentBindings.delete(action);
    }
}
