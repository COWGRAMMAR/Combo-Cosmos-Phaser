import * as Phaser from 'phaser';
import { PowerUpBuffType } from '../systems/power-ups/PowerUpBuffType';
import { PowerUpConfig } from '../config/PowerUpConfig';
import { AssetKeys } from '../config/AssetKeys';
import { AssetManager } from '../systems/AssetManager';
import { HudConfig } from '../config/HudConfig';
import { PowerUpSlotBox } from './PowerUpSlotBox';
import { ActiveBuffRow } from './ActiveBuffRow';

/**
 * Panel kanan HUD.
 * Menampilkan indikator HP (atas), 3 kotak slot buff (tengah), dan daftar durasi buff aktif (bawah).
 * UI hanya menampilkan; semua data diambil dari Game scene (logic layer) via polling tiap frame.
 */
export class HudRightPanel extends Phaser.GameObjects.Container
{
    private readonly gameScene: Phaser.Scene;

    private readonly hpIcon: Phaser.GameObjects.Image;

    private readonly hpText: Phaser.GameObjects.Text;

    private readonly slotBoxes: PowerUpSlotBox[] = [];

    private readonly buffRows: ActiveBuffRow[] = [];

    private readonly slotYStart: number;

    private readonly buffRowYStart: number;

    /** Konstruktor panel kanan. */
    constructor(scene: Phaser.Scene, gameScene: Phaser.Scene, x: number, y: number, width: number, height: number)
    {
        super(scene, x, y);

        this.gameScene = gameScene;

        const background = scene.add
            .rectangle(0, 0, width, height, HudConfig.panel.rightColor)
            .setOrigin(0);

        // Background harus masuk container paling awal agar tidak menimpa slot box.
        this.add(background);

        // --- Indikator HP (di atas) ---
        const hpLabel = scene.add
            .text(
                HudConfig.panel.padding,
                HudConfig.panel.padding,
                'HP',
                {
                    fontFamily: HudConfig.label.fontFamily,
                    fontSize: HudConfig.label.sectionFontSize,
                    color: HudConfig.label.color
                }
            )
            .setOrigin(0, 0);

        this.hpIcon = scene.add
            .image(
                HudConfig.panel.padding,
                HudConfig.panel.padding + HudConfig.hp.iconSize + HudConfig.hp.valueOffsetY,
                AssetManager.resolve(AssetKeys.PowerUpIconLife).texture
            )
            .setDisplaySize(HudConfig.hp.iconSize, HudConfig.hp.iconSize)
            .setOrigin(0, 0);

        this.hpText = scene.add
            .text(
                HudConfig.panel.padding + HudConfig.hp.iconSize + HudConfig.hp.gap,
                HudConfig.panel.padding + HudConfig.hp.iconSize + HudConfig.hp.valueOffsetY,
                '',
                {
                    fontFamily: HudConfig.label.fontFamily,
                    fontSize: HudConfig.hp.fontSize,
                    color: HudConfig.hp.valueColor
                }
            )
            .setOrigin(0, 0.5);

        // --- Kotak slot buff (tengah) ---
        const slotLabel = scene.add
            .text(
                HudConfig.panel.padding,
                HudConfig.panel.padding + HudConfig.hp.iconSize + HudConfig.slot.labelOffsetY,
                'SLOT',
                {
                    fontFamily: HudConfig.label.fontFamily,
                    fontSize: HudConfig.label.sectionFontSize,
                    color: HudConfig.label.color
                }
            )
            .setOrigin(0, 0);

        this.slotYStart = slotLabel.y + HudConfig.slot.rowGap;

        const slotCenterY = this.slotYStart + HudConfig.slot.size / 2;

        for (let i = 0; i < PowerUpConfig.slotCount; i++)
        {
            const box = new PowerUpSlotBox(
                scene,
                HudConfig.panel.padding
                    + HudConfig.slot.size / 2
                    + i * (HudConfig.slot.size + HudConfig.slot.gap),
                slotCenterY,
                HudConfig.slot.size
            );
            box.setDepth(10);
            box.setEmpty(String(i + 1));
            this.slotBoxes.push(box);
            this.add(box);
        }

        // --- Daftar durasi buff aktif (bawah) ---
        const buffLabel = scene.add
            .text(
                HudConfig.panel.padding,
                // Sisakan ruang untuk label keybind di bawah satu baris slot.
                this.slotYStart + HudConfig.slot.size + HudConfig.slot.buffLabelGap,
                'BUFF AKTIF',
                {
                    fontFamily: HudConfig.label.fontFamily,
                    fontSize: HudConfig.label.sectionFontSize,
                    color: HudConfig.label.color
                }
            )
            .setOrigin(0, 0);

        // Beri jarak setinggi label + celah agar baris buff tidak menimpa teks label.
        this.buffRowYStart = buffLabel.y + HudConfig.buffRow.labelGap;

        this.add([hpLabel, this.hpIcon, this.hpText, slotLabel, buffLabel]);
    }

