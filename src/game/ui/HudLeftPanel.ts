import * as Phaser from 'phaser';
import { HudConfig } from '../config/HudConfig';

/**
 * Panel kiri HUD (wadah container).
 * Saat ini kosong/placeholder, siap ditambah komponen lain (skor, combo, dll) nanti.
 * UI hanya menampilkan; tidak ada logika gameplay di sini.
 */
export class HudLeftPanel extends Phaser.GameObjects.Container
{
    /** Konstruktor panel kiri. */
    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number)
    {
        super(scene, x, y);

        const background = scene.add
            .rectangle(0, 0, width, height, 0x111827)
            .setOrigin(0);

        const label = scene.add
            .text(
                width / 2,
                height / 2,
                'HUD KIRI',
                {
                    fontFamily: HudConfig.label.fontFamily,
                    fontSize: HudConfig.label.fontSize,
                    color: HudConfig.label.color
                }
            )
            .setOrigin(0.5);

        this.add([background, label]);
    }

    /** Placeholder update — tidak ada data yang perlu ditampilkan saat ini. */
    public update(_time: number, _delta: number): void
    {
        // Tidak ada komponen aktif di panel kiri saat ini.
    }
}
