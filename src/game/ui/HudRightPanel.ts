import * as Phaser from 'phaser';
import { PowerUpBuffType } from '../systems/power-ups/PowerUpBuffType';
import { PowerUpConfig } from '../config/PowerUpConfig';
import { AssetKeys } from '../config/AssetKeys';
import { AssetManager } from '../systems/AssetManager';
import { HudConfig } from '../config/HudConfig';
import { PowerUpSlotBox } from './PowerUpSlotBox';
import { ActiveBuffRow } from './ActiveBuffRow';
import { TranslatedText } from './TranslatedText';
import { HudDataProvider } from '../systems/HudDataProvider';

/**
 * Panel kanan HUD.
 * Menampilkan indikator HP (atas), 3 kotak slot buff (tengah), dan daftar durasi buff aktif (bawah).
 * UI hanya menampilkan; semua data diambil dari HudDataProvider (polling tiap frame).
 * Posisi tiap komponen diambil dari HudConfig.right.<component>.x/.y (relatif ke padding panel).
 */
export class HudRightPanel extends Phaser.GameObjects.Container
{
    private readonly provider: HudDataProvider;

    private readonly hpIcon: Phaser.GameObjects.Image;

    private readonly hpText: TranslatedText;

    private readonly slotBoxes: PowerUpSlotBox[] = [];

    private readonly buffRows: ActiveBuffRow[] = [];

    /** Konstruktor panel kanan. */
    constructor(
        scene: Phaser.Scene,
        provider: HudDataProvider,
        x: number,
        y: number,
        width: number,
        height: number
    )
    {
        super(scene, x, y);

        this.provider = provider;

        const rightCfg = HudConfig.right;
        const labelCfg = HudConfig.label;
        const pad = rightCfg.padding;

        // Background panel
        const background = scene.add
            .rectangle(0, 0, width, height, rightCfg.bgColor)
            .setOrigin(0);

        // Background harus masuk container paling awal agar tidak menimpa slot box.
        this.add(background);

        // ===== HP =====
        const hpLabelX = pad + rightCfg.hp.x;
        const hpLabelY = pad + rightCfg.hp.y;
        const hpLabel = new TranslatedText(
            scene,
            hpLabelX,
            hpLabelY,
            'hud.right.hp_label',
            undefined,
            {
                fontFamily: labelCfg.fontFamily,
                fontSize: rightCfg.hp.labelFontSize,
                color: labelCfg.color
            }
        ).setOrigin(0, 0);

        // HP icon + value: di bawah label, offset valueOffsetY
        const hpIconX = hpLabelX;
        const hpIconY = hpLabelY + rightCfg.hp.labelFontSize + rightCfg.hp.valueOffsetY;
        this.hpIcon = scene.add
            .image(
                hpIconX,
                hpIconY,
                AssetManager.resolve(AssetKeys.PowerUpIconLife).texture
            )
            .setDisplaySize(rightCfg.hp.iconSize, rightCfg.hp.iconSize)
            .setOrigin(0, 0);

        const hpTextX = hpIconX + rightCfg.hp.iconSize + rightCfg.hp.gap;
        const hpTextY = hpIconY + rightCfg.hp.iconSize / 2; // center vertikal dengan ikon
        this.hpText = new TranslatedText(
            scene,
            hpTextX,
            hpTextY,
            'hud.right.hp_value',
            { lives: 0 },
            {
                fontFamily: labelCfg.fontFamily,
                fontSize: rightCfg.hp.valueFontSize,
                color: rightCfg.hp.valueColor
            }
        ).setOrigin(0, 0.5);

        // ===== SLOT =====
        // Hitung y slot: di bawah HP (label + iconSize + valueOffsetY + sectionGap)
        const hpSectionH = rightCfg.hp.labelFontSize + rightCfg.hp.iconSize + rightCfg.hp.valueOffsetY;
        const slotY = rightCfg.hp.y + hpSectionH + rightCfg.sectionGap;
        (rightCfg.slot as any).y = slotY;

        const slotLabelX = pad + rightCfg.slot.x;
        const slotLabelY = pad + slotY;
        const slotLabel = new TranslatedText(
            scene,
            slotLabelX,
            slotLabelY,
            'hud.right.slot_label',
            undefined,
            {
                fontFamily: labelCfg.fontFamily,
                fontSize: rightCfg.slot.labelFontSize,
                color: labelCfg.color
            }
        ).setOrigin(0, 0);

        // Slot boxes: di bawah label + rowOffsetY, center vertikal
        const slotBoxesY = slotLabelY + rightCfg.slot.labelFontSize + rightCfg.slot.rowOffsetY;
        const slotCenterY = slotBoxesY + rightCfg.slot.size / 2;

        // firstBoxOffsetX: center 3 kotak di panel (padding + offset)
        // Total lebar 3 kotak + 2 gap = 3*64 + 2*18 = 192 + 36 = 228
        // Panel content width = width - 2*padding
        // Center: (contentWidth - totalBoxesWidth) / 2
        const contentWidth = width - pad * 2;
        const totalBoxesWidth = PowerUpConfig.item.slotCount * rightCfg.slot.size + (PowerUpConfig.item.slotCount - 1) * rightCfg.slot.gap;
        const firstBoxX = pad + Math.max(0, (contentWidth - totalBoxesWidth) / 2) + rightCfg.slot.firstBoxOffsetX;

        for (let i = 0; i < PowerUpConfig.item.slotCount; i++)
        {
            const box = new PowerUpSlotBox(
                scene,
                firstBoxX + i * (rightCfg.slot.size + rightCfg.slot.gap),
                slotCenterY + rightCfg.slot.boxOffsetY,
                rightCfg.slot.size
            );
            box.setDepth(10);
            box.setEmpty(String(i + 1));
            this.slotBoxes.push(box);
            this.add(box);
        }

        // ===== BUFF ROW =====
        // Hitung y buffRow: di bawah SLOT (label + labelFontSize + rowOffsetY + size + buffLabelGap + sectionGap)
        const slotSectionH = rightCfg.slot.labelFontSize + rightCfg.slot.rowOffsetY + rightCfg.slot.size + rightCfg.slot.buffLabelGap;
        const buffRowY = slotY + slotSectionH + rightCfg.sectionGap;
        (rightCfg.buffRow as any).y = buffRowY;

        const buffLabelX = pad + rightCfg.buffRow.x;
        const buffLabelY = pad + buffRowY;
        const buffLabel = new TranslatedText(
            scene,
            buffLabelX,
            buffLabelY,
            'hud.right.buff_label',
            undefined,
            {
                fontFamily: labelCfg.fontFamily,
                fontSize: rightCfg.buffRow.labelFontSize,
                color: labelCfg.color
            }
        ).setOrigin(0, 0);

        // Baris buff pertama: di bawah label + firstRowOffsetY
        this.buffRowStartY = buffLabelY + rightCfg.buffRow.labelFontSize + rightCfg.buffRow.firstRowOffsetY;

        this.add([hpLabel, this.hpIcon, this.hpText, slotLabel, buffLabel]);
    }

