import { Rooster, Stats } from '../../types/game';

/**
 * Minimal Rooster entity implementation with stat helpers
 */

export function createBaseStats(level: number): Stats {
  // Simple growth curve
  const hp = 100 + level * 25;
  const attack = 10 + level * 4;
  const defense = 8 + level * 3;
  const speed = 10 + Math.floor(level * 1.2);
  const crit = Math.min(50, 5 + level * 0.5);
  const accuracy = Math.min(95, 70 + level * 0.4);
  const dodge = Math.min(60, 5 + level * 0.3);
  const energy = 3;
  const luck = Math.min(100, level);

  return { hp, attack, defense, speed, crit, accuracy, dodge, energy, luck };
}

export function createRoosterSkeleton(id: string, name: string, level = 1): Rooster {
  return {
    id,
    name,
    element: 'nature',
    classType: 'warrior',
    rarity: 'common',
    level,
    stats: createBaseStats(level),
    genes: { geneA: 'defaultA', geneB: 'defaultB', geneC: 'defaultC' },
    runes: [],
    artifacts: [],
  };
}
