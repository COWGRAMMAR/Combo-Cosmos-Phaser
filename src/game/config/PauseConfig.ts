/**
 * Nilai tampilan overlay pause.
 * Menu pause masih placeholder untuk verifikasi mekanisme pause.
 */
export const PauseConfig = {
    overlay: {
        color: 0x000000,
        alpha: 0.6
    },
    title: {
        text: 'PAUSED',
        fontFamily: 'Arial Black',
        fontSize: 72,
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 8,
        offsetY: -40
    },
    hint: {
        text: 'Klik untuk resume (TEMP)',
        fontFamily: 'Arial',
        fontSize: 28,
        color: '#cbd5e1',
        offsetY: 50
    }
} as const;
