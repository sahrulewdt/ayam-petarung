export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic' | 'Divine';
export type RoosterClass = 'Guardian' | 'Warrior' | 'Assassin' | 'Mage' | 'Support' | 'Berserker';
export type Element = 'Fire' | 'Water' | 'Nature' | 'Lightning' | 'Ice' | 'Shadow' | 'Light' | 'Metal';
export type EvolutionStage = 'Egg' | 'Chick' | 'Fighter' | 'Elite' | 'Legend' | 'Mythic' | 'Divine';

export interface RoosterStats {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  critical: number;
  accuracy: number;
  dodge: number;
  energy: number;
  luck: number;
}

export interface Skill {
  id: string;
  name: string;
  element: Element;
  damage: number;
  energyCost: number;
  effect?: string;
  description: string;
}

export interface BodyPart {
  head: string;
  beak: string;
  wings: string;
  legs: string;
  tail: string;
}

export interface Gene {
  dominant: string;
  recessive: string;
  hidden: string;
}

export interface Rooster {
  id: string;
  name: string;
  rarity: Rarity;
  class: RoosterClass;
  element: Element;
  level: number;
  evolutionStage: EvolutionStage;
  stats: RoosterStats;
  baseStats: RoosterStats;
  skills: Skill[];
  bodyParts: BodyPart;
  genes: { A: Gene; B: Gene; C: Gene };
  image?: string;
  acquiredAt: string;
  breedCount: number;
}

export interface Player {
  username: string;
  level: number;
  exp: number;
  maxExp: number;
  gold: number;
  crystal: number;
  gems: number;
  arenaRank: string;
  arenaPoints: number;
  wins: number;
  losses: number;
  guildName: string;
  guildLevel: number;
}

export interface Egg {
  id: string;
  parentA: string;
  parentB: string;
  hatchTime: number;
  startTime: number;
  rarity: Rarity;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  progress: number;
  total: number;
  reward: string;
  completed: boolean;
}
