import { EffectType } from '../types/EffectType';

/** Callback yang dipanggil saat efek mulai atau berakhir. */
export interface EffectCallbacks
{
    onStart?: (type: EffectType) => void;
    onEnd?: (type: EffectType) => void;
}

/** Urutan tetap supaya update tidak membuat iterator baru tiap frame. */
const EFFECT_TYPES: readonly EffectType[] = [
    EffectType.FireRate,
    EffectType.Shield,
    EffectType.Laser
];

/**
 * Satu-satunya penghitung durasi efek.
 * Semua power-up berdurasi memakai sistem ini supaya pause dan reset konsisten.
 */
export class EffectManager
{
    private readonly callbacks: EffectCallbacks;

    private readonly remaining = new Map<EffectType, number>();

    /** Membuat slot kosong untuk setiap jenis efek. */
    constructor(callbacks: EffectCallbacks)
    {
        this.callbacks = callbacks;

        for (let i = 0; i < EFFECT_TYPES.length; i++)
        {
            this.remaining.set(EFFECT_TYPES[i], 0);
        }
    }

    /**
     * Menyalakan efek. Kalau efek sudah aktif, durasinya di-refresh
     * (tidak menumpuk) sesuai keputusan default fase ini.
     */
    public activate(type: EffectType, durationMs: number): void
    {
        if (durationMs <= 0)
        {
            return;
        }

        const wasActive = this.isActive(type);

        this.remaining.set(type, durationMs);

        if (!wasActive)
        {
            this.callbacks.onStart?.(type);
        }
    }

    /** Mematikan efek lebih awal, misalnya shield yang pecah karena tabrakan. */
    public stop(type: EffectType): void
    {
        if (!this.isActive(type))
        {
            return;
        }

        this.remaining.set(type, 0);
        this.callbacks.onEnd?.(type);
    }

    /** Mengurangi semua durasi. Ketika game dipause, jangan panggil update() supaya durasi berhenti. */
    public update(delta: number): void
    {
        for (let i = 0; i < EFFECT_TYPES.length; i++)
        {
            const type = EFFECT_TYPES[i];
            const remaining = this.remaining.get(type) ?? 0;

            if (remaining <= 0)
            {
                continue;
            }

            const next = remaining - delta;

            this.remaining.set(type, next > 0 ? next : 0);

            if (next <= 0)
            {
                this.callbacks.onEnd?.(type);
            }
        }
    }

    /** Pause semua durasi efek aktif. Dipanggil saat game pause. */
    public pauseAll(): void
    {
        // Pause dilakukan dengan tidak memanggil update() selama game pause.
        // Sisa durasi tetap tersimpan di Map, tidak berkurang.
    }

    /** Resume semua durasi efek aktif. Dipanggil saat game resume dari pause. */
    public resumeAll(): void
    {
        // Tidak perlu aksi khusus; update akan lanjut dari sisa durasi yang tersisa.
    }

    /** Mengecek apakah efek sedang aktif. */
    public isActive(type: EffectType): boolean
    {
        return (this.remaining.get(type) ?? 0) > 0;
    }



    /** Mematikan semua efek dan menjalankan callback akhirnya. */
    public reset(): void
    {
        for (let i = 0; i < EFFECT_TYPES.length; i++)
        {
            this.stop(EFFECT_TYPES[i]);
        }
    }
}
