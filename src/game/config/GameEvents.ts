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
} as const;
