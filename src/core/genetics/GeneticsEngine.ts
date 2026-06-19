import { Rooster, GeneSet, Rarity } from '../../types/game';
import { GameConfig } from '../../config/GameConfig';

/**
 * Genetics and Breeding Engine (simplified):
 * - Combine parents' genes with probabilities
 * - Support Dominant / Recessive / Hidden via tags in gene string (caller can encode)
 * - Mutation chance and rarity mutation
 */

export interface BreedingResult {
  childGenes: GeneSet;
  childRarity: Rarity;
  mutation: boolean;
}

function pickParentGene(pFather: string, pMother: string, rng = Math.random): string {
  // 40% father, 40% mother, 20% mutation (placeholder)
  const r = rng();
  if (r < GameConfig.breeding.inheritance.father) return pFather;
  if (r < GameConfig.breeding.inheritance.father + GameConfig.breeding.inheritance.mother) return pMother;
  // mutation: produce a synthetic gene token
  return `mut_${Math.random().toString(36).slice(2, 7)}`;
}

export function breed(father: Rooster, mother: Rooster, rng = Math.random): BreedingResult {
  const geneA = pickParentGene(father.genes.geneA, mother.genes.geneA, rng);
  const geneB = pickParentGene(father.genes.geneB, mother.genes.geneB, rng);
  const geneC = pickParentGene(father.genes.geneC, mother.genes.geneC, rng);

  // Determine mutation flag if any gene starts with mut_
  const mutation = [geneA, geneB, geneC].some((g) => g.startsWith('mut_'));

  // Rarity base: start from parents average and possibly mutate up
  const rarityOrder: Rarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic', 'divine'];
  const fatherIdx = rarityOrder.indexOf(father.rarity);
  const motherIdx = rarityOrder.indexOf(mother.rarity);
  const avg = Math.round((fatherIdx + motherIdx) / 2);
  let childIdx = avg;

  if (mutation && rng() < GameConfig.breeding.mutationRarityBoostChance) {
    childIdx = Math.min(rarityOrder.length - 1, childIdx + 1);
  }

  const childRarity = rarityOrder[childIdx];

  return {
    childGenes: { geneA, geneB, geneC },
    childRarity,
    mutation,
  };
}
