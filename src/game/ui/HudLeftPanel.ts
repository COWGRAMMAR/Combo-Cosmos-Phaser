import * as Phaser from 'phaser';
import { HudConfig } from '../config/HudConfig';
import { HudDataProvider } from '../systems/HudDataProvider';
import { TranslatedText } from './TranslatedText';

/**
 * Panel kiri HUD.
 * Menampilkan: SKOR, COMBO (+bar timer), PENGALI, DASH (+bar cooldown).
 * UI hanya memformat dan menampilkan data dari HudDataProvider; tidak ada logika gameplay.
 * Posisi tiap komponen diambil dari HudConfig.left.<component>.x/.y (relatif ke padding panel).
 */
export class HudLeftPanel extends Phaser.GameObjects.Container
{
    private readonly provider: HudDataProvider;

    // Komponen skor
    private readonly scoreLabel: TranslatedText;
    private readonly scoreValue: Phaser.GameObjects.Text;

    // Komponen combo
    private readonly comboLabel: TranslatedText;
    private readonly comboValue: Phaser.GameObjects.Text;
    private readonly comboBarBg: Phaser.GameObjects.Graphics;
    private readonly comboBarFill: Phaser.GameObjects.Graphics;

    // Komponen pengali
    private readonly multiplierLabel: TranslatedText;
    private readonly multiplierValue: Phaser.GameObjects.Text;

    // Komponen dash
    private readonly dashLabel: TranslatedText;
    private readonly dashStatus: TranslatedText;
    private readonly dashBarBg: Phaser.GameObjects.Graphics;
    private readonly dashBarFill: Phaser.GameObjects.Graphics;

    /** Konstruktor panel kiri. */
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

        const leftCfg = HudConfig.left;
        const labelCfg = HudConfig.label;
        const pad = leftCfg.padding;

        // Background panel
        const bg = scene.add
            .rectangle(0, 0, width, height, leftCfg.bgColor)
            .setOrigin(0);

        // ---- Hitung posisi Y tiap section secara dinamis ----
        // SKOR: y = 0 (sudah di config)
        // COMBO: y = SKOR.y + SKOR.labelFontSize + SKOR.gapLabelValue + SKOR.valueFontSize + sectionGap
        // PENGALI: y = COMBO.y + COMBO.labelFontSize + COMBO.gapLabelValue + COMBO.valueFontSize + sectionGap
        // DASH: y = PENGALI.y + PENGALI.labelFontSize + PENGALI.gapLabelValue + PENGALI.valueFontSize + sectionGap

        const scoreY = leftCfg.score.y;
        const scoreLabelH = leftCfg.score.labelFontSize;
        const scoreValueH = leftCfg.score.valueFontSize;

        const comboY = scoreY + scoreLabelH + leftCfg.score.gapLabelValue + scoreValueH + leftCfg.sectionGap;
        const comboLabelH = leftCfg.combo.labelFontSize;
        const comboValueH = leftCfg.combo.valueFontSize;

        const multiplierY = comboY + comboLabelH + leftCfg.combo.gapLabelValue + comboValueH + leftCfg.sectionGap;
        const multiplierLabelH = leftCfg.multiplier.labelFontSize;
        const multiplierValueH = leftCfg.multiplier.valueFontSize;

        const dashY = multiplierY + multiplierLabelH + leftCfg.multiplier.gapLabelValue + multiplierValueH + leftCfg.sectionGap;
        const dashLabelH = leftCfg.dash.labelFontSize;

        // Tulis posisi y yang dihitung ke config (mutasi sekali di konstruktor, OK karena const object tapi property writable)
        (leftCfg.combo as any).y = comboY;
        (leftCfg.multiplier as any).y = multiplierY;
        (leftCfg.dash as any).y = dashY;

        // ===== SKOR =====
        const scoreLabelX = pad + leftCfg.score.x;
        this.scoreLabel = new TranslatedText(
            scene,
            scoreLabelX,
            pad + scoreY,
            'hud.left.score_label',
            undefined,
            {
                fontFamily: labelCfg.fontFamily,
                fontSize: leftCfg.score.labelFontSize,
                color: labelCfg.color
            }
        ).setOrigin(0, 0);

