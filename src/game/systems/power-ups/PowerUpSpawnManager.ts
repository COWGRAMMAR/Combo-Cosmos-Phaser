import * as Phaser from 'phaser';
import { GameEvents } from '../../config/GameEvents';
import { PowerUpConfig } from '../../config/PowerUpConfig';
import { ScreenConfig } from '../../config/ScreenConfig';
import { ShuffleBag } from '../../utils/ShuffleBag';
import type { ShuffleBagEntry } from '../../utils/ShuffleBag';
import type { Player } from '../../entities/player/Player';
import { PowerUpCategory } from './PowerUpCategory';
import { PowerUpBuffType } from './PowerUpBuffType';
import { PowerUpItem } from './PowerUpItem';
import {
    pickMovementId,
    rollMovementParams,
    validateMovementConfig
} from './PowerUpMovement';
import type { PowerUpMovementId, PowerUpMovementParams } from './PowerUpMovement';
import type { IPowerUpBuff } from './IPowerUpBuff';
import type { PowerUpSlotManager } from './PowerUpSlotManager';

/** Kandidat jenis item hasil filter isValid()/getWeight(). */
interface ItemCandidate
{
    type: PowerUpBuffType;
    buff: IPowerUpBuff;
    weight: number;
}

/** Rentang acak yang sudah dipotong ke batas play area. */
interface ZoneRange
{
    min: number;
    max: number;
}

/**
 * Mengatur timer spawn item power-up, memilih jenis lewat kantong berbobot,
 * memilih pola gerak lewat kantong pola, lalu menggerakkan item di fixed step.
 * Item lahir dari zona spawn dinamis yang berpindah setelah sejumlah spawn sukses,
 * dan pool item di-prewarm penuh sehingga tidak ada alokasi saat bermain.
 */
export class PowerUpSpawnManager
{
    private readonly scene: Phaser.Scene;
    private readonly player: Player;
    private readonly buffRegistry: Map<PowerUpBuffType, IPowerUpBuff>;
    private readonly slotManager: PowerUpSlotManager;

    private spawnTimer: Phaser.Time.TimerEvent | null = null;
    private nextSpawnTime: number = 0;

    /** Item yang sedang aktif di area bermain. */
    private readonly activeItems: PowerUpItem[] = [];

    /** Item pool yang siap dipakai ulang. */
    private readonly idleItems: PowerUpItem[] = [];

    /** Kantong jenis item; kelereng dibangun dari bobot getWeight(). */
    private readonly itemBag = new ShuffleBag<PowerUpBuffType>();

    /** Sidik daftar kandidat terakhir; berubah berarti kantong harus dibangun ulang. */
    private bagSignature: string = '';

    /** Pusat zona spawn aktif pada koordinat lokal play area. */
    private zoneCenterX: number = 0;
    private zoneCenterY: number = 0;

    /** Jumlah item yang sudah sukses lahir di zona aktif. */
    private spawnsInZone: number = 0;

    constructor (
        scene: Phaser.Scene,
        player: Player,
        buffRegistry: Map<PowerUpBuffType, IPowerUpBuff>,
        slotManager: PowerUpSlotManager
    )
    {
        this.scene = scene;
        this.player = player;
        this.buffRegistry = buffRegistry;
        this.slotManager = slotManager;

        // Config gerak divalidasi sekali di awal agar salah tuning langsung terlihat.
        validateMovementConfig();

        // Zona awal tidak butuh syarat jarak; cukup berada di dalam play area.
        this.resetSpawnZone(null);

        for (let i = 0; i < PowerUpConfig.item.poolSize; i++)
        {
            this.idleItems.push(new PowerUpItem(scene));
        }
    }

    /** Mulai timer spawn otomatis. */
    public start (): void
    {
        this.scheduleNextSpawn();
    }

    /** Hentikan timer spawn. */
    public stop (): void
    {
        if (this.spawnTimer)
        {
            this.spawnTimer.destroy();
            this.spawnTimer = null;
        }
    }

    /** Update timer spawn per frame; gerak item sendiri diproses di updateItems(). */
    public update (delta: number): void
    {
        this.nextSpawnTime -= delta;

        if (this.nextSpawnTime <= 0)
        {
            this.trySpawn();
            this.scheduleNextSpawn();
        }
    }

