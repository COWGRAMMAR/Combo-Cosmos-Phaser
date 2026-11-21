import * as Phaser from 'phaser';
import { DebugConfig } from '../config/DebugConfig';
import { PowerUpConfig } from '../config/PowerUpConfig';
import { PowerUpType } from '../types/PowerUpType';
import { LanguageManager } from './LanguageManager';
import type { PowerUpItem } from './power-ups/PowerUpItem';

/** Aksi yang dipanggil oleh tombol debug. */
export interface DebugActions
{
    toggleOverlay: () => void;
    stress: (count: number) => void;
    cycleLanes: () => void;
    powerUp: (kind: PowerUpType) => void;
    toggleLanguage: () => void;
    resetEnemyTest: () => void;
}

/** Jendela browser dengan hook console khusus debug; properti dihapus saat alat debug mati. */
interface DebugWindow extends Window
{
    __language?: LanguageManager;
}

/** Opsi tombol debug yang berasal dari config. */
export interface DebugOptions
{
    /** Nama key Phaser untuk reset skenario; undefined membuat tombol tidak didaftarkan. */
    resetKey?: string;
}

/**
 * Tombol debug yang sengaja di-hardcode, terpisah dari InputAction.
 * File ini adalah pintu masuk untuk sistem debug yang lebih lengkap nanti.
 */
export class DebugTools
{
    private readonly scene: Phaser.Scene;
    private readonly actions: DebugActions;
    private readonly toggleKey: Phaser.Input.Keyboard.Key;
    private readonly stress1000Key: Phaser.Input.Keyboard.Key;
    private readonly stress3000Key: Phaser.Input.Keyboard.Key;
    private readonly lanesKey: Phaser.Input.Keyboard.Key;
    private readonly powerUpKeys: Phaser.Input.Keyboard.Key[];
    private readonly resetKey?: Phaser.Input.Keyboard.Key;

    /** Tombol bahasa dari config; dibandingkan langsung dengan `event.key`. */
    private readonly languageKey: string;

    /** Referensi window yang sama dengan tempat listener dipasang, dipakai saat destroy. */
    private readonly debugWindow: DebugWindow;

    /** Menangkap tombol bahasa di level window agar tetap berfungsi saat scene Game di-pause. */
    private readonly handleWindowKeyDown = (event: KeyboardEvent): void =>
    {
        if (event.repeat || event.key !== this.languageKey)
        {
            return;
        }

        this.actions.toggleLanguage();
    };

    /** Layer gambar prediksi jalur item power-up; berdiri sendiri dari sistem item. */
    private readonly pathGraphics: Phaser.GameObjects.Graphics;

    /** Mendaftarkan tombol debug; melempar error kalau keyboard tidak tersedia. */
    constructor(scene: Phaser.Scene, actions: DebugActions, options?: DebugOptions)
    {
        const keyboard = scene.input.keyboard;

        if (!keyboard)
        {
            throw new Error('Keyboard tidak tersedia untuk DebugTools');
        }

        this.scene = scene;
        this.actions = actions;
        this.toggleKey = keyboard.addKey(DebugConfig.keys.overlay);
        this.stress1000Key = keyboard.addKey(DebugConfig.keys.stressLight);
        this.stress3000Key = keyboard.addKey(DebugConfig.keys.stressHeavy);
        this.lanesKey = keyboard.addKey(DebugConfig.keys.cycleLanes);
        // Urutan power-up mengikuti DebugConfig.keys.powerUps agar tombol dan jenis tetap sinkron.
        this.powerUpKeys = DebugConfig.keys.powerUps.map((entry) => keyboard.addKey(entry.key));
        this.resetKey = options?.resetKey ? keyboard.addKey(options.resetKey) : undefined;

        this.languageKey = DebugConfig.keys.toggleLanguage;
        this.debugWindow = window as DebugWindow;
        this.debugWindow.__language = LanguageManager.getInstance();
        this.debugWindow.addEventListener('keydown', this.handleWindowKeyDown);

        this.pathGraphics = scene.add.graphics();
        this.pathGraphics.setDepth(PowerUpConfig.render.itemDepth + DebugConfig.graphics.depthOffset);
    }

    /** Memeriksa tombol debug sekali per frame. */
    public update(): void
    {
        if (Phaser.Input.Keyboard.JustDown(this.toggleKey))
        {
            // F1: tampilkan/sembunyikan overlay statistik (FPS, isi pool peluru, status buff).
            this.actions.toggleOverlay();
        }

        if (Phaser.Input.Keyboard.JustDown(this.stress1000Key))
        {
            // F2: hujan 1000 peluru musuh dari atas layar untuk uji baseline performa.
            this.actions.stress(DebugConfig.stress.light);
        }

        if (Phaser.Input.Keyboard.JustDown(this.stress3000Key))
        {
            // F3: hujan 3000 peluru musuh untuk menguji batas pool dan penurunan FPS.
            this.actions.stress(DebugConfig.stress.heavy);
        }

        if (Phaser.Input.Keyboard.JustDown(this.lanesKey))
        {
            // F4: putar jumlah jalur tembak pemain 1 → 2 → ... → maxLanes → 1.
            this.actions.cycleLanes();
        }

        for (let i = 0; i < this.powerUpKeys.length; i++)
        {
            if (Phaser.Input.Keyboard.JustDown(this.powerUpKeys[i]))
            {
                // Z..N: aktifkan satu power-up langsung sesuai urutan DebugConfig.keys.powerUps.
                this.actions.powerUp(DebugConfig.keys.powerUps[i].type);
            }
        }

        if (this.resetKey && Phaser.Input.Keyboard.JustDown(this.resetKey))
        {
            this.actions.resetEnemyTest();
        }
    }

