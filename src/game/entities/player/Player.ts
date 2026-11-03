import * as Phaser from 'phaser';
import type { EntityConfig } from '../../types/EntityConfig';
import { BaseEntity } from '../BaseEntity';
import { PlayerState } from './PlayerState';

/** Entitas pemain yang bergerak empat arah dengan keyboard. */
export class Player extends BaseEntity
{
    public entityState: PlayerState = PlayerState.Alive;

    private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private readonly keyW: Phaser.Input.Keyboard.Key;
    private readonly keyA: Phaser.Input.Keyboard.Key;
    private readonly keyS: Phaser.Input.Keyboard.Key;
    private readonly keyD: Phaser.Input.Keyboard.Key;

    /** Menyiapkan input keyboard untuk gerakan empat arah. */
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, config: EntityConfig)
    {
        super(scene, x, y, texture, config);

        const keyboard = scene.input.keyboard;

        if (!keyboard)
        {
            throw new Error('Player requires keyboard input, but the keyboard plugin is unavailable.');
        }

        this.cursors = keyboard.createCursorKeys();
        this.keyW = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    }

    /** Menghitung arah gerak dari tombol panah atau WASD, lalu menerapkan velocity. */
    protected updateEntity(_time: number, _delta: number): void
    {
        const left = this.cursors.left.isDown || this.keyA.isDown;
        const right = this.cursors.right.isDown || this.keyD.isDown;
        const up = this.cursors.up.isDown || this.keyW.isDown;
        const down = this.cursors.down.isDown || this.keyS.isDown;

        const direction = new Phaser.Math.Vector2(
            (right ? 1 : 0) - (left ? 1 : 0),
            (down ? 1 : 0) - (up ? 1 : 0)
        );

        if (direction.lengthSq() > 0)
        {
            direction.normalize().scale(this.moveSpeed);
        }

        this.setVelocity(direction.x, direction.y);
    }

    /** Menonaktifkan pemain saat HP habis. */
    public die(): void
    {
        this.entityState = PlayerState.Dead;
        this.setActive(false);
        this.setVisible(false);

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.enable = false;
    }
}
