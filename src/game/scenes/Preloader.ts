import { Scene } from 'phaser';
import { ScreenConfig } from '../config/ScreenConfig';
import { createPlaceholderTextures } from '../utils/textures';

const BAR_WIDTH = 468;
const BAR_HEIGHT = 32;
const BAR_FILL_HEIGHT = 28;
const BAR_FILL_START = 4;
const BAR_FILL_RANGE = 460;
const BAR_OFFSET_X = -230;

export class Preloader extends Scene
{
    /** Mendaftarkan scene Preloader. */
    constructor ()
    {
        super('Preloader');
    }

    /** Menyiapkan tampilan background dan progress bar. */
    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(ScreenConfig.center.x, ScreenConfig.center.y, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(ScreenConfig.center.x, ScreenConfig.center.y, BAR_WIDTH, BAR_HEIGHT).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(
            ScreenConfig.center.x + BAR_OFFSET_X,
            ScreenConfig.center.y,
            BAR_FILL_START,
            BAR_FILL_HEIGHT,
            0xffffff
        );

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress: number) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = BAR_FILL_START + (BAR_FILL_RANGE * progress);

        });
    }

    /** Memuat aset game dan menampilkan progres loading. */
    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

        this.load.image('logo', 'logo.png');
    }

    /** Membuat tekstur placeholder lalu masuk ke MainMenu. */
    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        createPlaceholderTextures(this);

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}