    /**
     * Menggambar visual debug item power-up: kotak zona spawn, ring jarak spawn player,
     * prediksi jalur tiap item, dan garis arah untuk pola straight.
     * Hanya membaca data item/zona; sistem item tidak bergantung pada file ini.
     * Saat debug dimatikan, layer gambar langsung dikosongkan.
     */
    public renderPowerUpPaths (
        items: ReadonlyArray<PowerUpItem>,
        enabled: boolean,
        zone: { x: number; y: number; width: number; height: number } | null,
        playerPos: { x: number; y: number }
    ): void
    {
        this.pathGraphics.clear();

        if (!enabled)
        {
            return;
        }

        this.renderSpawnZone(zone);
        this.renderPlayerSpawnRing(playerPos);
        this.renderItemPaths(items);
    }

    /** Gambar kotak zona spawn beserta titik pusatnya. */
    private renderSpawnZone (zone: { x: number; y: number; width: number; height: number } | null): void
    {
        if (!zone)
        {
            return;
        }

        this.pathGraphics.lineStyle(
            DebugConfig.graphics.lineWidth,
            DebugConfig.graphics.spawnZone.color,
            DebugConfig.graphics.spawnZone.alpha
        );
        this.pathGraphics.strokeRect(
            zone.x - zone.width / 2,
            zone.y - zone.height / 2,
            zone.width,
            zone.height
        );

        this.pathGraphics.fillStyle(
            DebugConfig.graphics.spawnZone.color,
            DebugConfig.graphics.spawnZone.alpha
        );
        this.pathGraphics.fillCircle(zone.x, zone.y, DebugConfig.graphics.spawnZone.centerRadius);
    }

    /** Gambar ring jarak minimum spawn di sekitar posisi player. */
    private renderPlayerSpawnRing (playerPos: { x: number; y: number }): void
    {
        this.pathGraphics.lineStyle(
            DebugConfig.graphics.lineWidth,
            DebugConfig.graphics.playerRing.color,
            DebugConfig.graphics.playerRing.alpha
        );
        this.pathGraphics.strokeCircle(
            playerPos.x,
            playerPos.y,
            PowerUpConfig.spawn.minPlayerSpawnDistance
        );
    }

    /** Gambar titik prediksi lintasan tiap item lalu garis arahnya bila straight. */
    private renderItemPaths (items: ReadonlyArray<PowerUpItem>): void
    {
        const durationMs = DebugConfig.graphics.path.durationMs;
        const stepMs = DebugConfig.graphics.path.stepMs;

        for (const item of items)
        {
            // Warna titik mengikuti warna isi item agar jalur tiap jenis mudah dibedakan.
            this.pathGraphics.fillStyle(item.fillColor, DebugConfig.graphics.path.alpha);

            for (let ageMs = 0; ageMs <= durationMs; ageMs += stepMs)
            {
                const position = item.predict(ageMs);
                this.pathGraphics.fillCircle(
                    position.x,
                    position.y,
                    DebugConfig.graphics.path.dotRadius
                );
            }

            this.renderStraightDirection(item);
        }
    }

    /** Garis pendek dari posisi item mengikuti sudut diagonal pola straight. */
    private renderStraightDirection (item: PowerUpItem): void
    {
        // Pola sine/infinity tidak punya sudut arah, jadi tidak digambar.
        if (item.getMovementId() !== 'straight')
        {
            return;
        }

        const rad = Phaser.Math.DegToRad(item.getDirectionAngleDeg());
        const length = DebugConfig.graphics.direction.length;

        this.pathGraphics.lineStyle(
            DebugConfig.graphics.lineWidth,
            item.fillColor,
            DebugConfig.graphics.direction.alpha
        );
        this.pathGraphics.lineBetween(
            item.x,
            item.y,
            item.x + Math.sin(rad) * length,
            item.y + Math.cos(rad) * length
        );
    }

    /** Melepas seluruh tombol debug dari keyboard dan menghapus hook console. */
    public destroy(): void
    {
        this.debugWindow.removeEventListener('keydown', this.handleWindowKeyDown);
        delete this.debugWindow.__language;

        this.pathGraphics.destroy();

        const keyboard = this.scene.input.keyboard;

        if (!keyboard)
        {
            return;
        }

        keyboard.removeKey(this.toggleKey);
        keyboard.removeKey(this.stress1000Key);
        keyboard.removeKey(this.stress3000Key);
        keyboard.removeKey(this.lanesKey);

        for (let i = 0; i < this.powerUpKeys.length; i++)
        {
            keyboard.removeKey(this.powerUpKeys[i]);
        }

        if (this.resetKey)
        {
            keyboard.removeKey(this.resetKey);
        }
    }
}