    /** Daftar item aktif (read-only) untuk kebutuhan debug. */
    public getActiveItems (): ReadonlyArray<PowerUpItem>
    {
        return this.activeItems;
    }

    /** Snapshot zona spawn aktif (pusat + ukuran) untuk visualisasi debug. */
    public getSpawnZone (): { x: number; y: number; width: number; height: number }
    {
        return {
            x: this.zoneCenterX,
            y: this.zoneCenterY,
            width: PowerUpConfig.spawn.spawnZone.width,
            height: PowerUpConfig.spawn.spawnZone.height
        };
    }

    /**
     * Majukan seluruh item aktif satu langkah tetap: umur, posisi, status pickup,
     * lalu ambil atau kembalikan ke pool. Dipanggil dari fixed step Game.
     */
    public updateItems (fixedStepMs: number): void
    {
        const playArea = ScreenConfig.playArea;
        const margin = PowerUpConfig.item.despawnMargin;
        const radius = PowerUpConfig.render.itemRadius;

        for (let i = this.activeItems.length - 1; i >= 0; i--)
        {
            const item = this.activeItems[i];
            const type = item.getBuffType();
            const buff = this.buffRegistry.get(type);

            if (!buff)
            {
                this.releaseItem(i);
                continue;
            }

            item.advance(fixedStepMs);

            const canPickup = this.canPickup(type, buff);

            if (!item.isConsumed())
            {
                item.setBlocked(!canPickup);
            }

            if (!item.isConsumed() && canPickup && this.isPlayerInRange(item))
            {
                item.consume();
                this.releaseItem(i);
                this.scene.events.emit(GameEvents.POWER_UP_COLLECTED, type, buff.getCategory());
                continue;
            }

            // Despawn 4 sisi: jalur diagonal bisa keluar samping tanpa melewati batas bawah.
            const outOfBounds = item.y > playArea.height + margin
                || item.y < -margin - radius
                || item.x < -margin - radius
                || item.x > playArea.width + margin + radius;

            if (outOfBounds)
            {
                this.releaseItem(i);
            }
        }
    }

    /** Kembalikan semua item aktif ke pool dan siapkan zona spawn awal yang baru. */
    public clearAll (): void
    {
        for (let i = this.activeItems.length - 1; i >= 0; i--)
        {
            this.releaseItem(i);
        }

        this.resetSpawnZone(null);
    }

    /** Coba spawn satu item power-up jika ada tipe valid dan pool tersedia. */
    private trySpawn (): void
    {
        const candidates = this.buildCandidates();

        if (candidates.length === 0)
        {
            return;
        }

        const item = this.getFreeItem();

        // Pool penuh: spawn ditunda ke tick berikutnya tanpa memakan kelereng.
        if (!item)
        {
            return;
        }

        // Posisi divalidasi lebih dulu agar spawn gagal tidak memakan kelereng jenis.
        const movementId = pickMovementId();
        const params = rollMovementParams(movementId);
        const position = this.rollItemPosition(params);

        if (!position)
        {
            // Tidak ada titik yang cukup jauh dari player: kembalikan item, lalu pindahkan zona.
            this.idleItems.push(item);
            this.resetSpawnZone({ x: this.zoneCenterX, y: this.zoneCenterY });
            return;
        }

        this.spawnItem(item, this.drawItemType(candidates), movementId, params, position);
    }

    /** Kumpulkan tipe yang boleh muncul sekarang beserta bobotnya. */
    private buildCandidates (): ItemCandidate[]
    {
        const candidates: ItemCandidate[] = [];

        for (const [type, buff] of this.buffRegistry)
        {
            if (!buff.isValid(this.player))
            {
                continue;
            }

            const weight = buff.getWeight(this.player);

            if (weight > 0)
            {
                candidates.push({ type, buff, weight });
            }
        }

        return candidates;
    }

