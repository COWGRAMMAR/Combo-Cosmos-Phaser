import type { Team } from './Team';

export interface EntityConfig
{
    team: Team;
    maxHp?: number;
    moveSpeed: number;
    bodyRadius?: number;
}
