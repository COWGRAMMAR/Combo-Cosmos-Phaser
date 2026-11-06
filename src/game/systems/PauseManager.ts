import * as Phaser from 'phaser';
import { GameEvents } from '../config/GameEvents';

/**
 * Mengatur pause gameplay beserta HUD lewat overlay scene Pause.
 * Pause dipicu otomatis saat window/tab kehilangan fokus, dan hanya bisa
 * dilanjutkan lewat permintaan resume eksplisit.
 */
export class PauseManager
{
    private readonly scene: Phaser.Scene;
    private _isPaused: boolean = false;

    /** Memasang listener auto-pause dan permintaan resume. */
    constructor(scene: Phaser.Scene)
    {
        this.scene = scene;

        const game = scene.game;
        game.events.on(Phaser.Core.Events.BLUR, this.handleAutoPause);
        game.events.on(Phaser.Core.Events.HIDDEN, this.handleAutoPause);
        game.events.on(GameEvents.PAUSE_RESUME, this.handleResumeRequest);
    }

    /** Status pause saat ini. */
    get isPaused(): boolean
    {
        return this._isPaused;
    }

    /** Membekukan gameplay dan HUD, lalu menampilkan overlay Pause. */
    public pause(): void
    {
        if (this._isPaused || !this.scene.scene.isActive())
        {
            return;
        }

        this._isPaused = true;

        this.scene.scene.launch('Pause');

        if (this.scene.scene.isActive('Hud'))
        {
            this.scene.scene.pause('Hud');
        }

        this.scene.scene.pause();
    }

    /** Melanjutkan gameplay dan HUD, lalu menutup overlay Pause. */
    public resume(): void
    {
        if (!this._isPaused)
        {
            return;
        }

        this._isPaused = false;

        if (this.scene.scene.isPaused('Hud'))
        {
            this.scene.scene.resume('Hud');
        }

        if (this.scene.scene.isActive('Pause'))
        {
            this.scene.scene.stop('Pause');
        }

        this.scene.scene.resume();
    }

    /** Membalik status pause saat ini. */
    public toggle(): void
    {
        if (this._isPaused)
        {
            this.resume();
        }
        else
        {
            this.pause();
        }
    }

    /** Melepas listener dan merapikan scene yang mungkin tertinggal. */
    public destroy(): void
    {
        const game = this.scene.game;

        game.events.off(Phaser.Core.Events.BLUR, this.handleAutoPause);
        game.events.off(Phaser.Core.Events.HIDDEN, this.handleAutoPause);
        game.events.off(GameEvents.PAUSE_RESUME, this.handleResumeRequest);

        if (this.scene.scene.isPaused('Hud'))
        {
            this.scene.scene.resume('Hud');
        }

        if (this.scene.scene.isActive('Pause'))
        {
            this.scene.scene.stop('Pause');
        }
    }

    /** Auto-pause saat fokus window atau tab hilang. */
    private readonly handleAutoPause = (): void =>
    {
        this.pause();
    };

    /** Resume hanya saat overlay meminta, bukan saat fokus kembali. */
    private readonly handleResumeRequest = (): void =>
    {
        this.resume();
    };
}
