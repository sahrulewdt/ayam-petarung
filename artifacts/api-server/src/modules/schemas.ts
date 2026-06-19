import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const raritySchema = z.enum(["Common", "Rare", "Epic", "Legendary", "Mythic", "Divine"]);
export const roosterClassSchema = z.enum(["Guardian", "Warrior", "Assassin", "Mage", "Support", "Berserker"]);
export const elementSchema = z.enum(["Fire", "Water", "Nature", "Lightning", "Ice", "Shadow", "Light", "Metal"]);
export const evolutionStageSchema = z.enum(["Egg", "Chick", "Fighter", "Elite", "Legend", "Mythic", "Divine"]);
export const battleModeSchema = z.enum(["story", "dungeon", "arena", "raid", "guild"]);
export const equipmentSlotSchema = z.enum(["Head", "Beak", "Wings", "Legs", "Tail", "Artifact"]);
export const inventoryItemTypeSchema = z.enum(["Currency", "Consumable", "Material", "Egg", "Equipment", "Ticket"]);
export const questTypeSchema = z.enum(["daily", "weekly", "story", "achievement"]);
export const questStatusSchema = z.enum(["active", "completed", "claimed", "expired"]);

export const statsSchema = z.object({
  hp: z.number().int().nonnegative(),
  attack: z.number().int().nonnegative(),
  defense: z.number().int().nonnegative(),
  speed: z.number().int().nonnegative(),
  critical: z.number().int().min(0).max(100),
  accuracy: z.number().int().min(0).max(100),
  dodge: z.number().int().min(0).max(100),
  energy: z.number().int().nonnegative(),
  luck: z.number().int().nonnegative(),
});

export const bodyPartsSchema = z.object({
  head: z.string().min(1),
  beak: z.string().min(1),
  wings: z.string().min(1),
  legs: z.string().min(1),
  tail: z.string().min(1),
});

const geneSchema = z.object({
  dominant: z.string().min(1),
  recessive: z.string().min(1),
  hidden: z.string().min(1),
});

export const genesSchema = z.object({
  A: geneSchema,
  B: geneSchema,
  C: geneSchema,
});

export const rewardSchema = z.object({
  gold: z.number().int().nonnegative().optional(),
  crystal: z.number().int().nonnegative().optional(),
  gems: z.number().int().nonnegative().optional(),
  arenaPoints: z.number().int().optional(),
  items: z.array(z.object({ itemKey: z.string().min(1), quantity: z.number().int().positive() })).optional(),
}).default({});
