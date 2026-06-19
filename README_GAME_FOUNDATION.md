# LFR Game Foundation

This directory contains the initial game foundation for "Legends of the Fighting Rooster".

Files added in feat/game-foundation branch:

- src/types/game.ts — core types (Rooster, Stats, Genes, enums)
- src/config/GameConfig.ts — centralized tuning constants
- src/core/battle/BattleFormula.ts — hit/crit/damage & debuff helpers
- src/core/genetics/GeneticsEngine.ts — breeding logic with mutation
- src/core/economy/EconomyBalance.ts — reward & cost formulas
- src/core/rarity/RaritySystem.ts — rarity sampling
- src/entities/rooster/Rooster.ts — simple rooster factory & stat growth

Next steps you can ask me to do:

- Add unit tests for each formula and deterministic RNG support
- Expose a small CLI or REST endpoint to simulate battles and breedings
- Build UI components in the Next.js app to visualize roosters and breeding
- Add documentation / tuning dashboard for designers
