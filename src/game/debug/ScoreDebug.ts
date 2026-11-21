import * as Phaser from 'phaser';
import { ScoreSystem } from '../systems/ScoreSystem';
import { EnemyTier } from '../config/ComboScoreConfig';

/** Aksi debug untuk sistem skor. */
export interface ScoreDebugActions
{
    /** Simulasikan kill common/elite/boss dengan source bullet. */
    simulateKill: (tier: EnemyTier) => void;
    /** Simulasikan kill laser. */
    simulateKillLaser: () => void;
    /** Simulasikan kill ram. */
    simulateKillRam: () => void;
    /** Simulasikan graze. */
    simulateGraze: () => void;
    /** Simulasikan player kena hit. */
    simulateHit: () => void;
    /** Simulasikan batch nuke dengan N kill common. */
    simulateNukeBatch: (count: number) => void;
    /** Reset sistem skor. */
    resetScore: () => void;
}

/** Opsi keybind debug skor. */
export interface ScoreDebugOptions
{
    /** Key untuk toggle overlay debug skor. */
    toggleKey?: string;
    /** Key untuk simulasikan kill common. */
    killCommonKey?: string;
    /** Key untuk simulasikan kill elite. */
    killEliteKey?: string;
    /** Key untuk simulasikan kill boss. */
    killBossKey?: string;
    /** Key untuk simulasikan kill laser. */
    killLaserKey?: string;
    /** Key untuk simulasikan kill ram. */
    killRamKey?: string;
    /** Key untuk simulasikan graze. */
    grazeKey?: string;
    /** Key untuk simulasikan player hit. */
    hitKey?: string;
    /** Key untuk simulasikan batch nuke 10. */
    nuke10Key?: string;
    /** Key untuk simulasikan batch nuke 60. */
    nuke60Key?: string;
    /** Key untuk reset skor. */
    resetKey?: string;
}

/**
 * Debug overlay untuk sistem skor.
 * Debug boleh menempel ke sistem skor, tapi sistem skor tidak tahu soal debug.
 */
export class ScoreDebug
{
    private readonly scene: Phaser.Scene;
    private readonly scoreSystem: ScoreSystem;
    private readonly options: Required<ScoreDebugOptions>;

    private readonly graphics: Phaser.GameObjects.Graphics;
    private readonly text: Phaser.GameObjects.Text;
    private visible: boolean = false;

    private readonly toggleKey: Phaser.Input.Keyboard.Key;
    private readonly killCommonKey: Phaser.Input.Keyboard.Key;
    private readonly killEliteKey: Phaser.Input.Keyboard.Key;
    private readonly killBossKey: Phaser.Input.Keyboard.Key;
    private readonly killLaserKey: Phaser.Input.Keyboard.Key;
    private readonly killRamKey: Phaser.Input.Keyboard.Key;
    private readonly grazeKey: Phaser.Input.Keyboard.Key;
    private readonly hitKey: Phaser.Input.Keyboard.Key;
    private readonly nuke10Key: Phaser.Input.Keyboard.Key;
    private readonly nuke60Key: Phaser.Input.Keyboard.Key;
    private readonly resetKey: Phaser.Input.Keyboard.Key;

    constructor(scene: Phaser.Scene, scoreSystem: ScoreSystem, options: ScoreDebugOptions = {})
    {
        this.scene = scene;
        this.scoreSystem = scoreSystem;

        // Default keybinds (disesuaikan dengan DebugConfig nanti kalau perlu)
        this.options = {
            toggleKey: options.toggleKey ?? 'F5',
            killCommonKey: options.killCommonKey ?? 'Q',
            killEliteKey: options.killEliteKey ?? 'W',
            killBossKey: options.killBossKey ?? 'E',
            killLaserKey: options.killLaserKey ?? 'R',
            killRamKey: options.killRamKey ?? 'T',
            grazeKey: options.grazeKey ?? 'Y',
            hitKey: options.hitKey ?? 'U',
            nuke10Key: options.nuke10Key ?? 'I',
            nuke60Key: options.nuke60Key ?? 'O',
            resetKey: options.resetKey ?? 'P'
        };

        const keyboard = scene.input.keyboard;
        if (!keyboard)
        {
            throw new Error('Keyboard tidak tersedia untuk ScoreDebug');
        }

        this.toggleKey = keyboard.addKey(this.options.toggleKey);
        this.killCommonKey = keyboard.addKey(this.options.killCommonKey);
        this.killEliteKey = keyboard.addKey(this.options.killEliteKey);
        this.killBossKey = keyboard.addKey(this.options.killBossKey);
        this.killLaserKey = keyboard.addKey(this.options.killLaserKey);
        this.killRamKey = keyboard.addKey(this.options.killRamKey);
        this.grazeKey = keyboard.addKey(this.options.grazeKey);
        this.hitKey = keyboard.addKey(this.options.hitKey);
        this.nuke10Key = keyboard.addKey(this.options.nuke10Key);
        this.nuke60Key = keyboard.addKey(this.options.nuke60Key);
        this.resetKey = keyboard.addKey(this.options.resetKey);

        // Graphics untuk background overlay
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(1000);
        this.graphics.setVisible(false);

        // Text overlay
        this.text = scene.add.text(16, 16, '', {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#ffffff',
            lineSpacing: 4
        });
        this.text.setDepth(1001);
        this.text.setVisible(false);
        this.text.setScrollFactor(0);

        this.updateText();
    }

