import * as Phaser from 'phaser';
import { AssetKeys } from '../config/AssetKeys';
import { DepthConfig } from '../config/DepthConfig';
import { EnemyConfig } from '../config/EnemyConfig';
import { EnemyTestConfig } from '../config/EnemyTestConfig';
import { GameEvents } from '../config/GameEvents';
import { SLOT_INPUT_ACTIONS } from '../config/InputBindings';
import { PlayerConfig } from '../config/PlayerConfig';
import { PowerUpConfig } from '../config/PowerUpConfig';
import { ScreenConfig } from '../config/ScreenConfig';
import { runFixedStepsWithTimeConfig } from '../utils/fixedStep';
import { WorldConfig } from '../config/WorldConfig';
import { PlayerBullet } from '../entities/bullet/PlayerBullet';
import { Shield } from '../entities/effects/Shield';
import { Shockwave } from '../entities/effects/Shockwave';
import type { Enemy } from '../entities/enemy/Enemy';
import { Player } from '../entities/player/Player';
import { PlayerLaser } from '../entities/player/PlayerLaser';
import { PlayerWeapon } from '../entities/player/PlayerWeapon';
import { DebugTools } from '../systems/DebugTools';
import { AssetManager } from '../systems/AssetManager';
import { EffectManager } from '../systems/EffectManager';
import { EnemyBulletManager } from '../systems/EnemyBulletManager';
import { InputManager } from '../systems/InputManager';
import { PauseManager } from '../systems/PauseManager';
import { PowerUpManager } from '../systems/PowerUpManager';
import type { PowerUpType } from '../systems/PowerUpManager';
import { GruntPool } from '../systems/enemy/GruntPool';
import { GruntTestRunner } from '../systems/enemy/GruntTestRunner';
import { EnemyExplosionPool } from '../systems/effects/EnemyExplosionPool';
import { PowerUpSlotManager } from '../systems/power-ups/PowerUpSlotManager';
import { ActiveBuffManager } from '../systems/power-ups/ActiveBuffManager';
import { PowerUpSpawnManager } from '../systems/power-ups/PowerUpSpawnManager';
import type { PowerUpBuffType } from '../systems/power-ups/PowerUpBuffType';
import type { PowerUpCategory } from '../systems/power-ups/PowerUpCategory';
import { EffectType } from '../types/EffectType';
import { InputAction } from '../types/InputAction';
import { Team } from '../types/Team';
import { DebugOverlay } from '../ui/DebugOverlay';
import { computeFit } from '../utils/computeFit';
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
    private enemies?: Phaser.GameObjects.Group;
    private grunts?: GruntPool;
    private gruntTestRunner?: GruntTestRunner;
    private enemyBullets?: EnemyBulletManager;
    private effects?: EffectManager;
    private powerUps?: PowerUpManager;
    private slotManager?: PowerUpSlotManager;
    private activeBuffManager?: ActiveBuffManager;
    private spawnManager?: PowerUpSpawnManager;
    private shockwave?: Shockwave;
    private shield?: Shield;
    private laser?: PlayerLaser;
    private explosions?: EnemyExplosionPool;
    private overlay?: DebugOverlay;
    private debugTools?: DebugTools;
    private pauseManager?: PauseManager;
    private playerBulletMax: number = 0;
    private gameOverPending: boolean = false;
    /** Frame terakhir saat tabrakan badan sudah memberi konsekuensi. */
    private lastEnemyContactFrame: number = -1;
    private _accumulatorMs: number = 0;

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
        enemyBulletsTotalCreated: 0,
        enemyBulletsCreatedThisFrame: 0,
        enemyBulletsSpawnMs: 0,
        playerHits: 0,
        lanes: 0,
        lives: 0,
        gruntsActive: 0,
        gruntsOverflow: 0,
        gruntScenario: '',
        invulnerable: false,
        shieldActive: false,
        fireRateActive: false,
        laserActive: false,
        dashReady: true
    };

    /**
     * Callback overlap peluru pemain dengan musuh.
     * Urutan argumen bisa berbeda tergantung container yang dipakai Phaser,
     * jadi bullet dideteksi dari tipe objeknya, bukan dari posisi argumen.
     */
    private readonly handlePlayerBulletHitsEnemy: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (objectA, objectB) =>
    {
        const bullet = objectA instanceof PlayerBullet
            ? objectA
            : objectB instanceof PlayerBullet
                ? objectB
                : null;

        if (!bullet || !bullet.active)
        {
            return;
        }

        const enemy = (objectA === bullet ? objectB : objectA) as Enemy;

        if (!enemy.active)
        {
            return;
        }

        bullet.deactivate();
        enemy.takeDamage(bullet.damage);
    };

    /**
     * Tabrakan badan: musuh selalu hancur. Player hanya kehilangan nyawa
     * jika tidak sedang kebal, memakai shield, atau dash. Shield pecah lebih dulu.
     */
    private readonly handlePlayerTouchesEnemy: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_playerObject, enemyObject) =>
    {
        const player = this.player;
        const enemy = enemyObject as Enemy;

        if (!player || !player.active || !enemy.active)
        {
            return;
        }

        // Semua musuh yang menabrak tetap hancur, tetapi konsekuensinya
        // dibatasi satu kali per frame agar tumpukan Grunt tidak menghabiskan nyawa.
        enemy.kill();

        const frame = this.game.loop.frame;

        if (this.lastEnemyContactFrame === frame)
        {
            return;
        }

        this.lastEnemyContactFrame = frame;

        if (this.effects?.isActive(EffectType.Shield))
        {
            this.effects.stop(EffectType.Shield);
            return;
        }

        if (player.isDamageImmune() || player.isDashing())
        {
            return;
        }

        this.damagePlayer();
    };

    /** Reaksi saat peluru musuh mengenai pemain. */
    private readonly handlePlayerHit = (): void =>
    {
        this.damagePlayer();
    };

    /** Memunculkan ledakan di posisi musuh yang benar-benar mati. */
    private readonly handleEnemyKilled = (x: number, y: number): void =>
    {
        this.explosions?.spawn(x, y);
    };

    /** Mendaftarkan scene Game. */
    constructor ()
    {
        super('Game');
    }

    /** Merakit pemain, pool peluru, pool Grunt, efek, power-up, dan alat debug. */
    create (): void
    {
        const playArea = ScreenConfig.playArea;
        const spawn = ScreenConfig.spawn;
        const camera = this.cameras.main;

        camera.setBounds(0, 0, playArea.width, playArea.height);
        camera.setBackgroundColor(WorldConfig.background.color);
        this.physics.world.setBounds(0, 0, playArea.width, playArea.height);

        this.applyCameraLayout();
        this.scale.on('resize', this.applyCameraLayout, this);

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

        this.weapon = new PlayerWeapon(this, AssetManager.resolve(AssetKeys.PlayerBullet));

        this.player = new Player(this, spawn.playerX, spawn.playerY, AssetManager.resolve(AssetKeys.Player), {
            team: Team.Player,
            moveSpeed: PlayerConfig.moveSpeed,
            bodyRadius: PlayerConfig.bodyRadius
        }, this.inputManager, this.weapon);

        this.enemyBullets = new EnemyBulletManager(this, this.player, () =>
        {
            this.events.emit(GameEvents.PLAYER_HIT);
        });

        // Pool harus dibuat sebelum PlayerLaser karena laser meng-cache daftar musuh.
        const grunts = new GruntPool(
            this,
            this.enemyBullets,
            this.player,
            AssetManager.resolve(AssetKeys.Enemy)
        );

        this.grunts = grunts;
        this.enemies = grunts.poolGroup;

        this.explosions = new EnemyExplosionPool(
            this,
            AssetManager.resolve(AssetKeys.EnemyExplosion)
        );

        this.laser = new PlayerLaser(this, this.player, this.enemies);

        this.effects = new EffectManager({
            onStart: (type: EffectType) => this.handleEffectStart(type),
            onEnd: (type: EffectType) => this.handleEffectEnd(type)
        });

        this.slotManager = new PowerUpSlotManager();
        this.activeBuffManager = new ActiveBuffManager(this.effects);

        this.powerUps = new PowerUpManager(
            this,
            this.player,
            this.weapon,
            this.effects,
            this.enemyBullets,
            this.enemies,
            this.slotManager,
            this.activeBuffManager
        );

        this.spawnManager = new PowerUpSpawnManager(this, this.player, this.powerUps.getBuffRegistry());

        this.shockwave = new Shockwave(this, this.enemyBullets);
        this.shield = new Shield(this);

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

        this.events.off(GameEvents.ENEMY_KILLED, this.handleEnemyKilled);
        this.events.on(GameEvents.ENEMY_KILLED, this.handleEnemyKilled);

        const resetKey = EnemyTestConfig.enabled && EnemyTestConfig.resetKeyEnabled
            ? EnemyTestConfig.resetKey
            : undefined;

        this.overlay = new DebugOverlay();
        this.applyCameraLayout();
        this.debugTools = new DebugTools(this, {
            toggleOverlay: () => this.overlay?.toggle(),
            stress: (count: number) => this.spawnStressBullets(count),
            cycleLanes: () => this.weapon?.cycleLanes(),
            powerUp: (kind: PowerUpType) => this.powerUps?.apply(kind),
            resetEnemyTest: () =>
            {
                this.enemyBullets?.clearAll();
                this.gruntTestRunner?.restart();
            }
        }, { resetKey });

        this.gruntTestRunner = new GruntTestRunner(grunts);
        this.gruntTestRunner.start();

        // Event power-up: item disentuh pemain dan power-up dipakai dari slot.
        this.events.on(GameEvents.POWER_UP_COLLECTED, this.handlePowerUpCollected, this);
        this.events.on(GameEvents.POWER_UP_USED, this.handlePowerUpUsed, this);

        this.pauseManager = new PauseManager(this);
        this.scene.launch('Hud');

        this.stats.gruntScenario = EnemyTestConfig.enabled ? EnemyTestConfig.scenario : 'off';
        this.spawnManager?.start();
        this.playerBulletMax = 0;
        this.gameOverPending = false;
        this.lastEnemyContactFrame = -1;

        this.events.once('shutdown', this.handleShutdown, this);

        // Reset accumulator saat scene pause/resume agar sisa delta tidak menjadi burst.
        this.events.on(Phaser.Core.Events.PAUSE, this.handleScenePause, this);
        this.events.on(Phaser.Core.Events.RESUME, this.handleSceneResume, this);
    }

    /** Menyesuaikan viewport dan zoom kamera agar play area tetap utuh dan tajam. */
    private applyCameraLayout (): void
    {
        const playArea = ScreenConfig.playArea;
        const fit = computeFit(this.scale.width, this.scale.height);
        const camera = this.cameras.main;

        camera.setViewport(
            fit.offsetX + playArea.x * fit.scale,
            fit.offsetY + playArea.y * fit.scale,
            playArea.width * fit.scale,
            playArea.height * fit.scale
        );
        camera.setZoom(fit.scale);
        camera.centerOn(playArea.width / 2, playArea.height / 2);

        // Overlay DOM ditempel ke sudut kiri atas viewport kamera (area hijau).
        const canvasRect = this.scale.canvas.getBoundingClientRect();
        this.overlay?.setPosition(canvasRect.left + camera.x + 8, canvasRect.top + camera.y + 8);
    }

    /** Menjalankan seluruh sistem per frame. */
    update (_time: number, delta: number): void
    {
        this._accumulatorMs = runFixedStepsWithTimeConfig(
            this._accumulatorMs,
            delta,
            (fixedStepMs) => {
                this.enemyBullets?.update(fixedStepMs);
                this.effects?.update(fixedStepMs);
                this.activeBuffManager?.update(fixedStepMs);
                this.shockwave?.update(fixedStepMs);
                this.laser?.update(fixedStepMs);
                this.explosions?.update(fixedStepMs);
            }
        );

        // Spawn pola Grunt memakai delta frame, bukan fixed-step, agar jeda pola
        // tetap mengikuti waktu nyata.
        this.gruntTestRunner?.update(delta);

        this.spawnManager?.update(delta);

        if (this.inputManager?.isJustDown(InputAction.Pause))
        {
            this.pauseManager?.pause();
        }

        this.updateSlotKeybinds();

        this.shield?.update(this.player?.x ?? 0, this.player?.y ?? 0);
        this.laser?.setPosition(this.player?.x ?? 0, this.player?.y ?? 0);

        // Tembakan biasa diizinkan hanya jika tidak ada buff aktif yang memblokir (misalnya Laser).
        this.weapon?.setFiringEnabled(this.activeBuffManager?.canFireNormal() ?? true);

        this.updateStats(delta);

        this.debugTools?.update();
        this.overlay?.update(this.stats);
    }

    /** Getter read-only slot manager untuk konsumsi UI/HUD (UI hanya baca, tidak mengubah gameplay). */
    public getSlotManager(): PowerUpSlotManager | undefined
    {
        return this.slotManager;
    }

    /** Getter read-only active buff manager untuk konsumsi UI/HUD (UI hanya baca, tidak mengubah gameplay). */
    public getActiveBuffManager(): ActiveBuffManager | undefined
    {
        return this.activeBuffManager;
    }

    /** Getter read-only player untuk konsumsi UI/HUD (UI hanya baca, tidak mengubah gameplay). */
    public getPlayer(): Player | undefined
    {
        return this.player;
    }

    /** Cek keybind slot: 1/2/3 pakai, tahan E lalu tekan 1/2/3 untuk membuang. */
    private updateSlotKeybinds (): void
    {
        if (!this.slotManager || !this.activeBuffManager || !this.player || !this.weapon)
        {
            return;
        }

        const input = this.inputManager;

        if (!input)
        {
            return;
        }

        const discard = input.isDown(InputAction.DiscardModifier);
        const slotCount = Math.min(SLOT_INPUT_ACTIONS.length, PowerUpConfig.slotCount);

        for (let i = 0; i < slotCount; i++)
        {
            if (!input.isJustDown(SLOT_INPUT_ACTIONS[i]))
            {
                continue;
            }

            if (discard)
            {
                this.slotManager.discard(i);
                continue;
            }

            const buff = this.slotManager.use(i);

            if (buff)
            {
                this.activeBuffManager.activate(buff, this.player, this.weapon, this);
                this.events.emit(GameEvents.POWER_UP_USED, i);
            }
        }
    }

    /** Set ulang accumulator saat scene dijeda, mencegah burst saat kembali aktif. */
    private handleScenePause (): void
    {
        this._accumulatorMs = 0;
        this.player?.resetAccumulator();
        this.activeBuffManager?.pauseAll();
        this.spawnManager?.stop();
    }

    /** Set ulang accumulator saat scene dilanjutkan, mencegah burst dari delta waktu jeda. */
    private handleSceneResume (): void
    {
        this._accumulatorMs = 0;
        this.player?.resetAccumulator();
        this.activeBuffManager?.resumeAll();
        this.spawnManager?.start();

        // ESC bisa masih tertahan saat resume; reset agar tidak langsung memicu pause lagi.
        this.inputManager?.clearJustDown(InputAction.Pause);
    }

    /** Mengosongkan seluruh pool dan mengembalikan state ke awal run. */
    public resetRun (): void
    {
        this._accumulatorMs = 0;
        this.player?.resetAccumulator();

        this.effects?.reset();
        this.activeBuffManager?.reset();
        this.slotManager?.reset();
        this.spawnManager?.stop();
        this.weapon?.reset();
        this.weapon?.clearAll();
        this.enemyBullets?.reset();
        this.shockwave?.stop();
        this.shield?.stop();
        this.laser?.reset();
        this.explosions?.reset();

        this.playerBulletMax = 0;
        this.gameOverPending = false;
        this.lastEnemyContactFrame = -1;

        this.player?.resetForPool(ScreenConfig.spawn.playerX, ScreenConfig.spawn.playerY);
        this.gruntTestRunner?.start();
    }

    /** Mengurangi satu nyawa, lalu memicu game over atau efek damage. */
    private damagePlayer (): void
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
    }

    /** Item power-up disentuh pemain: delegate ke PowerUpManager untuk diterapkan atau masuk slot. */
    private handlePowerUpCollected (type: PowerUpBuffType, _category: PowerUpCategory): void
    {
        this.powerUps?.applyBuffType(type);
    }

    /** Power-up dari slot diaktifkan pemain: aktifkan buff lewat ActiveBuffManager. */
    private handlePowerUpUsed (_slotIndex: number): void
    {
        // Buff sudah diaktifkan di updateSlotKeybinds lewat activeBuffManager.activate();
        // Event ini dipancarkan untuk konsumsi UI/HUD.
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
                this.shield?.start(this.player?.x ?? 0, this.player?.y ?? 0);
                break;
            case EffectType.Laser:
                // Blokir tembakan biasa diatur oleh ActiveBuffManager.canFireNormal() di update(),
                // bukan di sini. Laser visual tetap diaktifkan/dimatikan lewat efek durasi.
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
                this.shield?.stop();
                break;
            case EffectType.Laser:
                this.laser?.deactivate();
                // Blokir tembakan biasa dilepaskan oleh ActiveBuffManager di update().
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
        stats.enemyBulletsTotalCreated = enemyBullets.totalCreated;
        stats.enemyBulletsCreatedThisFrame = enemyBullets.createdThisFrame;
        stats.enemyBulletsSpawnMs = enemyBullets.spawnMsThisFrame;
        stats.playerHits = enemyBullets.playerHitCount;
        stats.lanes = weapon.laneCount;
        stats.lives = player.lives;
        stats.gruntsActive = this.grunts?.activeCount ?? 0;
        stats.gruntsOverflow = this.grunts?.overflowCount ?? 0;
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

        this.shield?.destroy();
        this.shield = undefined;

        this.laser?.destroy();
        this.laser = undefined;

        this.explosions?.destroy();
        this.explosions = undefined;

        this.gruntTestRunner = undefined;
        this.grunts = undefined;
        this.enemies = undefined;

        this.spawnManager?.stop();
        this.activeBuffManager?.reset();
        this.slotManager?.reset();
        this.scale.off('resize', this.applyCameraLayout, this);

        this.events.off(GameEvents.PLAYER_HIT, this.handlePlayerHit);
        this.events.off(GameEvents.ENEMY_KILLED, this.handleEnemyKilled);
        this.events.off(GameEvents.POWER_UP_COLLECTED, this.handlePowerUpCollected, this);
        this.events.off(GameEvents.POWER_UP_USED, this.handlePowerUpUsed, this);
        this.events.off(Phaser.Core.Events.PAUSE, this.handleScenePause, this);
        this.events.off(Phaser.Core.Events.RESUME, this.handleSceneResume, this);
    }
}