    /**
     * Ambil jenis item berikutnya dari kantong.
     * Kantong dibangun ulang saat set kandidat berubah; kelereng untuk tipe yang
     * sudah tidak valid dibuang tanpa memakai jatah draw.
     */
    private drawItemType (candidates: readonly ItemCandidate[]): PowerUpBuffType
    {
        const signature = candidates.map((candidate) => candidate.type).join('|');

        if (signature !== this.bagSignature)
        {
            this.bagSignature = signature;
            this.itemBag.clear();
        }

        if (this.itemBag.size === 0)
        {
            this.refillItemBag(candidates);
        }

        for (let attempt = 0; attempt < candidates.length; attempt++)
        {
            const drawn = this.itemBag.draw();

            if (drawn === null)
            {
                break;
            }

            if (this.isCandidate(candidates, drawn))
            {
                return drawn;
            }
        }

        this.refillItemBag(candidates);
        const fallback = this.itemBag.draw();

        return fallback !== null && this.isCandidate(candidates, fallback)
            ? fallback
            : candidates[0].type;
    }

    /** Isi kantong jenis item dari bobot kandidat (bobot dibulatkan, minimal 1). */
    private refillItemBag (candidates: readonly ItemCandidate[]): void
    {
        const entries: ShuffleBagEntry<PowerUpBuffType>[] = candidates.map((candidate) => ({
            value: candidate.type,
            count: Math.max(1, Math.round(candidate.weight))
        }));

        this.itemBag.refill(entries);
    }

    /** Apakah tipe masih ada di daftar kandidat saat ini. */
    private isCandidate (candidates: readonly ItemCandidate[], type: PowerUpBuffType): boolean
    {
        for (const candidate of candidates)
        {
            if (candidate.type === type)
            {
                return true;
            }
        }

        return false;
    }

    /** Ambil satu item dari free-list; null berarti pool sedang penuh. */
    private getFreeItem (): PowerUpItem | null
    {
        const item = this.idleItems.pop();

        return item ?? null;
    }

    /**
     * Roll pusat zona spawn baru.
     * previous null dipakai untuk zona awal/reset (tanpa syarat jarak); previous terisi
     * membuat zona baru berjarak minimum dari zona sebelumnya dengan relaksasi bertahap.
     */
    private resetSpawnZone (previous: { x: number; y: number } | null): void
    {
        const playArea = ScreenConfig.playArea;
        const zone = PowerUpConfig.spawn.spawnZone;
        const boundsX = this.getZoneCenterBounds(zone.width, playArea.width);
        const boundsY = this.getZoneCenterBounds(zone.height, playArea.height);

        if (!previous)
        {
            this.commitSpawnZone(
                this.randomBetween(boundsX.min, boundsX.max),
                this.randomBetween(boundsY.min, boundsY.max)
            );
            return;
        }

        let lastX = boundsX.min;
        let lastY = boundsY.min;

        for (let round = 0; round <= zone.maxRelaxRounds; round++)
        {
            // Tiap putaran menurunkan syarat jarak agar play area sempit tetap bisa memilih.
            const required = Phaser.Math.FloatBetween(zone.minDistanceMin, zone.minDistanceMax)
                - round * zone.relaxStep;

            for (let attempt = 0; attempt <= zone.maxPositionAttempts; attempt++)
            {
                lastX = this.randomBetween(boundsX.min, boundsX.max);
                lastY = this.randomBetween(boundsY.min, boundsY.max);

                const dx = lastX - previous.x;
                const dy = lastY - previous.y;

                if (required <= 0 || dx * dx + dy * dy >= required * required)
                {
                    this.commitSpawnZone(lastX, lastY);
                    return;
                }
            }
        }

        // Semua percobaan gagal: kandidat terakhir dijamin masih di dalam play area.
        this.commitSpawnZone(lastX, lastY);
    }

    /** Simpan pusat zona baru dan reset penghitung item per zona. */
    private commitSpawnZone (x: number, y: number): void
    {
        this.zoneCenterX = x;
        this.zoneCenterY = y;
        this.spawnsInZone = 0;
    }

    /**
     * Batas pusat zona untuk satu sumbu; bila zona lebih besar dari play area,
     * rentang dipadatkan ke tengah supaya pusat tetap valid.
     */
    private getZoneCenterBounds (size: number, areaSize: number): ZoneRange
    {
        const half = size / 2;
        const min = half;
        const max = areaSize - half;

        return max >= min
            ? { min, max }
            : { min: areaSize / 2, max: areaSize / 2 };
    }

