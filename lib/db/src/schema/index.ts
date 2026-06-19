import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const rarityEnum = pgEnum("rarity", [
  "Common",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
  "Divine",
]);

export const roosterClassEnum = pgEnum("rooster_class", [
  "Guardian",
  "Warrior",
  "Assassin",
  "Mage",
  "Support",
  "Berserker",
]);

export const elementEnum = pgEnum("element", [
  "Fire",
  "Water",
  "Nature",
  "Lightning",
  "Ice",
  "Shadow",
  "Light",
  "Metal",
]);

export const evolutionStageEnum = pgEnum("evolution_stage", [
  "Egg",
  "Chick",
  "Fighter",
  "Elite",
  "Legend",
  "Mythic",
  "Divine",
]);

export const equipmentSlotEnum = pgEnum("equipment_slot", [
  "Head",
  "Beak",
  "Wings",
  "Legs",
  "Tail",
  "Artifact",
]);

export const inventoryItemTypeEnum = pgEnum("inventory_item_type", [
  "Currency",
  "Consumable",
  "Material",
  "Egg",
  "Equipment",
  "Ticket",
]);

export const battleModeEnum = pgEnum("battle_mode", [
  "story",
  "dungeon",
  "arena",
  "raid",
  "guild",
]);

export const questTypeEnum = pgEnum("quest_type", [
  "daily",
  "weekly",
  "story",
  "achievement",
]);

export const questStatusEnum = pgEnum("quest_status", [
  "active",
  "completed",
  "claimed",
  "expired",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    username: text("username").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    level: integer("level").notNull().default(1),
    exp: integer("exp").notNull().default(0),
    maxExp: integer("max_exp").notNull().default(1000),
    gold: integer("gold").notNull().default(1000),
    crystal: integer("crystal").notNull().default(0),
    gems: integer("gems").notNull().default(0),
    arenaRank: text("arena_rank").notNull().default("Bronze"),
    arenaPoints: integer("arena_points").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    guildName: text("guild_name"),
    guildLevel: integer("guild_level").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(sql`lower(${table.email})`),
    uniqueIndex("users_username_unique").on(sql`lower(${table.username})`),
    check("users_level_positive", sql`${table.level} > 0`),
    check("users_balances_non_negative", sql`${table.gold} >= 0 AND ${table.crystal} >= 0 AND ${table.gems} >= 0`),
  ],
);

export const skills = pgTable(
  "skills",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull(),
    name: text("name").notNull(),
    element: elementEnum("element").notNull(),
    damage: integer("damage").notNull().default(0),
    energyCost: integer("energy_cost").notNull().default(0),
    effect: text("effect"),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("skills_key_unique").on(table.key),
    index("skills_element_idx").on(table.element),
    check("skills_damage_non_negative", sql`${table.damage} >= 0`),
    check("skills_energy_cost_non_negative", sql`${table.energyCost} >= 0`),
  ],
);

export const roosters = pgTable(
  "roosters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    rarity: rarityEnum("rarity").notNull().default("Common"),
    class: roosterClassEnum("class").notNull(),
    element: elementEnum("element").notNull(),
    level: integer("level").notNull().default(1),
    evolutionStage: evolutionStageEnum("evolution_stage").notNull().default("Chick"),
    stats: jsonb("stats").notNull(),
    baseStats: jsonb("base_stats").notNull(),
    bodyParts: jsonb("body_parts").notNull(),
    genes: jsonb("genes").notNull(),
    image: text("image"),
    acquiredAt: timestamp("acquired_at", { withTimezone: true }).notNull().defaultNow(),
    breedCount: integer("breed_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("roosters_user_idx").on(table.userId),
    index("roosters_user_rarity_idx").on(table.userId, table.rarity),
    index("roosters_user_level_idx").on(table.userId, table.level),
    check("roosters_level_positive", sql`${table.level} > 0`),
    check("roosters_breed_count_non_negative", sql`${table.breedCount} >= 0`),
  ],
);

export const roosterSkills = pgTable(
  "rooster_skills",
  {
    roosterId: uuid("rooster_id").notNull().references(() => roosters.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id").notNull().references(() => skills.id, { onDelete: "restrict" }),
    slot: integer("slot").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.roosterId, table.skillId] }),
    uniqueIndex("rooster_skills_slot_unique").on(table.roosterId, table.slot),
    check("rooster_skills_slot_range", sql`${table.slot} >= 1 AND ${table.slot} <= 4`),
  ],
);

export const eggs = pgTable(
  "eggs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    parentAId: uuid("parent_a_id").notNull().references(() => roosters.id, { onDelete: "restrict" }),
    parentBId: uuid("parent_b_id").notNull().references(() => roosters.id, { onDelete: "restrict" }),
    hatchAt: timestamp("hatch_at", { withTimezone: true }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    rarity: rarityEnum("rarity").notNull(),
    claimed: boolean("claimed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("eggs_user_idx").on(table.userId),
    index("eggs_hatch_at_idx").on(table.hatchAt),
    check("eggs_distinct_parents", sql`${table.parentAId} <> ${table.parentBId}`),
  ],
);

export const equipment = pgTable(
  "equipment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    roosterId: uuid("rooster_id").references(() => roosters.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    slot: equipmentSlotEnum("slot").notNull(),
    rarity: rarityEnum("rarity").notNull().default("Common"),
    level: integer("level").notNull().default(1),
    bonuses: jsonb("bonuses").notNull(),
    equipped: boolean("equipped").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("equipment_user_idx").on(table.userId),
    index("equipment_rooster_idx").on(table.roosterId),
    check("equipment_level_positive", sql`${table.level} > 0`),
  ],
);

