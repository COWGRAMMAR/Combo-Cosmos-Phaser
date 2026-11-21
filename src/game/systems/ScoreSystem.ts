import {
    ComboScoreConfig,
    EnemyTier,
    DamageSource,
    MultiplierTier
} from '../config/ComboScoreConfig';

/**
 * Sistem combo dan skor murni (tanpa dependensi Phaser).
 * Menggunakan delta game (fixed timestep) untuk timer agar otomatis beku saat pause.
 */
export class ScoreSystem
{
    private readonly comboCfg = ComboScoreConfig.combo;
    private readonly scoreCfg = ComboScoreConfig.score;
    private readonly tiers: ReadonlyArray<MultiplierTier>;

    // State combo
    private _combo: number = 0;
    private _timerMs: number = 0;
    private _multiplier: number = 100; // integer, 150 = x1.5

    // State skor
    private _score: number = 0;

    // Batch mode (untuk nuke)
    private _batchActive: boolean = false;
    private _batchKills: EnemyTier[] = [];

    // Hit flag untuk bonus no-hit (nanti dipakai)
    private _hitThisWave: boolean = false;

    constructor()
    {
        this.tiers = this.comboCfg.tiers;
        this.reset();
    }

    /** Reset seluruh state untuk run baru. */
    public reset(): void
    {
        this._combo = 0;
        this._timerMs = 0;
        this._multiplier = 100;
        this._score = 0;
        this._batchActive = false;
        this._batchKills = [];
        this._hitThisWave = false;
    }

    /** Mulai mode batch (nuke). Tidak boleh dipanggil dua kali berturut-turut. */
    public beginBatch(): void
    {
        if (this._batchActive)
        {
            // Kesalahan pemanggil: tidak crash, tapi abaikan supaya tidak diam-diam salah.
            return;
        }
        this._batchActive = true;
        this._batchKills = [];
    }

    /** Akhiri mode batch dan hitung skor semua kill yang tertampung. */
    public endBatch(): void
    {
        if (!this._batchActive)
        {
            return;
        }

        const n = this._batchKills.length;

        if (n > 0)
        {
            // Tambah combo (cap per nuke)
            const added = Math.min(n, this.comboCfg.nukeComboCap);
            this._combo += added;

            // Update multiplier dari combo AKHIR
            this._updateMultiplier();

            // Hitung skor SEMUA kill pakai multiplier akhir
            const mult = this._multiplier;
            for (const tier of this._batchKills)
            {
                const base = this.scoreCfg.base[tier];
                this._score += this._scoreFor(base, mult);
            }

            // Refresh timer sekali
            this._timerMs = this.comboCfg.timerMs;
        }
        // n === 0: tidak ada perubahan combo/timer/skor

        this._batchActive = false;
        this._batchKills = [];
    }

    /** Daftarkan kill biasa (di luar batch). */
    public registerKill(tier: EnemyTier, source: DamageSource): void
    {
        if (this._batchActive)
        {
            // Di dalam batch: hanya tampung tier-nya
            this._batchKills.push(tier);
            return;
        }

        // Combo naik DULU
        this._combo += 1;

        // Update multiplier SETELAH combo naik
        this._updateMultiplier();

        // Hitung skor dengan multiplier baru
        const base = this.scoreCfg.base[tier];
        let gained = this._scoreFor(base, this._multiplier);

        // Bonus flat (laser/ram) ditambah SETELAH pembulatan, TIDAK dikali multiplier
        if (source === 'laser')
        {
            gained += this.scoreCfg.bonusLaser;
        }
        else if (source === 'ram')
        {
            gained += this.scoreCfg.bonusRam;
        }

        this._score += gained;

        // Refresh timer penuh
        this._timerMs = this.comboCfg.timerMs;
    }

    /** Daftarkan graze: tambah skor, combo & timer TIDAK berubah. */
    public addGraze(): void
    {
        const gained = this._scoreFor(this.scoreCfg.grazeValue, this._multiplier);
        this._score += gained;
    }

    /** Tambah skor flat (item pickup, buff activation). Tanpa multiplier, tanpa ubah combo. */
    public addFlat(amount: number): void
    {
        this._score += amount;
    }

    /** Player kena hit: combo reset ke 0, timer berhenti. Skor TIDAK berkurang. */
    public onPlayerHit(): void
    {
        this._combo = 0;
        this._timerMs = 0;
        this._updateMultiplier(); // balik ke x1
        this._hitThisWave = true;
    }

    /** Update timer combo per fixed step. Dipanggil dari Game.update fixed-step loop. */
    public update(deltaMs: number): void
    {
        if (this._combo === 0)
        {
            // Timer tidak jalan saat combo 0
            this._timerMs = 0;
            return;
        }

        this._timerMs -= deltaMs;

        if (this._timerMs <= 0)
        {
            this._timerMs = 0;
            this._combo = 0;
            this._updateMultiplier();
        }
    }

    /** Tandai wave baru (reset flag hit untuk bonus no-hit nanti). */
    public onWaveStart(): void
    {
        this._hitThisWave = false;
    }

    /** Hitung skor: base * mult / 100 dibulatkan ke atas, pakai integer math. */
    private _scoreFor(base: number, mult: number): number
    {
        // Math.floor((base * mult + 99) / 100) === ceil(base * mult / 100)
        return Math.floor((base * mult + 99) / 100);
    }

    /** Update multiplier berdasarkan combo saat ini. */
    private _updateMultiplier(): void
    {
        let mult = 100;
        for (const tier of this.tiers)
        {
            if (this._combo >= tier.minCombo)
            {
                mult = tier.mult;
            }
            else
            {
                break;
            }
        }
        this._multiplier = mult;
    }

    // --- Getter read-only untuk HUD ---

    public get score(): number
    {
        return this._score;
    }

    public get combo(): number
    {
        return this._combo;
    }

    public get multiplier(): number
    {
        return this._multiplier;
    }

    /** Sisa timer sebagai ratio 0..1 (untuk progress bar HUD). */
    public get comboTimerRatio(): number
    {
        if (this._combo === 0)
        {
            return 0;
        }
        return Math.max(0, this._timerMs / this.comboCfg.timerMs);
    }

    /** Apakah sedang dalam mode batch. */
    public get isBatchActive(): boolean
    {
        return this._batchActive;
    }

    /** Apakah player pernah kena hit di wave ini (untuk bonus no-hit). */
    public get hitThisWave(): boolean
    {
        return this._hitThisWave;
    }
}