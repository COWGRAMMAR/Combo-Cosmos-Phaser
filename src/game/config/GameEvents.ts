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
} as const;
