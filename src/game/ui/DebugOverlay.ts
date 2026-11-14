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
    playerHits: number;
    lanes: number;
    lives: number;
    gruntsActive: number;
    gruntScenario: string;
    invulnerable: boolean;
    shieldActive: boolean;
    fireRateActive: boolean;
    laserActive: boolean;
    dashReady: boolean;
}

/**
 * Overlay teks untuk memantau performa bullet dan jumlah pool.
 * Dibuat sebagai elemen DOM (position: fixed) supaya tidak ikut ter-zoom
 * atau ter-clip oleh kamera gameplay; posisinya ditempel ke sudut kiri atas
 * play area lewat setPosition().
 * String hanya dirakit saat overlay terlihat agar tidak membebani gameplay.
 */
export class DebugOverlay
{
    private readonly element: HTMLDivElement;
    private visible: boolean = WorldConfig.debug.enabled;

    /** Membuat elemen overlay yang menempel di sudut kiri atas layar. */
    constructor()
    {
        this.element = document.createElement('div');
        this.element.style.cssText =
            'position:fixed;top:12px;left:12px;z-index:9999;' +
            'font-family:monospace;font-size:14px;line-height:1.4;' +
            'color:#ffffff;background:rgba(0,0,0,0.65);padding:6px 8px;' +
            'white-space:pre;pointer-events:none;';
        this.element.style.display = this.visible ? 'block' : 'none';
        document.body.appendChild(this.element);
    }

    /** Menempelkan overlay ke koordinat layar (piksel viewport). */
    public setPosition(x: number, y: number): void
    {
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
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
        this.element.style.display = this.visible ? 'block' : 'none';
    }

    /** Memperbarui isi overlay; tidak melakukan apa pun saat disembunyikan. */
    public update(stats: DebugStats): void
    {
        if (!this.visible)
        {
            return;
        }

        const status = this.buildStatus(stats);

        this.element.textContent =
            `FPS ${stats.fps.toFixed(0)} | frame ${stats.frameTimeMs.toFixed(1)} ms | lanes ${stats.lanes}\n` +
            `peluru pemain: ${stats.playerBulletsActive} aktif / max ${stats.playerBulletsMax} / overflow ${stats.playerBulletsOverflow}\n` +
            `peluru musuh : ${stats.enemyBulletsActive} aktif / max ${stats.enemyBulletsMax} / overflow ${stats.enemyBulletsOverflow}\n` +
            `grunt        : ${stats.gruntsActive} aktif | skenario ${stats.gruntScenario}\n` +
            `pemain kena : ${stats.playerHits} | nyawa ${stats.lives} | ${status}`;
    }

    /** Menghapus elemen overlay dari DOM. */
    public destroy(): void
    {
        this.element.remove();
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
