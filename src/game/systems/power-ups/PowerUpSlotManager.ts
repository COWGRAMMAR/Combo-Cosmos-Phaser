import { PowerUpBuffType } from './PowerUpBuffType';
import type { IPowerUpBuff } from './IPowerUpBuff';
import type { Player } from '../../entities/player/Player';
import { PowerUpConfig } from '../../config/PowerUpConfig';

/**
 * Slot inventory pemain untuk power-up jenis Slotted.
 * Maksimal slotCount slot, setiap slot menyimpan satu jenis + jumlah stack.
 * Isi slot kiri-kanan, pakai via keybind 1/2/3, buang via Ctrl+1/2/3.
 */
export class PowerUpSlotManager
{
    private readonly slotCount = PowerUpConfig.slotCount;

    private readonly slots: IPowerUpBuff[][] = [];

    /** Daftar type yang sedang ada di tiap slot (untuk UI). */
    private readonly slotTypes: PowerUpBuffType[] = [];

    /** Jumlah stack tiap slot. */
    private readonly slotCounts: number[] = [];

    /** Max stack per slot per jenis buff (config dari PowerUpConfig). */
    private readonly maxStackPerSlot = PowerUpConfig.maxStackPerSlot;

    constructor()
    {
        for (let i = 0; i < this.slotCount; i++)
        {
            this.slots[i] = [];
            this.slotTypes[i] = PowerUpBuffType.Nuke;
            this.slotCounts[i] = 0;
        }
    }

    /** Jumlah slot yang tersedia. */
    public getSlotCount(): number
    {
        return this.slotCount;
    }

    /** Tipe buff di slot indeks. */
    public getSlotType(index: number): PowerUpBuffType | null
    {
        if (index < 0 || index >= this.slotCount)
        {
            return null;
        }
        return this.slotCounts[index] > 0 ? this.slotTypes[index] : null;
    }

    /** Jumlah stack di slot indeks. */
    public getSlotCountAt(index: number): number
    {
        if (index < 0 || index >= this.slotCount)
        {
            return 0;
        }
        return this.slotCounts[index];
    }

    /**
     * Coba tambahkan buff ke slot.
     * Prioritas: stack di slot jenis sama, lalu slot kosong pertama.
     * Mengembalikan true jika berhasil masuk slot (item dapat dihapus).
     */
    public add(type: PowerUpBuffType, buff: IPowerUpBuff, player: Player): boolean
    {
        if (!buff.isValid(player))
        {
            return false;
        }

        // Stack di slot jenis sama yang sudah ada.
        for (let i = 0; i < this.slotCount; i++)
        {
            if (this.slotCounts[i] > 0 && this.slotTypes[i] === type)
            {
                const maxStack = this.maxStackPerSlot[type as keyof typeof this.maxStackPerSlot] ?? 1;
                if (this.slotCounts[i] < maxStack)
                {
                    this.slotCounts[i]++;
                    return true;
                }
                return false; // slot penuh stack
            }
        }

        // Slot kosong pertama.
        for (let i = 0; i < this.slotCount; i++)
        {
            if (this.slotCounts[i] === 0)
            {
                this.slotTypes[i] = type;
                this.slots[i] = [buff];
                this.slotCounts[i] = 1;
                return true;
            }
        }

        return false; // semua slot penuh
    }

    /** Pakai satu stack di slot indeks. Mengembalikan buff jika berhasil, null jika kosong. */
    public use(index: number): IPowerUpBuff | null
    {
        if (index < 0 || index >= this.slotCount)
        {
            return null;
        }
        if (this.slotCounts[index] === 0)
        {
            return null;
        }

        this.slotCounts[index]--;
        const buff = this.slots[index][this.slotCounts[index]];
        if (this.slotCounts[index] === 0)
        {
            this.slotTypes[index] = PowerUpBuffType.Nuke;
            this.slots[index] = [];
        }
        return buff;
    }

    /** Buang satu stack dari slot indeks (Ctrl+1/2/3). */
    public discard(index: number): void
    {
        if (index < 0 || index >= this.slotCount)
        {
            return;
        }
        this.slotCounts[index] = 0;
        this.slotTypes[index] = PowerUpBuffType.Nuke;
        this.slots[index] = [];
    }

    /** Slot mana yang menyimpan type tertentu. */
    public findSlot(type: PowerUpBuffType): number
    {
        for (let i = 0; i < this.slotCount; i++)
        {
            if (this.slotCounts[i] > 0 && this.slotTypes[i] === type)
            {
                return i;
            }
        }
        return -1;
    }

    /** Apakah slot penuh (semua ada stack). */
    public isFull(): boolean
    {
        for (let i = 0; i < this.slotCount; i++)
        {
            if (this.slotCounts[i] === 0)
            {
                return false;
            }
        }
        return true;
    }

    /** Reset semua slot ke kondisi awal. */
    public reset(): void
    {
        for (let i = 0; i < this.slotCount; i++)
        {
            this.slotCounts[i] = 0;
            this.slotTypes[i] = PowerUpBuffType.Nuke;
            this.slots[i] = [];
        }
    }
}
