import * as Phaser from 'phaser';
import { AssetKeys } from '../config/AssetKeys';
import { DepthConfig } from '../config/DepthConfig';
import { EnemyConfig } from '../config/EnemyConfig';
import { GameEvents } from '../config/GameEvents';
import { PlayerConfig } from '../config/PlayerConfig';
import { ScreenConfig } from '../config/ScreenConfig';
import { TimeConfig } from '../config/TimeConfig';
import { WorldConfig } from '../config/WorldConfig';
import { PlayerBullet } from '../entities/bullet/PlayerBullet';
import { Shockwave } from '../entities/effects/Shockwave';
import { DummyEnemy } from '../entities/enemy/DummyEnemy';
import { Player } from '../entities/player/Player';
import { PlayerLaser } from '../entities/player/PlayerLaser';
import { PlayerWeapon } from '../entities/player/PlayerWeapon';
import { DebugTools } from '../systems/DebugTools';
import { EffectManager } from '../systems/EffectManager';
import { EnemyBulletManager } from '../systems/EnemyBulletManager';
import { InputManager } from '../systems/InputManager';
import { PauseManager } from '../systems/PauseManager';
import { PowerUpManager } from '../systems/PowerUpManager';
import type { PowerUpType } from '../systems/PowerUpManager';
import { EffectType } from '../types/EffectType';
import { Team } from '../types/Team';
import { DebugOverlay } from '../ui/DebugOverlay';
import type { DebugStats } from '../ui/DebugOverlay';

/**
 * Scene utama permainan.
 * Scene ini hanya merakit pool, manager, dan collision; logika tiap sistem
 * tetap berada di file masing-masing.
 */
export class Game extends Phaser.Scene
{
    private inputManager?: InputManager;
    private player?: Player;
    private weapon?: PlayerWeapon;
    private dummy?: DummyEnemy;
    private enemies?: Phaser.GameObjects.Group;
    private enemyBullets?: EnemyBulletManager;
    private effects?: EffectManager;
    private powerUps?: PowerUpManager;
    private shockwave?: Shockwave;
    private laser?: PlayerLaser;
    private overlay?: DebugOverlay;
    private debugTools?: DebugTools;
    private pauseManager?: PauseManager;
    private respawnEvent?: Phaser.Time.TimerEvent;
    private playerBulletMax: number = 0;
    private gameOverPending: boolean = false;

    // Objek statistik dipakai ulang tiap frame agar tidak ada alokasi di update().
    private readonly stats: DebugStats = {
        fps: 0,
        frameTimeMs: 0,
        playerBulletsActive: 0,
        playerBulletsMax: 0,
        playerBulletsOverflow: 0,
        enemyBulletsActive: 0,
        enemyBulletsMax: 0,
        enemyBulletsOverflow: 0,
        playerHits: 0,
        lanes: 0,
        lives: 0,
        invulnerable: false,
        shieldActive: false,
        fireRateActive: false,
        laserActive: false,
        dashReady: true
    };

    /** Callback overlap peluru pemain dengan musuh; dibuat sekali, bukan per frame. */
    private readonly handlePlayerBulletHitsEnemy: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (bulletObject, enemyObject) =>
    {
        const bullet = bulletObject as Phaser.GameObjects.GameObject & Partial<PlayerBullet>;
        const enemy = enemyObject as DummyEnemy;

        if (!(bullet instanceof PlayerBullet) || typeof bullet.deactivate !== 'function')
        {
            return;
        }

        if (!bullet.active || !enemy.active)
        {
            return;
        }

        bullet.deactivate();
        enemy.takeDamage(bullet.damage);

        if (!enemy.active)
        {
            this.scheduleDummyRespawn();
        }
    };

    /** Shield pecah saat pemain menabrak musuh; tanpa shield, tabrakan diabaikan. */
    private readonly handlePlayerTouchesEnemy: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = () =>
    {
        if (this.effects?.isActive(EffectType.Shield))
        {
            this.effects.stop(EffectType.Shield);
        }
    };

    /** Reaksi saat peluru musuh mengenai pemain. */
    private readonly handlePlayerHit = (): void =>
    {
        const player = this.player;

        if (!player || this.gameOverPending)
        {
            return;
        }

        const died = player.applyHit();

        if (died)
        {
            this.gameOverPending = true;

            this.events.emit(GameEvents.PLAYER_DIED);
            this.events.emit(GameEvents.GAME_OVER);

            this.time.delayedCall(WorldConfig.gameOverDelayMs, () =>
            {
                this.scene.start('GameOver');
            });

            return;
        }

        this.events.emit(GameEvents.PLAYER_DAMAGED, player.lives);
        this.shockwave?.start(player.x, player.y);
    };

