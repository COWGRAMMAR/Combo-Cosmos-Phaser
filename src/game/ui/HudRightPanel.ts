import * as Phaser from 'phaser';
import { PowerUpBuffType } from '../systems/power-ups/PowerUpBuffType';
import { PowerUpConfig } from '../config/PowerUpConfig';
import { AssetKeys } from '../config/AssetKeys';
import { AssetManager } from '../systems/AssetManager';
import { HudSizeConfig } from '../config/HudSizeConfig';
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
            .rectangle(0, 0, width, height, 0x1f2937)
            .setOrigin(0);

        // --- Indikator HP (di atas) ---
        const hpLabel = scene.add
            .text(
                HudSizeConfig.rightPanelPadding,
                HudSizeConfig.rightPanelPadding,
                'HP',
                {
                    fontFamily: HudConfig.label.fontFamily,
                    fontSize: 20,
                    color: '#94a3b8'
                }
            )
            .setOrigin(0, 0);

        this.hpIcon = scene.add
            .image(
                HudSizeConfig.rightPanelPadding,
                HudSizeConfig.rightPanelPadding + HudSizeConfig.hp.iconSize + 8,
                AssetManager.resolve(AssetKeys.PowerUpIconLife).texture
            )
            .setDisplaySize(HudSizeConfig.hp.iconSize, HudSizeConfig.hp.iconSize)
            .setOrigin(0, 0);

        this.hpText = scene.add
            .text(
                HudSizeConfig.rightPanelPadding + HudSizeConfig.hp.iconSize + HudSizeConfig.hp.gap,
                HudSizeConfig.rightPanelPadding + HudSizeConfig.hp.iconSize + 8,
                '',
                {
                    fontFamily: HudConfig.label.fontFamily,
                    fontSize: HudSizeConfig.hp.fontSize,
                    color: '#ffffff'
                }
            )
            .setOrigin(0, 0.5);

        // --- 3 kotak slot buff (tengah) ---
        const slotLabel = scene.add
            .text(
                HudSizeConfig.rightPanelPadding,
                HudSizeConfig.rightPanelPadding + HudSizeConfig.hp.iconSize + 40,
                'SLOT',
                {
                    fontFamily: HudConfig.label.fontFamily,
                    fontSize: 20,
                    color: '#94a3b8'
                }
            )
            .setOrigin(0, 0);

        this.slotYStart = slotLabel.y + 24;

        for (let i = 0; i < 3; i++)
        {
            const box = new PowerUpSlotBox(
                scene,
                HudSizeConfig.rightPanelPadding + HudSizeConfig.slot.size / 2,
                this.slotYStart + i * (HudSizeConfig.slot.size + HudSizeConfig.slot.gap),
                HudSizeConfig.slot.size
            );
            box.setDepth(10);
            box.setEmpty(String(i + 1));
            this.slotBoxes.push(box);
            this.add(box);
        }

        // --- Daftar durasi buff aktif (bawah) ---
        const buffLabel = scene.add
            .text(
                HudSizeConfig.rightPanelPadding,
                this.slotYStart + 3 * (HudSizeConfig.slot.size + HudSizeConfig.slot.gap) + 20,
                'BUFF AKTIF',
                {
                    fontFamily: HudConfig.label.fontFamily,
                    fontSize: 20,
                    color: '#94a3b8'
                }
            )
            .setOrigin(0, 0);

        this.buffRowYStart = buffLabel.y + 24;

        this.add([background, hpLabel, this.hpIcon, this.hpText, slotLabel, buffLabel]);
    }

    /** Polling data dari logic layer dan memperbarui semua tampilan. Dipanggil tiap frame. */
    public update(_time: number, _delta: number): void
    {
        const game = this.gameScene as unknown as {
            getSlotManager?(): { getSlotType(i: number): PowerUpBuffType | null; getSlotCountAt(i: number): number; getMaxStackAt(i: number): number; getKeybind(i: number): string } | undefined;
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
                const maxStack = slotManager.getMaxStackAt(i);
                const keybind = slotManager.getKeybind(i);

                if (type === null)
                {
                    this.slotBoxes[i].setEmpty(keybind);
                }
                else
                {
                    const texture = this.iconTextureFor(type);
                    this.slotBoxes[i].setFilled(texture, count, maxStack, keybind);
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
                    HudSizeConfig.rightPanelPadding,
                    this.buffRowYStart + this.buffRows.length * (HudSizeConfig.buffRow.height + HudSizeConfig.buffRow.gap),
                    HudSizeConfig.buffRow.progressBarWidth
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
                row.setY(this.buffRowYStart + i * (HudSizeConfig.buffRow.height + HudSizeConfig.buffRow.gap));
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
