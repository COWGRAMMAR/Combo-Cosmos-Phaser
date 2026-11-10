import { Scene } from 'phaser';
import { GameEvents } from '../config/GameEvents';
import { DEFAULT_INPUT_BINDINGS } from '../config/InputBindings';
import { PauseConfig } from '../config/PauseConfig';
import { ScreenConfig } from '../config/ScreenConfig';
import { InputAction } from '../types/InputAction';

/** Overlay pause di atas gameplay; isinya masih placeholder. TEMP */
export class Pause extends Scene
{
    /** Mendaftarkan scene Pause. */
    constructor()
    {
        super('Pause');
    }

    /** Menampilkan overlay dan menunggu klik atau ESC untuk resume. */
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
                strokeThickness: PauseConfig.title.strokeThickness
            }
        ).setOrigin(0.5);

        this.add.text(
            center.x,
            center.y + PauseConfig.hint.offsetY,
            PauseConfig.hint.text,
            {
                fontFamily: PauseConfig.hint.fontFamily,
                fontSize: PauseConfig.hint.fontSize,
                color: PauseConfig.hint.color
            }
        ).setOrigin(0.5);

        this.input.once('pointerdown', () => {

            // Minta PauseManager melanjutkan gameplay dan HUD.
            this.game.events.emit(GameEvents.PAUSE_RESUME);

        });

        const pauseKey = DEFAULT_INPUT_BINDINGS[InputAction.Pause][0];

        // Scene Game berhenti update saat paused, jadi tombol resume ditangani di sini.
        this.input.keyboard?.on(`keydown-${pauseKey}`, (event: KeyboardEvent) => {

            // Abaikan auto-repeat selama tombol masih ditahan.
            if (event.repeat)
            {
                return;
            }

            this.game.events.emit(GameEvents.PAUSE_RESUME);

        });
    }
}