    /** Polling data dari logic layer dan memperbarui semua tampilan. Dipanggil tiap frame. */
    public update(_time: number, _delta: number): void
    {
        const game = this.gameScene as unknown as {
            getSlotManager?(): { getSlotType(i: number): PowerUpBuffType | null; getSlotCountAt(i: number): number; getKeybind(i: number): string } | undefined;
            getActiveBuffManager?(): {
                getActiveBuffTypes(): PowerUpBuffType[];
                getTotalMs(type: PowerUpBuffType): number;
                getRemainingMs(type: PowerUpBuffType): number;
                isPaused(): boolean;
            } | undefined;
            getPlayer?(): { lives: number } | undefined;
        };

        const slotManager = game.getSlotManager?.();
        const activeBuffManager = game.getActiveBuffManager?.();
        const player = game.getPlayer?.();

        // --- Perbarui indikator HP ---
        if (player)
        {
            this.hpText.setText(`${player.lives}x`);
        }

        // --- Perbarui kotak slot ---
        if (slotManager)
        {
            for (let i = 0; i < this.slotBoxes.length; i++)
            {
                const type = slotManager.getSlotType(i);
                const count = slotManager.getSlotCountAt(i);
                const keybind = slotManager.getKeybind(i);

                if (type === null)
                {
                    this.slotBoxes[i].setEmpty(keybind);
                }
                else
                {
                    const texture = this.iconTextureFor(type);
                    this.slotBoxes[i].setFilled(texture, count, keybind);
                }
            }
        }

        // --- Perbarui daftar durasi buff aktif ---
        if (activeBuffManager)
        {
            const types = activeBuffManager.getActiveBuffTypes();
            const isPaused = activeBuffManager.isPaused();

            // Cukupkan jumlah baris dengan jumlah buff aktif.
            while (this.buffRows.length < types.length)
            {
                const row = new ActiveBuffRow(
                    this.scene,
                    HudConfig.panel.padding,
                    this.buffRowYStart + this.buffRows.length * (HudConfig.buffRow.height + HudConfig.buffRow.gap),
                    HudConfig.buffRow.progressBarWidth
                );
                this.buffRows.push(row);
                this.add(row);
            }

            // Sembunyikan baris kelebihan (buff yang sudah hilang).
            for (let i = types.length; i < this.buffRows.length; i++)
            {
                this.buffRows[i].setVisible(false);
            }

            // Perbarui data setiap baris.
            for (let i = 0; i < types.length; i++)
            {
                const type = types[i];
                const remainingMs = activeBuffManager.getRemainingMs(type);
                const totalMs = activeBuffManager.getTotalMs(type);
                const texture = this.iconTextureFor(type);
                const color = this.iconColorFor(type);

                const row = this.buffRows[i];
                row.setVisible(true);
                row.setY(this.buffRowYStart + i * (HudConfig.buffRow.height + HudConfig.buffRow.gap));
                row.setBuffData(texture, color, remainingMs, totalMs, isPaused);
            }
        }
    }

    /** Map tipe buff ke kunci tekstur ikon (single source: PowerUpConfig.iconAssetKey → AssetKeys). */
    private iconTextureFor(type: PowerUpBuffType): string
    {
        const key = (PowerUpConfig as { iconAssetKey: Record<string, string> }).iconAssetKey[type];
        return AssetManager.resolve(AssetKeys[key as keyof typeof AssetKeys]).texture;
    }

    /** Map tipe buff ke warna ikon (single source: PowerUpConfig.iconColor). */
    private iconColorFor(type: PowerUpBuffType): number
    {
        return (PowerUpConfig as { iconColor: Record<string, number> }).iconColor[type];
    }
}