    /** Setelah bom, dummy yang mati dijadwalkan hidup lagi untuk pengujian. */
    private readonly handleBombUsed = (): void =>
    {
        if (this.dummy && !this.dummy.active)
        {
            this.scheduleDummyRespawn();
        }
    };

    /** Mendaftarkan scene Game. */
    constructor ()
    {
        super('Game');
    }

    /** Merakit pemain, pool peluru, musuh dummy, efek, power-up, dan alat debug. */
    create (): void
    {
        const playArea = ScreenConfig.playArea;
        const spawn = ScreenConfig.spawn;
        const camera = this.cameras.main;

        camera.setViewport(playArea.x, playArea.y, playArea.width, playArea.height);
        camera.setBounds(0, 0, playArea.width, playArea.height);
        camera.setBackgroundColor(WorldConfig.background.color);
        this.physics.world.setBounds(0, 0, playArea.width, playArea.height);

        // TEMP: garis bantu batas play area; hapus setelah verifikasi fase ini.
        this.add.rectangle(0, 0, playArea.width, playArea.height)
            .setOrigin(0)
            .setStrokeStyle(
                WorldConfig.playAreaFrame.thickness,
                WorldConfig.playAreaFrame.color,
                WorldConfig.playAreaFrame.alpha
            )
            .setDepth(DepthConfig.background);

        this.inputManager?.destroy();
        this.inputManager = new InputManager(this);

        this.weapon = new PlayerWeapon(this);

        this.player = new Player(this, spawn.playerX, spawn.playerY, AssetKeys.Player, {
            team: Team.Player,
            maxHp: PlayerConfig.maxHp,
            moveSpeed: PlayerConfig.moveSpeed,
            bodyRadius: PlayerConfig.bodyRadius
        }, this.inputManager, this.weapon);

        this.dummy = new DummyEnemy(this, spawn.enemyX, spawn.enemyY, AssetKeys.Enemy);
        this.enemies = this.add.group();
        this.enemies.add(this.dummy);

        this.enemyBullets = new EnemyBulletManager(this, this.player, () =>
        {
            this.events.emit(GameEvents.PLAYER_HIT);
        });

        this.laser = new PlayerLaser(this, this.player, this.enemies);

        this.effects = new EffectManager({
            onStart: (type: EffectType) => this.handleEffectStart(type),
            onEnd: (type: EffectType) => this.handleEffectEnd(type)
        });

        this.powerUps = new PowerUpManager(
            this,
            this.player,
            this.weapon,
            this.effects,
            this.enemyBullets,
            this.enemies
        );

        this.shockwave = new Shockwave(this, this.enemyBullets);

        this.physics.add.overlap(
            this.weapon.bulletGroup,
            this.enemies,
            this.handlePlayerBulletHitsEnemy,
            undefined,
            this
        );

        this.physics.add.overlap(
            this.player,
            this.enemies,
            this.handlePlayerTouchesEnemy,
            undefined,
            this
        );

        this.events.off(GameEvents.PLAYER_HIT, this.handlePlayerHit);
        this.events.on(GameEvents.PLAYER_HIT, this.handlePlayerHit);

        this.events.off(GameEvents.BOMB_USED, this.handleBombUsed);
        this.events.on(GameEvents.BOMB_USED, this.handleBombUsed);

        this.overlay = new DebugOverlay(this);
        this.debugTools = new DebugTools(this, {
            toggleOverlay: () => this.overlay?.toggle(),
            stress: (count: number) => this.spawnStressBullets(count),
            cycleLanes: () => this.weapon?.cycleLanes(),
            powerUp: (kind: PowerUpType) => this.powerUps?.apply(kind)
        });

        this.pauseManager = new PauseManager(this);
        this.scene.launch('Hud');

        this.playerBulletMax = 0;
        this.gameOverPending = false;

        this.events.once('shutdown', this.handleShutdown, this);
    }

    /** Menjalankan seluruh sistem per frame. */
    update (_time: number, delta: number): void
    {
        const safeDelta = Math.min(delta, TimeConfig.maxDeltaMs);

        this.enemyBullets?.update(safeDelta);
        this.effects?.update(safeDelta);
        this.shockwave?.update(safeDelta);
        this.laser?.update(safeDelta);

        this.updateStats(safeDelta);

        this.debugTools?.update();
        this.overlay?.update(this.stats);
    }

