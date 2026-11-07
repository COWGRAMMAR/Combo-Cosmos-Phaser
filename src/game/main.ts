import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { Hud } from './scenes/Hud';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game, Scale } from 'phaser';
import { Pause } from './scenes/Pause';
import { Preloader } from './scenes/Preloader';
import { ScreenConfig } from './config/ScreenConfig';
import { TimeConfig } from './config/TimeConfig';
import { WorldConfig } from './config/WorldConfig';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: ScreenConfig.width,
    height: ScreenConfig.height,
    parent: 'game-container',
    backgroundColor: WorldConfig.letterbox.color,
    scale: {
        // Canvas mengikuti ukuran window (tidak di-upscale) supaya selalu tajam.
        mode: Scale.RESIZE,
        autoCenter: Scale.NO_CENTER
    },
    fps: {
        target: TimeConfig.targetFps,
        limit: TimeConfig.maxFps,
        min: TimeConfig.minFps
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame,
        Hud,
        Pause,
        GameOver
    ]
};

/** Membuat instance Phaser Game dengan parent container tertentu. */
const StartGame = (parent: string) => {

    return new Game({ ...config, parent });

}

export default StartGame;
