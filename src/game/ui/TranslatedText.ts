import * as Phaser from 'phaser';
import { GameEvents } from '../config/GameEvents';
import { LanguageManager } from '../systems/LanguageManager';
import type { TranslationParams } from '../types/Language';

/**
 * Text yang menyimpan key + params (bukan hasil terjemahan) dan memperbarui
 * dirinya setiap bahasa berubah. Listener dilepas saat scene shutdown atau
 * saat objek dihancurkan, sehingga scene yang ditutup tidak meninggalkan leak.
 * Konstruktor sudah memanggil `scene.add.existing`, jadi pemanggil tidak perlu menambahkannya lagi.
 */
export class TranslatedText extends Phaser.GameObjects.Text
{
    private translationKey: string;

    private params: TranslationParams;

    private readonly languageEmitter: Phaser.Events.EventEmitter;

    private readonly sceneEvents: Phaser.Events.EventEmitter;

    /** Membuat teks terjemahan dan langsung mendaftarkannya ke scene. */
    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        key: string,
        params?: TranslationParams,
        style: Phaser.Types.GameObjects.Text.TextStyle = {}
    )
    {
        super(scene, x, y, '', style);

        this.translationKey = key;
        this.params = { ...params };
        this.languageEmitter = scene.game.events;
        this.sceneEvents = scene.events;

        this.languageEmitter.on(GameEvents.LANGUAGE_CHANGED, this.refresh, this);
        this.sceneEvents.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown, this);

        scene.add.existing(this);
        this.refresh();
    }

    /** Mengganti key sekaligus params opsional, lalu render ulang. */
    public setKey(key: string, params?: TranslationParams): this
    {
        this.translationKey = key;
        this.params = { ...params };

        return this.refresh();
    }

    /** Mengganti seluruh params untuk key yang sama. */
    public setParams(params: TranslationParams): this
    {
        this.params = { ...params };

        return this.refresh();
    }

    /** Mengubah satu param tanpa mengganti key; nilai sama dilewati agar tidak render tiap frame. */
    public setParam(name: string, value: string | number): this
    {
        if (this.params[name] === value)
        {
            return this;
        }

        this.params[name] = value;

        return this.refresh();
    }

    /** Mengambil teks terbaru dari manager bahasa dan menuliskannya ke objek Text. */
    public refresh(): this
    {
        this.setText(LanguageManager.getInstance().t(this.translationKey, this.params));

        return this;
    }

    /** Membersihkan listener saat scene ditutup sebelum objek benar-benar dihancurkan. */
    private handleSceneShutdown(): void
    {
        this.detachListeners();
    }

    /** Melepas listener bahasa dan shutdown; aman dipanggil berulang. */
    private detachListeners(): void
    {
        this.languageEmitter.off(GameEvents.LANGUAGE_CHANGED, this.refresh, this);
        this.sceneEvents.off(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneShutdown, this);
    }

    destroy(fromScene?: boolean): void
    {
        this.detachListeners();

        super.destroy(fromScene);
    }
}
