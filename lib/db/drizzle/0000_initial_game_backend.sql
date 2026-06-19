CREATE TYPE "rarity" AS ENUM ('Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Divine');
CREATE TYPE "rooster_class" AS ENUM ('Guardian', 'Warrior', 'Assassin', 'Mage', 'Support', 'Berserker');
CREATE TYPE "element" AS ENUM ('Fire', 'Water', 'Nature', 'Lightning', 'Ice', 'Shadow', 'Light', 'Metal');
CREATE TYPE "evolution_stage" AS ENUM ('Egg', 'Chick', 'Fighter', 'Elite', 'Legend', 'Mythic', 'Divine');
CREATE TYPE "equipment_slot" AS ENUM ('Head', 'Beak', 'Wings', 'Legs', 'Tail', 'Artifact');
CREATE TYPE "inventory_item_type" AS ENUM ('Currency', 'Consumable', 'Material', 'Egg', 'Equipment', 'Ticket');
CREATE TYPE "battle_mode" AS ENUM ('story', 'dungeon', 'arena', 'raid', 'guild');
CREATE TYPE "quest_type" AS ENUM ('daily', 'weekly', 'story', 'achievement');
CREATE TYPE "quest_status" AS ENUM ('active', 'completed', 'claimed', 'expired');

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "username" text NOT NULL,
  "email" text NOT NULL,
  "password_hash" text NOT NULL,
  "level" integer DEFAULT 1 NOT NULL,
  "exp" integer DEFAULT 0 NOT NULL,
  "max_exp" integer DEFAULT 1000 NOT NULL,
  "gold" integer DEFAULT 1000 NOT NULL,
  "crystal" integer DEFAULT 0 NOT NULL,
  "gems" integer DEFAULT 0 NOT NULL,
  "arena_rank" text DEFAULT 'Bronze' NOT NULL,
  "arena_points" integer DEFAULT 0 NOT NULL,
  "wins" integer DEFAULT 0 NOT NULL,
  "losses" integer DEFAULT 0 NOT NULL,
  "guild_name" text,
  "guild_level" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "users_level_positive" CHECK ("users"."level" > 0),
  CONSTRAINT "users_balances_non_negative" CHECK ("users"."gold" >= 0 AND "users"."crystal" >= 0 AND "users"."gems" >= 0)
);

CREATE TABLE "skills" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "key" text NOT NULL,
  "name" text NOT NULL,
  "element" "element" NOT NULL,
  "damage" integer DEFAULT 0 NOT NULL,
  "energy_cost" integer DEFAULT 0 NOT NULL,
  "effect" text,
  "description" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "skills_damage_non_negative" CHECK ("skills"."damage" >= 0),
  CONSTRAINT "skills_energy_cost_non_negative" CHECK ("skills"."energy_cost" >= 0)
);

CREATE TABLE "roosters" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "rarity" "rarity" DEFAULT 'Common' NOT NULL,
  "class" "rooster_class" NOT NULL,
  "element" "element" NOT NULL,
  "level" integer DEFAULT 1 NOT NULL,
  "evolution_stage" "evolution_stage" DEFAULT 'Chick' NOT NULL,
  "stats" jsonb NOT NULL,
  "base_stats" jsonb NOT NULL,
  "body_parts" jsonb NOT NULL,
  "genes" jsonb NOT NULL,
  "image" text,
  "acquired_at" timestamp with time zone DEFAULT now() NOT NULL,
  "breed_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "roosters_level_positive" CHECK ("roosters"."level" > 0),
  CONSTRAINT "roosters_breed_count_non_negative" CHECK ("roosters"."breed_count" >= 0)
);

CREATE TABLE "rooster_skills" (
  "rooster_id" uuid NOT NULL REFERENCES "roosters"("id") ON DELETE cascade,
  "skill_id" uuid NOT NULL REFERENCES "skills"("id") ON DELETE restrict,
  "slot" integer NOT NULL,
  CONSTRAINT "rooster_skills_rooster_id_skill_id_pk" PRIMARY KEY("rooster_id","skill_id"),
  CONSTRAINT "rooster_skills_slot_range" CHECK ("rooster_skills"."slot" >= 1 AND "rooster_skills"."slot" <= 4)
);

