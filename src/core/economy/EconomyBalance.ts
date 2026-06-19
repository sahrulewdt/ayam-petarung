import { GameConfig } from '../../config/GameConfig';
import { Rarity } from '../../types/game';

export function goldRewardForDefeat(level: number, rarity: Rarity): number {
  const base = GameConfig.economy.goldPerLevelBase * Math.max(1, level);
  const mult = GameConfig.economy.rarityMultiplier[rarity];
  return Math.round(base * mult);
}

export function breedingCost(rarityA: Rarity, rarityB: Rarity): { gold: number; crystal: number } {
  // Cost scales with parent rarities
  const rarityWeight: Record<Rarity, number> = {
    common: 1,
    rare: 1.2,
    epic: 1.6,
    legendary: 2.5,
    mythic: 6,
    divine: 20,
  };
  const weight = (rarityWeight[rarityA] + rarityWeight[rarityB]) / 2;
  return {
    gold: Math.round(GameConfig.breeding.costGoldBase * weight),
    crystal: Math.round(GameConfig.breeding.costCrystalBase * weight),
  };
}
