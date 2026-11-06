import { Scene, GameObjects } from 'phaser';
import { ScreenConfig } from '../config/ScreenConfig';

const LOGO_OFFSET_Y = -240;
const TITLE_OFFSET_Y = -80;

/** Menu utama yang menunggu klik untuk memulai game. */
export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;

    /** Mendaftarkan scene MainMenu. */
    constructor ()
    {
        super('MainMenu');
    }

    /** Menampilkan background, logo, judul, dan menunggu klik untuk mulai. */
    create ()
    {
        const center = ScreenConfig.center;

        this.background = this.add.image(center.x, center.y, 'background');

        this.logo = this.add.image(center.x, center.y + LOGO_OFFSET_Y, 'logo');

        this.title = this.add.text(center.x, center.y + TITLE_OFFSET_Y, 'Main Menu', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {

            // Mulai game setelah pemain menekan layar.
            this.scene.start('Game');

        });
    }
}