        const scoreValueX = scoreLabelX;
        const scoreValueY = pad + scoreY + scoreLabelH + leftCfg.score.gapLabelValue;
        this.scoreValue = scene.add
            .text(scoreValueX, scoreValueY, '0', {
                fontFamily: labelCfg.fontFamily,
                fontSize: leftCfg.score.valueFontSize,
                color: leftCfg.score.valueColor
            })
            .setOrigin(0, 0);

        // ===== COMBO =====
        const comboLabelX = pad + leftCfg.combo.x;
        this.comboLabel = new TranslatedText(
            scene,
            comboLabelX,
            pad + comboY,
            'hud.left.combo_label',
            undefined,
            {
                fontFamily: labelCfg.fontFamily,
                fontSize: leftCfg.combo.labelFontSize,
                color: labelCfg.color
            }
        ).setOrigin(0, 0);

        const comboValueX = comboLabelX + leftCfg.combo.valueOffsetX;
        const comboValueY = pad + comboY + comboLabelH + leftCfg.combo.gapLabelValue;
        this.comboValue = scene.add
            .text(comboValueX, comboValueY, 'x0', {
                fontFamily: labelCfg.fontFamily,
                fontSize: leftCfg.combo.valueFontSize,
                color: leftCfg.combo.valueColor
            })
            .setOrigin(0, 0);

        // Combo timer bar (di samping nilai combo)
        const comboBarX = pad + leftCfg.combo.x + leftCfg.combo.bar.offsetX;
        const comboBarY = pad + comboY + comboLabelH + leftCfg.combo.bar.offsetY;
        this.comboBarBg = scene.add.graphics();
        this.comboBarBg.fillStyle(leftCfg.combo.bar.bgColor, leftCfg.combo.bar.bgAlpha);
        this.comboBarBg.fillRoundedRect(comboBarX, comboBarY, leftCfg.combo.bar.width, leftCfg.combo.bar.height, leftCfg.combo.bar.radius);

        this.comboBarFill = scene.add.graphics();
        // Pindahkan fill graphics ke posisi bar (drawBar menggambar dari 0,0)
        this.comboBarFill.setPosition(comboBarX, comboBarY);

        // ===== PENGALI =====
        const multiplierLabelX = pad + leftCfg.multiplier.x;
        this.multiplierLabel = new TranslatedText(
            scene,
            multiplierLabelX,
            pad + multiplierY,
            'hud.left.multiplier_label',
            undefined,
            {
                fontFamily: labelCfg.fontFamily,
                fontSize: leftCfg.multiplier.labelFontSize,
                color: labelCfg.color
            }
        ).setOrigin(0, 0);

        const multiplierValueX = multiplierLabelX;
        const multiplierValueY = pad + multiplierY + multiplierLabelH + leftCfg.multiplier.gapLabelValue;
        this.multiplierValue = scene.add
            .text(multiplierValueX, multiplierValueY, 'x1.0', {
                fontFamily: labelCfg.fontFamily,
                fontSize: leftCfg.multiplier.valueFontSize,
                color: leftCfg.multiplier.valueColor
            })
            .setOrigin(0, 0);

        // ===== DASH =====
        const dashLabelX = pad + leftCfg.dash.x;
        this.dashLabel = new TranslatedText(
            scene,
            dashLabelX,
            pad + dashY,
            'hud.left.dash_label',
            undefined,
            {
                fontFamily: labelCfg.fontFamily,
                fontSize: leftCfg.dash.labelFontSize,
                color: labelCfg.color
            }
        ).setOrigin(0, 0);

        const dashStatusX = dashLabelX + leftCfg.dash.statusOffsetX;
        const dashStatusY = pad + dashY + dashLabelH + leftCfg.dash.gapLabelValue;
        this.dashStatus = new TranslatedText(
            scene,
            dashStatusX,
            dashStatusY,
            'hud.left.dash_ready',
            undefined,
            {
                fontFamily: labelCfg.fontFamily,
                fontSize: leftCfg.dash.valueFontSize,
                color: this.colorToHex(leftCfg.dash.readyColor)
            }
        ).setOrigin(0, 0);

