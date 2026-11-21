export const GameEvents = {
    ENEMY_KILLED: 'enemy-killed',
    PLAYER_DIED: 'player-died',
    PLAYER_DAMAGED: 'player-damaged',
    /** Dipancarkan saat peluru musuh benar-benar mengenai pemain. */
    PLAYER_HIT: 'player-hit',
    /** Dipancarkan setelah bom membersihkan layar. */
    BOMB_USED: 'bomb-used',
    SCORE_CHANGED: 'score-changed',
    COMBO_CHANGED: 'combo-changed',
    GAME_OVER: 'game-over',
    /** Permintaan resume dari overlay pause. */
    PAUSE_RESUME: 'pause-resume',
    /** Dipancarkan saat pemain menyentuh item power-up. */
    POWER_UP_COLLECTED: 'power-up-collected',
    /** Dipancarkan saat pemain menggunakan power-up dari slot. */
    POWER_UP_USED: 'power-up-used',
    /** Dipancarkan saat pemain graze peluru musuh. */
    GRAZE: 'graze',
    /** Dipancarkan saat wave bersih (semua musuh wave selesai). */
    WAVE_CLEARED: 'wave-cleared',
    /** Dipancarkan setelah bahasa aktif divalidasi dan disimpan; pembawa data kode bahasa baru. */
    LANGUAGE_CHANGED: 'language-changed',
} as const;
