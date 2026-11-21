import { Scene, GameObjects } from 'phaser';
import { AssetKeys } from '../config/AssetKeys';
import { ScreenConfig } from '../config/ScreenConfig';
import { TranslatedText } from '../ui/TranslatedText';
import { bindDesignCamera } from '../utils/designCamera';

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

        this.background = this.add.image(center.x, center.y, AssetKeys.Background)
            .setDisplaySize(ScreenConfig.width, ScreenConfig.height);

        this.logo = this.add.image(center.x, center.y + LOGO_OFFSET_Y, AssetKeys.Logo)
            .setDisplaySize(500, 108);

        this.title = new TranslatedText(this, center.x, center.y + TITLE_OFFSET_Y, 'main_menu.screen.title', undefined, {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center', resolution: 2
        }).setOrigin(0.5);

        bindDesignCamera(this);

        this.input.once('pointerdown', () => {

            // Mulai game setelah pemain menekan layar.
            this.scene.start('Game');

        });
    }
}