        // Dash cooldown bar (di samping status)
        const dashBarX = pad + leftCfg.dash.x + leftCfg.dash.bar.offsetX;
        const dashBarY = pad + dashY + dashLabelH + leftCfg.dash.bar.offsetY;
        this.dashBarBg = scene.add.graphics();
        this.dashBarBg.fillStyle(leftCfg.dash.bar.bgColor, leftCfg.dash.bar.bgAlpha);
        this.dashBarBg.fillRoundedRect(dashBarX, dashBarY, leftCfg.dash.bar.width, leftCfg.dash.bar.height, leftCfg.dash.bar.radius);

        this.dashBarFill = scene.add.graphics();
        this.dashBarFill.setPosition(dashBarX, dashBarY);

        this.add([
            bg,
            this.scoreLabel,
            this.scoreValue,
            this.comboLabel,
            this.comboValue,
            this.comboBarBg,
            this.comboBarFill,
            this.multiplierLabel,
            this.multiplierValue,
            this.dashLabel,
            this.dashStatus,
            this.dashBarBg,
            this.dashBarFill
        ]);
    }

    /** Konversi warna number (0xRRGGBB) ke string hex '#RRGGBB' untuk Phaser Text. */
    private colorToHex(color: number): string
    {
        return '#' + color.toString(16).padStart(6, '0');
    }

    /** Memperbarui tampilan dari provider. Dipanggil tiap frame. */
    public update(_time: number, _delta: number): void
    {
        const leftCfg = HudConfig.left;

        // --- SKOR ---
        if (this.provider.hasScore)
        {
            this.scoreValue.setText(this.provider.score.toLocaleString());
        }

        // --- COMBO ---
        if (this.provider.hasScore)
        {
            const combo = this.provider.combo;
            this.comboValue.setText(`x${combo}`);

            // Progress bar combo timer (menyusut saat timer berjalan)
            const ratio = this.provider.comboTimerRatio;
            this.drawBar(this.comboBarFill, leftCfg.combo.bar.width, leftCfg.combo.bar.height, leftCfg.combo.bar.radius, ratio, leftCfg.combo.bar.fillColor);
        }

        // --- PENGALI ---
        if (this.provider.hasScore)
        {
            const mult = this.provider.multiplierPercent;
            // 100 -> "x1.0", 150 -> "x1.5", 200 -> "x2.0"
            this.multiplierValue.setText(`x${(mult / 100).toFixed(1)}`);
        }

        // --- DASH ---
        if (this.provider.hasPlayer)
        {
            const ready = this.provider.dashReady;
            const ratio = this.provider.dashCooldownRatio; // 0 = siap, 1 = baru dipakai

            if (ready)
            {
                this.dashStatus.setKey('hud.left.dash_ready');
                this.dashStatus.setColor(this.colorToHex(leftCfg.dash.readyColor));
            }
            else
            {
                const seconds = Math.ceil(this.provider.dashCooldownRemainingMs / 1000);
                this.dashStatus.setText(`${seconds}s`);
                this.dashStatus.setColor(this.colorToHex(leftCfg.dash.cooldownColor));
            }

            // Progress bar dash cooldown (terisi saat mendekati siap: 1 - ratio)
            const fillRatio = 1 - ratio;
            this.drawBar(this.dashBarFill, leftCfg.dash.bar.width, leftCfg.dash.bar.height, leftCfg.dash.bar.radius, fillRatio, leftCfg.dash.bar.fillColor);
        }
    }

    /** Menggambar progress bar horizontal (dipanggil pada graphics yang sudah di-position). */
    private drawBar(
        graphics: Phaser.GameObjects.Graphics,
        width: number,
        height: number,
        radius: number,
        ratio: number,
        color: number
    ): void
    {
        graphics.clear();
        if (ratio <= 0)
        {
            return;
        }
        const fillWidth = Math.max(0, width * Phaser.Math.Clamp(ratio, 0, 1));
        graphics.fillStyle(color, 1);
        graphics.fillRoundedRect(0, 0, fillWidth, height, radius);
    }
}