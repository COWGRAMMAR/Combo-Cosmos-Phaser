import * as Phaser from 'phaser';
import { AssetKeys } from '../config/AssetKeys';

const TEXTURE_SIZE = 48;
const PLAYER_COLOR = 0xff3b30;
const ENEMY_COLOR = 0xffd60a;

/** Membuat tekstur placeholder pemain dan musuh jika belum tersedia. */
export const createPlaceholderTextures = (scene: Phaser.Scene): void =>
{
    if (scene.textures.exists(AssetKeys.Player) && scene.textures.exists(AssetKeys.Enemy))
    {
        return;
    }

    const graphics = scene.make.graphics({}, false);

    graphics.fillStyle(PLAYER_COLOR, 1);
    graphics.fillTriangle(TEXTURE_SIZE / 2, 4, 4, TEXTURE_SIZE - 4, TEXTURE_SIZE - 4, TEXTURE_SIZE - 4);
    graphics.generateTexture(AssetKeys.Player, TEXTURE_SIZE, TEXTURE_SIZE);

    graphics.clear();
    graphics.fillStyle(ENEMY_COLOR, 1);
    graphics.fillCircle(TEXTURE_SIZE / 2, TEXTURE_SIZE / 2, TEXTURE_SIZE / 2 - 4);
    graphics.generateTexture(AssetKeys.Enemy, TEXTURE_SIZE, TEXTURE_SIZE);

    graphics.destroy();
};
