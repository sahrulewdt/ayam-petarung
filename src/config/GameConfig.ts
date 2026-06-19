// Centralized balance config and tuning constants for LFR

export const GameConfig = {
  // Battle
  energy: {
    max: 10,
    start: 3,
    perRound: 2,
  },
  turn: {
    maxTeamSize: 3,
  },

  // Breeding
  breeding: {
    costGoldBase: 500,
    costCrystalBase: 2,
    cooldownHours: 24,
    inheritance: {
      father: 0.4,
      mother: 0.4,
      mutation: 0.2,
    },
    mutationRarityBoostChance: 0.02, // 2% chance to increase rarity tier on mutation
  },

  // Rarity base probabilities for hatches / drops
  rarity: {
    common: 0.5,
    rare: 0.28,
    epic: 0.14,
    legendary: 0.06,
    mythic: 0.019,
    divine: 0.001,
  },

  // Economy
  economy: {
    goldPerLevelBase: 50,
    rarityMultiplier: {
      common: 1,
      rare: 1.5,
      epic: 3,
      legendary: 8,
      mythic: 20,
      divine: 100,
    },
  },

  // Combat math tuning
  combat: {
    critMultiplier: 1.75,
    minDamage: 1,
    defenseEffectiveness: 0.6, // how much defense reduces incoming physical damage
    elementalEffectiveness: 1.25, // bonus multiplier when element is strong vs target
    dodgeSoftcap: 75, // % where returns diminish
  },
};
