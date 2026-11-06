import * as Phaser from 'phaser';
import type { EntityConfig } from '../../types/EntityConfig';
import type { IInputSource } from '../../types/IInputSource';
import { InputAction } from '../../types/InputAction';
import { BaseEntity } from '../BaseEntity';
import { PlayerState } from './PlayerState';

/** Entitas pemain yang bergerak empat arah lewat sumber input. */
export class Player extends BaseEntity
{
    public entityState: PlayerState = PlayerState.Alive;

    private readonly inputSource: IInputSource;

    /** Menyimpan sumber input yang di-inject oleh scene. */
    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        texture: string,
        config: EntityConfig,
        inputSource: IInputSource
    )
    {
        super(scene, x, y, texture, config);

        this.inputSource = inputSource;
    }

    /** Membaca aksi gerak dari sumber input, lalu menerapkan velocity. */
    protected updateEntity(_time: number, _delta: number): void
    {
        const direction = new Phaser.Math.Vector2(
            this.inputSource.getAxis(InputAction.MoveLeft, InputAction.MoveRight),
            this.inputSource.getAxis(InputAction.MoveUp, InputAction.MoveDown)
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
