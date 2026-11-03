import { Scene } from 'phaser';
import { AssetKeys } from '../config/AssetKeys';
import { Balance } from '../config/Balance';
import { Enemy } from '../entities/enemy/Enemy';
import { Player } from '../entities/player/Player';
import { Team } from '../types/Team';

/** Scene utama permainan untuk pengujian awal entitas. */
export class Game extends Scene
{
    /** Mendaftarkan scene Game. */
    constructor ()
    {
        super('Game');
    }

    /** Menyiapkan background, pemain, dan satu musuh untuk pengujian awal. */
    create (): void
    {
        this.cameras.main.setBackgroundColor(Balance.background.color);

        new Player(this, 512, 680, AssetKeys.Player, {
            team: Team.Player,
            maxHp: Balance.player.maxHp,
            moveSpeed: Balance.player.moveSpeed,
            bodyRadius: Balance.player.bodyRadius
        });

        new Enemy(this, 512, 160, AssetKeys.Enemy, {
            team: Team.Enemy,
            maxHp: Balance.enemy.maxHp,
            moveSpeed: Balance.enemy.moveSpeed,
            bodyRadius: Balance.enemy.bodyRadius
        });
    }
}
