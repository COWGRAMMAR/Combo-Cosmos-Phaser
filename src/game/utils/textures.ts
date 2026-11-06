import * as Phaser from 'phaser';
import { AssetKeys } from '../config/AssetKeys';
import { EnemyConfig } from '../config/EnemyConfig';
import { PlayerConfig } from '../config/PlayerConfig';

const TEXTURE_SIZE = 48;
const PLAYER_COLOR = 0xff3b30;
const ENEMY_COLOR = 0xffd60a;
const PLAYER_BULLET_COLOR = 0x7df9ff;
const ENEMY_BULLET_COLOR = 0xff4fd8;

/**
 * Membuat tekstur placeholder untuk entitas dan peluru.
 * Setiap tekstur dicek satu per satu supaya gambar final yang sudah dimuat
 * lewat Preloader tidak tertimpa saat game berjalan.
 */
export const createPlaceholderTextures = (scene: Phaser.Scene): void =>
{
    const graphics = scene.make.graphics({}, false);

    if (!scene.textures.exists(AssetKeys.Player))
    {
        graphics.fillStyle(PLAYER_COLOR, 1);
        graphics.fillTriangle(TEXTURE_SIZE / 2, 4, 4, TEXTURE_SIZE - 4, TEXTURE_SIZE - 4, TEXTURE_SIZE - 4);
        graphics.generateTexture(AssetKeys.Player, TEXTURE_SIZE, TEXTURE_SIZE);
        graphics.clear();
    }

    if (!scene.textures.exists(AssetKeys.Enemy))
    {
        graphics.fillStyle(ENEMY_COLOR, 1);
        graphics.fillCircle(TEXTURE_SIZE / 2, TEXTURE_SIZE / 2, TEXTURE_SIZE / 2 - 4);
        graphics.generateTexture(AssetKeys.Enemy, TEXTURE_SIZE, TEXTURE_SIZE);
        graphics.clear();
    }

    if (!scene.textures.exists(AssetKeys.PlayerBullet))
    {
        const radius = PlayerConfig.weapon.bulletRadius;

        graphics.fillStyle(PLAYER_BULLET_COLOR, 1);
        graphics.fillCircle(radius, radius, radius);
        graphics.generateTexture(AssetKeys.PlayerBullet, radius * 2, radius * 2);
        graphics.clear();
    }

    if (!scene.textures.exists(AssetKeys.EnemyBullet))
    {
        const radius = EnemyConfig.bullet.radius;

        graphics.fillStyle(ENEMY_BULLET_COLOR, 1);
        graphics.fillCircle(radius, radius, radius);
        graphics.generateTexture(AssetKeys.EnemyBullet, radius * 2, radius * 2);
        graphics.clear();
    }

    graphics.destroy();
};
