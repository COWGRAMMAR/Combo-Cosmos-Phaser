import { Scene, GameObjects } from 'phaser';

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
        this.background = this.add.image(512, 384, 'background');

        this.logo = this.add.image(512, 300, 'logo');

        this.title = this.add.text(512, 460, 'Main Menu', {
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
