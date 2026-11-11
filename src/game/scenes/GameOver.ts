import { Scene } from 'phaser';
import { ScreenConfig } from '../config/ScreenConfig';

/** Layar game over yang menunggu klik untuk kembali ke menu. */
export class GameOver extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameover_text : Phaser.GameObjects.Text;

    /** Mendaftarkan scene GameOver. */
    constructor ()
    {
        super('GameOver');
    }

    /** Menampilkan layar game over dan menunggu klik untuk kembali ke menu. */
    create ()
    {
        this.camera = this.cameras.main
        this.camera.setBackgroundColor(0xff0000);

        const center = ScreenConfig.center;

        this.background = this.add.image(center.x, center.y, 'background');
        this.background.setAlpha(0.5);

        this.gameover_text = this.add.text(center.x, center.y, 'Game Over', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        });
        this.gameover_text.setOrigin(0.5);

        this.input.once('pointerdown', () => {

            // Kembali ke menu setelah pemain menekan layar.
            this.scene.start('MainMenu');

        });
    }
}
