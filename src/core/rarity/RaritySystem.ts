import { GameConfig } from '../../config/GameConfig';
import { Rarity } from '../../types/game';

export type RarityTable = Record<Rarity, number>;

export const BaseRarityTable: RarityTable = { ...GameConfig.rarity } as RarityTable;

export function sampleRarity(rng = Math.random): Rarity {
  const map = BaseRarityTable;
  const entries = Object.entries(map) as [Rarity, number][];
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const r = rng() * total;
  let accum = 0;
  for (const [rarity, weight] of entries) {
    accum += weight;
    if (r <= accum) return rarity;
  }
  return 'common';
}