CREATE TABLE "eggs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "parent_a_id" uuid NOT NULL REFERENCES "roosters"("id") ON DELETE restrict,
  "parent_b_id" uuid NOT NULL REFERENCES "roosters"("id") ON DELETE restrict,
  "hatch_at" timestamp with time zone NOT NULL,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "rarity" "rarity" NOT NULL,
  "claimed" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "eggs_distinct_parents" CHECK ("eggs"."parent_a_id" <> "eggs"."parent_b_id")
);

CREATE TABLE "equipment" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "rooster_id" uuid REFERENCES "roosters"("id") ON DELETE set null,
  "name" text NOT NULL,
  "slot" "equipment_slot" NOT NULL,
  "rarity" "rarity" DEFAULT 'Common' NOT NULL,
  "level" integer DEFAULT 1 NOT NULL,
  "bonuses" jsonb NOT NULL,
  "equipped" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "equipment_level_positive" CHECK ("equipment"."level" > 0)
);

CREATE TABLE "inventory" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "item_key" text NOT NULL,
  "item_type" "inventory_item_type" NOT NULL,
  "name" text NOT NULL,
  "quantity" integer DEFAULT 0 NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "inventory_quantity_non_negative" CHECK ("inventory"."quantity" >= 0)
);

CREATE TABLE "battle_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "mode" "battle_mode" NOT NULL,
  "opponent_name" text NOT NULL,
  "won" boolean NOT NULL,
  "team_rooster_ids" jsonb NOT NULL,
  "rewards" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "rating_delta" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "quests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "key" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "type" "quest_type" DEFAULT 'daily' NOT NULL,
  "status" "quest_status" DEFAULT 'active' NOT NULL,
  "progress" integer DEFAULT 0 NOT NULL,
  "total" integer NOT NULL,
  "reward" jsonb NOT NULL,
  "expires_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "quests_progress_non_negative" CHECK ("quests"."progress" >= 0),
  CONSTRAINT "quests_total_positive" CHECK ("quests"."total" > 0)
);

CREATE TABLE "ranking" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "season" text NOT NULL,
  "rank" integer NOT NULL,
  "points" integer DEFAULT 0 NOT NULL,
  "wins" integer DEFAULT 0 NOT NULL,
  "losses" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ranking_rank_positive" CHECK ("ranking"."rank" > 0),
  CONSTRAINT "ranking_points_non_negative" CHECK ("ranking"."points" >= 0)
);

CREATE UNIQUE INDEX "users_email_unique" ON "users" (lower("email"));
CREATE UNIQUE INDEX "users_username_unique" ON "users" (lower("username"));
CREATE UNIQUE INDEX "skills_key_unique" ON "skills" ("key");
CREATE INDEX "skills_element_idx" ON "skills" ("element");
CREATE INDEX "roosters_user_idx" ON "roosters" ("user_id");
CREATE INDEX "roosters_user_rarity_idx" ON "roosters" ("user_id", "rarity");
CREATE INDEX "roosters_user_level_idx" ON "roosters" ("user_id", "level");
CREATE UNIQUE INDEX "rooster_skills_slot_unique" ON "rooster_skills" ("rooster_id", "slot");
CREATE INDEX "eggs_user_idx" ON "eggs" ("user_id");
CREATE INDEX "eggs_hatch_at_idx" ON "eggs" ("hatch_at");
CREATE INDEX "equipment_user_idx" ON "equipment" ("user_id");
CREATE INDEX "equipment_rooster_idx" ON "equipment" ("rooster_id");
CREATE UNIQUE INDEX "inventory_user_item_unique" ON "inventory" ("user_id", "item_key");
CREATE INDEX "inventory_user_type_idx" ON "inventory" ("user_id", "item_type");
CREATE INDEX "battle_history_user_created_idx" ON "battle_history" ("user_id", "created_at");
CREATE INDEX "battle_history_user_mode_idx" ON "battle_history" ("user_id", "mode");
CREATE UNIQUE INDEX "quests_user_key_unique" ON "quests" ("user_id", "key");
CREATE INDEX "quests_user_status_idx" ON "quests" ("user_id", "status");
CREATE UNIQUE INDEX "ranking_user_season_unique" ON "ranking" ("user_id", "season");
CREATE UNIQUE INDEX "ranking_season_rank_unique" ON "ranking" ("season", "rank");
CREATE INDEX "ranking_season_points_idx" ON "ranking" ("season", "points");