    /** Update per frame: cek input dan refresh text. */
    public update(): void
    {
        if (Phaser.Input.Keyboard.JustDown(this.toggleKey))
        {
            this.visible = !this.visible;
            this.graphics.setVisible(this.visible);
            this.text.setVisible(this.visible);
        }

        if (!this.visible)
        {
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.killCommonKey))
        {
            this.scoreSystem.registerKill('common', 'bullet');
        }
        if (Phaser.Input.Keyboard.JustDown(this.killEliteKey))
        {
            this.scoreSystem.registerKill('elite', 'bullet');
        }
        if (Phaser.Input.Keyboard.JustDown(this.killBossKey))
        {
            this.scoreSystem.registerKill('boss', 'bullet');
        }
        if (Phaser.Input.Keyboard.JustDown(this.killLaserKey))
        {
            this.scoreSystem.registerKill('common', 'laser');
        }
        if (Phaser.Input.Keyboard.JustDown(this.killRamKey))
        {
            this.scoreSystem.registerKill('common', 'ram');
        }
        if (Phaser.Input.Keyboard.JustDown(this.grazeKey))
        {
            this.scoreSystem.addGraze();
        }
        if (Phaser.Input.Keyboard.JustDown(this.hitKey))
        {
            this.scoreSystem.onPlayerHit();
        }
        if (Phaser.Input.Keyboard.JustDown(this.nuke10Key))
        {
            this.scoreSystem.beginBatch();
            for (let i = 0; i < 10; i++)
            {
                this.scoreSystem.registerKill('common', 'nuke');
            }
            this.scoreSystem.endBatch();
        }
        if (Phaser.Input.Keyboard.JustDown(this.nuke60Key))
        {
            this.scoreSystem.beginBatch();
            for (let i = 0; i < 60; i++)
            {
                this.scoreSystem.registerKill('common', 'nuke');
            }
            this.scoreSystem.endBatch();
        }
        if (Phaser.Input.Keyboard.JustDown(this.resetKey))
        {
            this.scoreSystem.reset();
        }

        this.updateText();
    }

    /** Update teks overlay dengan state terkini. */
    private updateText(): void
    {
        const s = this.scoreSystem;
        const timerSec = (s.comboTimerRatio * 2).toFixed(1); // timerMs default 2000
        this.text.setText([
            `=== SCORE DEBUG ===`,
            `Score: ${s.score}`,
            `Combo: ${s.combo} (x${(s.multiplier / 100).toFixed(1)})`,
            `Timer: ${timerSec}s`,
            `Batch: ${s.isBatchActive ? 'ACTIVE' : 'off'}`,
            `---`,
            `${this.options.toggleKey}: Toggle`,
            `${this.options.killCommonKey}: Kill Common`,
            `${this.options.killEliteKey}: Kill Elite`,
            `${this.options.killBossKey}: Kill Boss`,
            `${this.options.killLaserKey}: Kill Laser`,
            `${this.options.killRamKey}: Kill Ram`,
            `${this.options.grazeKey}: Graze`,
            `${this.options.hitKey}: Player Hit`,
            `${this.options.nuke10Key}: Nuke x10`,
            `${this.options.nuke60Key}: Nuke x60`,
            `${this.options.resetKey}: Reset`
        ].join('\n'));

        // Update background graphics
        this.graphics.clear();
        if (this.visible)
        {
            const bounds = this.text.getBounds();
            this.graphics.fillStyle(0x000000, 0.7);
            this.graphics.fillRoundedRect(
                bounds.x - 8,
                bounds.y - 8,
                bounds.width + 16,
                bounds.height + 16,
                6
            );
        }
    }

    /** Destroy debug overlay. */
    public destroy(): void
    {
        const keyboard = this.scene.input.keyboard;
        if (keyboard)
        {
            keyboard.removeKey(this.toggleKey);
            keyboard.removeKey(this.killCommonKey);
            keyboard.removeKey(this.killEliteKey);
            keyboard.removeKey(this.killBossKey);
            keyboard.removeKey(this.killLaserKey);
            keyboard.removeKey(this.killRamKey);
            keyboard.removeKey(this.grazeKey);
            keyboard.removeKey(this.hitKey);
            keyboard.removeKey(this.nuke10Key);
            keyboard.removeKey(this.nuke60Key);
            keyboard.removeKey(this.resetKey);
        }

        this.graphics.destroy();
        this.text.destroy();
    }
}