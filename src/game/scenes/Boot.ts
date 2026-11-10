import { Scene } from 'phaser';
import { AssetManager } from '../systems/AssetManager';

export class Boot extends Scene
{
    /** Mendaftarkan scene Boot. */
    constructor ()
    {
        super('Boot');
    }

    /** Memuat aset minimal yang dibutuhkan Preloader. */
    preload ()
    {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.

        AssetManager.preloadBoot(this);
    }

    /** Lanjut ke scene Preloader setelah aset Boot selesai dimuat. */
    create ()
    {
        this.scene.start('Preloader');
    }
}
