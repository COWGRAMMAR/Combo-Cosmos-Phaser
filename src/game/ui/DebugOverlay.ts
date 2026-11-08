import * as Phaser from 'phaser';
import { DepthConfig } from '../config/DepthConfig';
import { WorldConfig } from '../config/WorldConfig';

/** Angka yang ditampilkan overlay debug; diisi ulang tiap frame oleh scene. */
export interface DebugStats
{
    fps: number;
    frameTimeMs: number;
    playerBulletsActive: number;
    playerBulletsMax: number;
    playerBulletsOverflow: number;
    enemyBulletsActive: number;
    enemyBulletsMax: number;
    enemyBulletsOverflow: number;
    enemyBulletsTotalCreated: number;
    enemyBulletsCreatedThisFrame: number;
    enemyBulletsSpawnMs: number;
    playerHits: number;
    lanes: number;
    lives: number;
    invulnerable: boolean;
    shieldActive: boolean;
    fireRateActive: boolean;
    laserActive: boolean;
    dashReady: boolean;
}

/**
 * Overlay teks untuk memantau performa bullet dan jumlah pool.
 * Sengaja hanya membuat string saat overlay terlihat agar tidak membebani
 * gameplay normal.
 */
export class DebugOverlay
{
    private readonly text: Phaser.GameObjects.Text;
    private visible: boolean = WorldConfig.debug.enabled;

    /** Membuat teks overlay yang menempel di kamera. */
    constructor(scene: Phaser.Scene)
    {
        this.text = scene.add.text(12, 12, '', {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { left: 8, right: 8, top: 6, bottom: 6 }
        });

        this.text.setScrollFactor(0).setDepth(DepthConfig.worldUi);
        this.text.setVisible(this.visible);
    }

    /** Status tampil atau tidaknya overlay. */
    get isVisible(): boolean
    {
        return this.visible;
    }

    /** Menampilkan atau menyembunyikan overlay. */
    public toggle(): void
    {
        this.visible = !this.visible;
        this.text.setVisible(this.visible);
    }

    /** Memperbarui isi overlay; tidak melakukan apa pun saat disembunyikan. */
    public update(stats: DebugStats): void
    {
        if (!this.visible)
        {
            return;
        }

        const status = this.buildStatus(stats);

        this.text.setText(
            `FPS ${stats.fps.toFixed(0)} | frame ${stats.frameTimeMs.toFixed(1)} ms | lanes ${stats.lanes}\n` +
            `peluru pemain: ${stats.playerBulletsActive} aktif / max ${stats.playerBulletsMax} / overflow ${stats.playerBulletsOverflow}\n` +
            `peluru musuh : ${stats.enemyBulletsActive} aktif / max ${stats.enemyBulletsMax} / overflow ${stats.enemyBulletsOverflow}\n` +
            `total dibuat : ${stats.enemyBulletsTotalCreated} / frame ${stats.enemyBulletsCreatedThisFrame} / spawn ${stats.enemyBulletsSpawnMs.toFixed(2)} ms\n` +
            `pemain kena : ${stats.playerHits} | nyawa ${stats.lives} | ${status}`
        );
    }

    /** Menghapus objek teks dari scene. */
    public destroy(): void
    {
        this.text.destroy();
    }

    /** Merangkai status efek yang sedang aktif dalam satu baris. */
    private buildStatus(stats: DebugStats): string
    {
        let status = stats.dashReady ? 'dash siap' : 'dash cooldown';

        if (stats.invulnerable)
        {
            status += ' | kebal';
        }

        if (stats.shieldActive)
        {
            status += ' | shield';
        }

        if (stats.fireRateActive)
        {
            status += ' | atk+';
        }

        if (stats.laserActive)
        {
            status += ' | laser';
        }

        return status;
    }
}
