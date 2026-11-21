/**
 * Konfigurasi sistem combo dan skor (single source of truth).
 * Semua angka di sini, tidak di-hardcode di logika.
 */
export const ComboScoreConfig = {
    /** Domain combo: timer, tier multiplier, batas tambahan combo per nuke. */
    combo: {
        /** Durasi timer combo, dalam milidetik. Di-refresh penuh tiap kill. */
        timerMs: 2000,

        /** Tier multiplier: combo minimal -> multiplier integer (150 = x1.5). */
        tiers: [
            { minCombo: 0,   mult: 100 },
            { minCombo: 10,  mult: 150 },
            { minCombo: 25,  mult: 200 },
            { minCombo: 50,  mult: 300 },
            { minCombo: 100, mult: 400 }
        ] as const,

        /** Batas tambahan combo per aktivasi nuke (cap, bukan total). */
        nukeComboCap: 50
    },

    /** Domain skor: basis per tier, nilai graze, bonus flat, skor flat. */
    score: {
        /** Basis skor per tier musuh. */
        base: {
            common: 10,
            elite: 50,
            boss: 500
        },

        /** Nilai skor per graze (dikali multiplier). */
        grazeValue: 5,

        /** Bonus flat untuk kill lewat laser (ditambah SETELAH pembulatan, TIDAK dikali multiplier). */
        bonusLaser: 20,

        /** Bonus flat untuk kill lewat ram/shield (ditambah SETELAH pembulatan, TIDAK dikali multiplier). */
        bonusRam: 20,

        /** Skor flat saat pickup item valid. */
        itemPickupScore: 5,

        /** Skor flat saat aktivasi buff dari slot. */
        buffActivateScore: 5
    },

    /** Rasio damage nuke per tier (berbasis max HP, bukan HP sekarang). */
    nukeRatio: {
        common: 1.0,
        elite: 0.75,
        boss: 0.25
    } as const
} as const;

/** Enum tier musuh (digunakan config & ScoreSystem). */
export type EnemyTier = 'common' | 'elite' | 'boss';

/** Enum sumber kill (digunakan ScoreSystem.registerKill). */
export type DamageSource = 'bullet' | 'laser' | 'ram' | 'nuke';

/** Tipe tier config untuk lookup. */
export type TierConfig = typeof ComboScoreConfig.score.base;

/** Tipe multiplier tier. */
export type MultiplierTier = { minCombo: number; mult: number };