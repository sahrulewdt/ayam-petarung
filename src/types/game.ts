// Central TypeScript types for LFR game foundation

export type Element =
  | 'fire'
  | 'water'
  | 'nature'
  | 'lightning'
  | 'ice'
  | 'shadow'
  | 'light'
  | 'metal';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'divine';

export type ClassType = 'guardian' | 'warrior' | 'assassin' | 'mage' | 'support' | 'berserker';

export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  crit: number; // % chance (0-100)
  accuracy: number; // % (0-100)
  dodge: number; // % (0-100)
  energy: number;
  luck: number;
}

export interface GeneSet {
  geneA: string; // simplified representation (e.g., "DragonHead")
  geneB: string;
  geneC: string; // hidden
}

export interface Rooster {
  id: string;
  name?: string;
  element: Element;
  classType: ClassType;
  rarity: Rarity;
  level: number;
  stats: Stats;
  genes: GeneSet;
  runes?: string[];
  artifacts?: string[];
}
