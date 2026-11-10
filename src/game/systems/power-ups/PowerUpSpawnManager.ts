import * as Phaser from 'phaser';
import { GameEvents } from '../../config/GameEvents';
import { PowerUpConfig } from '../../config/PowerUpConfig';
import { PowerUpBuffType } from './PowerUpBuffType';
import type { IPowerUpBuff } from './IPowerUpBuff';
import type { Player } from '../../entities/player/Player';

/**
 * Mengatur spawn timer power-up, memilih tipe via isValid()/getWeight(),
 * render item visual, dan deteksi overlap dengan pemain.
 */
export class PowerUpSpawnManager
{
    private readonly scene: Phaser.Scene;
    private readonly player: Player;
    private readonly buffRegistry: Map<PowerUpBuffType, IPowerUpBuff>;

    private spawnTimer: Phaser.Time.TimerEvent | null = null;
    private nextSpawnTime: number = 0;

    private activeItems: Phaser.GameObjects.GameObject[] = [];

    constructor(scene: Phaser.Scene, player: Player, buffRegistry: Map<PowerUpBuffType, IPowerUpBuff>)
    {
        this.scene = scene;
        this.player = player;
        this.buffRegistry = buffRegistry;
    }

    /** Mulai timer spawn otomatis. */
    public start(): void
    {
        this.scheduleNextSpawn();
    }

    /** Hentikan timer spawn. */
    public stop(): void
    {
        if (this.spawnTimer)
        {
            this.spawnTimer.destroy();
            this.spawnTimer = null;
        }
    }

    /** Update dipanggil tiap frame dari Game.update(). */
    public update(delta: number): void
    {
        this.nextSpawnTime -= delta;

        if (this.nextSpawnTime <= 0)
        {
            this.trySpawn();
            this.scheduleNextSpawn();
        }
    }

    /** Coba spawn satu item power-up jika ada tipe yang valid. */
    private trySpawn(): void
    {
        const candidates: { type: PowerUpBuffType; buff: IPowerUpBuff; weight: number }[] = [];

        for (const [type, buff] of this.buffRegistry)
        {
            if (buff.isValid(this.player))
            {
                const weight = buff.getWeight(this.player);
                if (weight > 0)
                {
                    candidates.push({ type, buff, weight });
                }
            }
        }

        if (candidates.length === 0)
        {
            return;
        }

        const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
        let roll = Math.random() * totalWeight;
        let chosen: { type: PowerUpBuffType; buff: IPowerUpBuff } | null = null;

        for (const c of candidates)
        {
            roll -= c.weight;
            if (roll <= 0)
            {
                chosen = { type: c.type, buff: c.buff };
                break;
            }
        }

        if (!chosen)
        {
            return;
        }

        this.spawnItem(chosen.type, chosen.buff);
    }

    /** Spawn item visual di posisi acak di area bermain. */
    private spawnItem(type: PowerUpBuffType, buff: IPowerUpBuff): void
    {
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;
        const margin = PowerUpConfig.spawnMargin;
        const x = Phaser.Math.Between(margin, width - margin);
        const y = Phaser.Math.Between(margin, height - margin);

        const item = this.scene.add.circle(x, y, PowerUpConfig.itemRadius, PowerUpConfig.itemColor, PowerUpConfig.itemAlpha);
        item.setDepth(PowerUpConfig.itemDepth);

        this.scene.physics.add.existing(item);
        const body = item.body as Phaser.Physics.Arcade.Body;
        body.setCircle(PowerUpConfig.itemBodyRadius);
        body.setImmovable(true);
        body.enable = true;

        // Overlap detection dengan player.
        this.scene.physics.add.overlap(
            item,
            this.player as unknown as Phaser.GameObjects.GameObject,
            () => this.collectItem(item, type, buff)
        );

        this.activeItems.push(item);

        // Auto-hapus item setelah itemDespawnMs jika tidak diambil.
        this.scene.time.delayedCall(PowerUpConfig.itemDespawnMs, () => {
            this.removeItem(item);
        });
    }

    /** Pemain menyentuh item: emit event, hapus item, delegate ke PowerUpManager. */
    private collectItem(item: Phaser.GameObjects.GameObject, type: PowerUpBuffType, buff: IPowerUpBuff): void
    {
        this.removeItem(item);

        this.scene.events.emit(GameEvents.POWER_UP_COLLECTED, type, buff.getCategory());
    }

    /** Hapus item dari scene dan daftar aktif. */
    private removeItem(item: Phaser.GameObjects.GameObject): void
    {
        if (item.body)
        {
            (item.body as Phaser.Physics.Arcade.Body).enable = false;
        }
        item.destroy();
        const idx = this.activeItems.indexOf(item);
        if (idx >= 0)
        {
            this.activeItems.splice(idx, 1);
        }
    }

    /** Hapus semua item aktif. */
    public clearAll(): void
    {
        for (const item of this.activeItems)
        {
            this.removeItem(item);
        }
        this.activeItems = [];
    }

    private scheduleNextSpawn(): void
    {
        const jitter = Phaser.Math.Between(-PowerUpConfig.spawnJitterMs, PowerUpConfig.spawnJitterMs);
        this.nextSpawnTime = PowerUpConfig.spawnIntervalMs + jitter;
    }
}