    /** Mengosongkan seluruh pool dan mengembalikan state ke awal run. */
    public resetRun (): void
    {
        this.effects?.reset();
        this.weapon?.reset();
        this.weapon?.clearAll();
        this.enemyBullets?.reset();
        this.shockwave?.stop();
        this.laser?.reset();

        this.respawnEvent?.remove(false);
        this.respawnEvent = undefined;

        this.playerBulletMax = 0;
        this.gameOverPending = false;

        this.dummy?.respawn(ScreenConfig.spawn.enemyX, ScreenConfig.spawn.enemyY);
        this.player?.resetForPool(ScreenConfig.spawn.playerX, ScreenConfig.spawn.playerY);
    }

    /** Menerapkan efek samping saat sebuah efek durasi mulai. */
    private handleEffectStart (type: EffectType): void
    {
        switch (type)
        {
            case EffectType.FireRate:
                this.weapon?.setCooldownMultiplier(PlayerConfig.atkSpeed.cooldownMultiplier);
                break;
            case EffectType.Shield:
                this.player?.setShield(true);
                break;
            case EffectType.Laser:
                this.laser?.activate();
                break;
        }
    }

    /** Membersihkan efek samping saat sebuah efek durasi berakhir. */
    private handleEffectEnd (type: EffectType): void
    {
        switch (type)
        {
            case EffectType.FireRate:
                this.weapon?.setCooldownMultiplier(1);
                break;
            case EffectType.Shield:
                this.player?.setShield(false);
                break;
            case EffectType.Laser:
                this.laser?.deactivate();
                break;
        }
    }

    /** Mengumpulkan angka debug tanpa membuat objek baru. */
    private updateStats (delta: number): void
    {
        const weapon = this.weapon;
        const enemyBullets = this.enemyBullets;
        const player = this.player;

        if (!weapon || !enemyBullets || !player)
        {
            return;
        }

        const playerBulletsActive = weapon.bulletGroup.countActive(true);

        if (playerBulletsActive > this.playerBulletMax)
        {
            this.playerBulletMax = playerBulletsActive;
        }

        const stats = this.stats;

        stats.fps = this.game.loop.actualFps;
        stats.frameTimeMs = delta;
        stats.playerBulletsActive = playerBulletsActive;
        stats.playerBulletsMax = this.playerBulletMax;
        stats.playerBulletsOverflow = weapon.overflowCount;
        stats.enemyBulletsActive = enemyBullets.activeCount;
        stats.enemyBulletsMax = enemyBullets.maxActive;
        stats.enemyBulletsOverflow = enemyBullets.overflowCount;
        stats.playerHits = enemyBullets.playerHitCount;
        stats.lanes = weapon.laneCount;
        stats.lives = player.lives;
        stats.invulnerable = player.isInvulnerable();
        stats.shieldActive = player.isShieldActive;
        stats.fireRateActive = this.effects?.isActive(EffectType.FireRate) ?? false;
        stats.laserActive = this.effects?.isActive(EffectType.Laser) ?? false;
        stats.dashReady = player.isDashReady();
    }

    /** Menembakkan sejumlah peluru musuh dari atas layar untuk stress test. */
    private spawnStressBullets (count: number): void
    {
        const margin = EnemyConfig.bullet.offScreenMargin;
        const speed = EnemyConfig.bullet.speed;
        const maxX = ScreenConfig.playArea.width - margin;

        for (let i = 0; i < count; i++)
        {
            const x = Phaser.Math.Between(margin, maxX);

            this.enemyBullets?.spawn(x, -margin, 0, speed);
        }
    }

    /** Menghidupkan lagi dummy setelah jeda supaya pengujian bisa diulang. */
    private scheduleDummyRespawn (): void
    {
        if (this.respawnEvent)
        {
            return;
        }

        this.respawnEvent = this.time.delayedCall(EnemyConfig.respawnDelayMs, () =>
        {
            this.respawnEvent = undefined;
            this.dummy?.respawn(ScreenConfig.spawn.enemyX, ScreenConfig.spawn.enemyY);
        });
    }

    /** Melepas input, debug, efek, dan listener saat scene berhenti. */
    private handleShutdown (): void
    {
        this.pauseManager?.destroy();
        this.pauseManager = undefined;

        if (this.scene.isActive('Hud'))
        {
            this.scene.stop('Hud');
        }

        if (this.scene.isActive('Pause'))
        {
            this.scene.stop('Pause');
        }

        this.inputManager?.destroy();
        this.inputManager = undefined;

        this.debugTools?.destroy();
        this.debugTools = undefined;

        this.overlay?.destroy();
        this.overlay = undefined;

        this.shockwave?.destroy();
        this.shockwave = undefined;

        this.laser?.destroy();
        this.laser = undefined;

        this.respawnEvent?.remove(false);
        this.respawnEvent = undefined;

        this.events.off(GameEvents.PLAYER_HIT, this.handlePlayerHit);
        this.events.off(GameEvents.BOMB_USED, this.handleBombUsed);
    }
}