export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    itemKey: text("item_key").notNull(),
    itemType: inventoryItemTypeEnum("item_type").notNull(),
    name: text("name").notNull(),
    quantity: integer("quantity").notNull().default(0),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("inventory_user_item_unique").on(table.userId, table.itemKey),
    index("inventory_user_type_idx").on(table.userId, table.itemType),
    check("inventory_quantity_non_negative", sql`${table.quantity} >= 0`),
  ],
);

export const battleHistory = pgTable(
  "battle_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    mode: battleModeEnum("mode").notNull(),
    opponentName: text("opponent_name").notNull(),
    won: boolean("won").notNull(),
    teamRoosterIds: jsonb("team_rooster_ids").notNull(),
    rewards: jsonb("rewards").notNull().default({}),
    ratingDelta: integer("rating_delta").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("battle_history_user_created_idx").on(table.userId, table.createdAt),
    index("battle_history_user_mode_idx").on(table.userId, table.mode),
  ],
);

export const quests = pgTable(
  "quests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    type: questTypeEnum("type").notNull().default("daily"),
    status: questStatusEnum("status").notNull().default("active"),
    progress: integer("progress").notNull().default(0),
    total: integer("total").notNull(),
    reward: jsonb("reward").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("quests_user_key_unique").on(table.userId, table.key),
    index("quests_user_status_idx").on(table.userId, table.status),
    check("quests_progress_non_negative", sql`${table.progress} >= 0`),
    check("quests_total_positive", sql`${table.total} > 0`),
  ],
);

export const ranking = pgTable(
  "ranking",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    season: text("season").notNull(),
    rank: integer("rank").notNull(),
    points: integer("points").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ranking_user_season_unique").on(table.userId, table.season),
    uniqueIndex("ranking_season_rank_unique").on(table.season, table.rank),
    index("ranking_season_points_idx").on(table.season, table.points),
    check("ranking_rank_positive", sql`${table.rank} > 0`),
    check("ranking_points_non_negative", sql`${table.points} >= 0`),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  roosters: many(roosters),
  eggs: many(eggs),
  equipment: many(equipment),
  inventory: many(inventory),
  battleHistory: many(battleHistory),
  quests: many(quests),
  rankings: many(ranking),
}));

export const roostersRelations = relations(roosters, ({ one, many }) => ({
  user: one(users, { fields: [roosters.userId], references: [users.id] }),
  skills: many(roosterSkills),
  equipment: many(equipment),
  parentAEggs: many(eggs, { relationName: "parentAEggs" }),
  parentBEggs: many(eggs, { relationName: "parentBEggs" }),
}));

export const skillsRelations = relations(skills, ({ many }) => ({
  roosters: many(roosterSkills),
}));

export const roosterSkillsRelations = relations(roosterSkills, ({ one }) => ({
  rooster: one(roosters, { fields: [roosterSkills.roosterId], references: [roosters.id] }),
  skill: one(skills, { fields: [roosterSkills.skillId], references: [skills.id] }),
}));

export const eggsRelations = relations(eggs, ({ one }) => ({
  user: one(users, { fields: [eggs.userId], references: [users.id] }),
  parentA: one(roosters, { fields: [eggs.parentAId], references: [roosters.id], relationName: "parentAEggs" }),
  parentB: one(roosters, { fields: [eggs.parentBId], references: [roosters.id], relationName: "parentBEggs" }),
}));

export const equipmentRelations = relations(equipment, ({ one }) => ({
  user: one(users, { fields: [equipment.userId], references: [users.id] }),
  rooster: one(roosters, { fields: [equipment.roosterId], references: [roosters.id] }),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  user: one(users, { fields: [inventory.userId], references: [users.id] }),
}));

export const battleHistoryRelations = relations(battleHistory, ({ one }) => ({
  user: one(users, { fields: [battleHistory.userId], references: [users.id] }),
}));

export const questsRelations = relations(quests, ({ one }) => ({
  user: one(users, { fields: [quests.userId], references: [users.id] }),
}));

export const rankingRelations = relations(ranking, ({ one }) => ({
  user: one(users, { fields: [ranking.userId], references: [users.id] }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertRoosterSchema = createInsertSchema(roosters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  acquiredAt: true,
});
export const insertEggSchema = createInsertSchema(eggs).omit({ id: true, createdAt: true });
export const insertSkillSchema = createInsertSchema(skills).omit({ id: true, createdAt: true });
export const insertEquipmentSchema = createInsertSchema(equipment).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertBattleHistorySchema = createInsertSchema(battleHistory).omit({
  id: true,
  createdAt: true,
});
export const insertQuestSchema = createInsertSchema(quests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertRankingSchema = createInsertSchema(ranking).omit({
  id: true,
  updatedAt: true,
});

export type User = typeof users.$inferSelect;
export type NewUser = z.infer<typeof insertUserSchema>;
export type Rooster = typeof roosters.$inferSelect;
export type NewRooster = z.infer<typeof insertRoosterSchema>;
export type Egg = typeof eggs.$inferSelect;
export type NewEgg = z.infer<typeof insertEggSchema>;
export type Skill = typeof skills.$inferSelect;
export type Equipment = typeof equipment.$inferSelect;
export type InventoryItem = typeof inventory.$inferSelect;
export type BattleHistory = typeof battleHistory.$inferSelect;
export type Quest = typeof quests.$inferSelect;
export type Ranking = typeof ranking.$inferSelect;
