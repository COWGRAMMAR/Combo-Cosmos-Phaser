import { Scene } from 'phaser';
import { GameEvents } from '../config/GameEvents';
import { PauseConfig } from '../config/PauseConfig';
import { ScreenConfig } from '../config/ScreenConfig';
import { bindDesignCamera } from '../utils/designCamera';

/** Overlay pause di atas gameplay; isinya masih placeholder. TEMP */
export class Pause extends Scene
{
    /** Mendaftarkan scene Pause. */
    constructor()
    {
        super('Pause');
    }

    /** Menampilkan overlay dan menunggu klik untuk resume. */
    create(): void
    {
        const center = ScreenConfig.center;

        this.add.rectangle(
            center.x,
            center.y,
            ScreenConfig.width,
            ScreenConfig.height,
            PauseConfig.overlay.color,
            PauseConfig.overlay.alpha
        );

        this.add.text(
            center.x,
            center.y + PauseConfig.title.offsetY,
            PauseConfig.title.text,
            {
                fontFamily: PauseConfig.title.fontFamily,
                fontSize: PauseConfig.title.fontSize,
                color: PauseConfig.title.color,
                stroke: PauseConfig.title.stroke,
                strokeThickness: PauseConfig.title.strokeThickness,
                resolution: 2
            }
        ).setOrigin(0.5);

        this.add.text(
            center.x,
            center.y + PauseConfig.hint.offsetY,
            PauseConfig.hint.text,
            {
                fontFamily: PauseConfig.hint.fontFamily,
                fontSize: PauseConfig.hint.fontSize,
                color: PauseConfig.hint.color,
                resolution: 2
            }
        ).setOrigin(0.5);

        bindDesignCamera(this);

        this.input.once('pointerdown', () => {

            // Minta PauseManager melanjutkan gameplay dan HUD.
            this.game.events.emit(GameEvents.PAUSE_RESUME);

        });
    }
}