    /**
     * Roll posisi item di dalam zona yang sudah dipotong play area, dengan validasi
     * jarak minimum ke player. Posisi player dibaca segar pada tiap percobaan.
     */
    private rollItemPosition (params: PowerUpMovementParams): { x: number; y: number } | null
    {
        const playArea = ScreenConfig.playArea;
        const zone = PowerUpConfig.spawn.spawnZone;
        const radius = PowerUpConfig.render.itemRadius;
        // Inset radius visual + amplitudo agar ayunan pola tidak langsung keluar zona.
        const rangeX = this.buildZoneRange(
            this.zoneCenterX,
            zone.width,
            playArea.width,
            radius + params.amp
        );
        const rangeY = this.buildZoneRange(
            this.zoneCenterY,
            zone.height,
            playArea.height,
            radius + params.ampY
        );
        const minDistanceSq = PowerUpConfig.spawn.minPlayerSpawnDistance * PowerUpConfig.spawn.minPlayerSpawnDistance;

        for (let attempt = 0; attempt < zone.itemSpawnMaxAttempts; attempt++)
        {
            const x = this.randomBetween(rangeX.min, rangeX.max);
            const y = this.randomBetween(rangeY.min, rangeY.max);
            const dx = x - this.player.x;
            const dy = y - this.player.y;

            if (dx * dx + dy * dy >= minDistanceSq)
            {
                return { x, y };
            }
        }

        return null;
    }

    /**
     * Irisan rentang acak zona dengan play area pada satu sumbu.
     * Bila irisan habis (zona tidak muat), titik dipadatkan ke pusat yang masih valid.
     */
    private buildZoneRange (center: number, size: number, areaSize: number, inset: number): ZoneRange
    {
        const min = Math.max(0, center - size / 2) + inset;
        const max = Math.min(areaSize, center + size / 2) - inset;

        if (max >= min)
        {
            return { min, max };
        }

        const fallback = Phaser.Math.Clamp(center, inset, areaSize - inset);

        return { min: fallback, max: fallback };
    }

    /** Angka acak kontinu dalam rentang; rentang kosong mengembalikan batasnya. */
    private randomBetween (min: number, max: number): number
    {
        return max > min ? min + Math.random() * (max - min) : min;
    }

    /** Siapkan item dari pool di posisi dalam zona, lalu catat progres zona. */
    private spawnItem (
        item: PowerUpItem,
        type: PowerUpBuffType,
        movementId: PowerUpMovementId,
        params: PowerUpMovementParams,
        position: { x: number; y: number }
    ): void
    {
        // Pola straight membawa arah lewat angleDeg, jadi cermin dir tidak diperlukan.
        const dir = movementId === 'straight'
            ? 1
            : (Math.random() < 0.5 ? -1 : 1);

        item.reset(type, movementId, params, dir, position.x, position.y);
        item.advance(0);

        this.activeItems.push(item);
        this.spawnsInZone++;

        if (this.spawnsInZone >= PowerUpConfig.spawn.spawnZone.itemsPerZone)
        {
            this.resetSpawnZone({ x: this.zoneCenterX, y: this.zoneCenterY });
        }
    }

    /** Kembalikan item aktif di indeks tertentu ke pool. */
    private releaseItem (index: number): void
    {
        const item = this.activeItems[index];
        this.activeItems.splice(index, 1);

        item.setActive(false);
        item.setVisible(false);
        this.idleItems.push(item);
    }

    /** Aturan pickup: AutoPickup cek isValid, Slotted cek kapasitas inventory. */
    private canPickup (type: PowerUpBuffType, buff: IPowerUpBuff): boolean
    {
        return buff.getCategory() === PowerUpCategory.AutoPickup
            ? buff.isValid(this.player)
            : this.slotManager.canAccept(type);
    }

    /** Apakah pemain berada dalam radius pickup item. */
    private isPlayerInRange (item: PowerUpItem): boolean
    {
        const dx = item.x - this.player.x;
        const dy = item.y - this.player.y;
        const radius = PowerUpConfig.item.pickupRadius;

        return dx * dx + dy * dy <= radius * radius;
    }

    /** Jadwalkan spawn berikutnya dengan jitter yang sama seperti sebelumnya. */
    private scheduleNextSpawn (): void
    {
        const jitter = Phaser.Math.Between(-PowerUpConfig.item.spawnJitterMs, PowerUpConfig.item.spawnJitterMs);
        this.nextSpawnTime = PowerUpConfig.item.spawnIntervalMs + jitter;
    }
}