    /** Posisi Y baris buff pertama (relatif ke panel, sudah include padding). */
    private buffRowStartY: number = 0;

    /** Polling data dari HudDataProvider dan memperbarui semua tampilan. Dipanggil tiap frame. */
    public update(_time: number, _delta: number): void
    {
        const rightCfg = HudConfig.right;

        // --- Perbarui indikator HP ---
        if (this.provider.hasPlayer)
        {
            this.hpText.setParam('lives', this.provider.lives);
        }

        // --- Perbarui kotak slot ---
        if (this.provider.hasSlots)
        {
            for (let i = 0; i < this.slotBoxes.length; i++)
            {
                const type = this.provider.getSlotType(i);
                const count = this.provider.getSlotCountAt(i);
                const keybind = this.provider.getSlotKeybind(i);

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
        const activeTypes = this.provider.getActiveBuffTypes();
        if (activeTypes !== undefined)
        {
            const isPaused = this.provider.isBuffsPaused();

            // Cukupkan jumlah baris dengan jumlah buff aktif.
            while (this.buffRows.length < activeTypes.length)
            {
                const row = new ActiveBuffRow(
                    this.scene,
                    HudConfig.right.buffRow.x, // x dari config (0)
                    this.buffRowStartY + this.buffRows.length * (rightCfg.buffRow.height + rightCfg.buffRow.gap),
                    rightCfg.buffRow.progressBarWidth
                );
                this.buffRows.push(row);
                this.add(row);
            }

            // Sembunyikan baris kelebihan (buff yang sudah hilang).
            for (let i = activeTypes.length; i < this.buffRows.length; i++)
            {
                this.buffRows[i].setVisible(false);
            }

            // Perbarui data setiap baris.
            for (let i = 0; i < activeTypes.length; i++)
            {
                const type = activeTypes[i];
                const remainingMs = this.provider.getBuffRemainingMs(type);
                const totalMs = this.provider.getBuffTotalMs(type);
                const texture = this.iconTextureFor(type);
                const color = this.iconColorFor(type);

                const row = this.buffRows[i];
                row.setVisible(true);
                row.setY(this.buffRowStartY + i * (rightCfg.buffRow.height + rightCfg.buffRow.gap));
                row.setBuffData(texture, color, remainingMs, totalMs, isPaused);
            }
        }
    }

    /** Map tipe buff ke kunci tekstur ikon (single source: PowerUpConfig.render.iconAssetKey → AssetKeys). */
    private iconTextureFor(type: PowerUpBuffType): string
    {
        const key = (PowerUpConfig.render as { iconAssetKey: Record<string, string> }).iconAssetKey[type];
        return AssetManager.resolve(AssetKeys[key as keyof typeof AssetKeys]).texture;
    }

    /** Map tipe buff ke warna ikon (single source: PowerUpConfig.render.iconColor). */
    private iconColorFor(type: PowerUpBuffType): number
    {
        return (PowerUpConfig.render as { iconColor: Record<string, number> }).iconColor[type];
    }
}