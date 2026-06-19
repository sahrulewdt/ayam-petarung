import { Router, type IRouter } from "express";
import { db, roosters, roosterSkills, skills } from "@workspace/db";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { ApiError, asyncHandler, parsePagination, validate } from "../lib/http";
import {
  bodyPartsSchema,
  elementSchema,
  evolutionStageSchema,
  genesSchema,
  raritySchema,
  roosterClassSchema,
  statsSchema,
  uuidSchema,
} from "./schemas";

const router: IRouter = Router();

const createRoosterSchema = z.object({
  name: z.string().trim().min(2).max(48),
  rarity: raritySchema.default("Common"),
  class: roosterClassSchema,
  element: elementSchema,
  level: z.number().int().positive().default(1),
  evolutionStage: evolutionStageSchema.default("Chick"),
  stats: statsSchema,
  baseStats: statsSchema,
  bodyParts: bodyPartsSchema,
  genes: genesSchema,
  image: z.string().trim().max(64).optional(),
  skillIds: z.array(uuidSchema).max(4).default([]),
});

const updateRoosterSchema = createRoosterSchema.partial().omit({ skillIds: true }).extend({
  skillIds: z.array(uuidSchema).max(4).optional(),
});

async function getRoosterWithSkills(userId: string, roosterId: string) {
  const [rooster] = await db
    .select()
    .from(roosters)
    .where(and(eq(roosters.id, roosterId), eq(roosters.userId, userId)))
    .limit(1);

  if (!rooster) {
    return undefined;
  }

  const roosterSkillRows = await db
    .select({ slot: roosterSkills.slot, skill: skills })
    .from(roosterSkills)
    .innerJoin(skills, eq(roosterSkills.skillId, skills.id))
    .where(eq(roosterSkills.roosterId, rooster.id))
    .orderBy(roosterSkills.slot);

  return {
    ...rooster,
    skills: roosterSkillRows.map((row) => row.skill),
  };
}

async function replaceRoosterSkills(roosterId: string, skillIds: string[]) {
  await db.delete(roosterSkills).where(eq(roosterSkills.roosterId, roosterId));
  if (skillIds.length === 0) {
    return;
  }

  const existing = await db.select({ id: skills.id }).from(skills).where(inArray(skills.id, skillIds));
  if (existing.length !== skillIds.length) {
    throw new ApiError(400, "INVALID_SKILL", "One or more skills do not exist");
  }

  await db.insert(roosterSkills).values(
    skillIds.map((skillId, index) => ({
      roosterId,
      skillId,
      slot: index + 1,
    })),
  );
}

router.get(
  "/roosters",
  requireAuth,
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const pagination = parsePagination(req.query);
    const rarity = typeof req.query["rarity"] === "string" ? req.query["rarity"] : undefined;
    const where = rarity
      ? and(eq(roosters.userId, req.user.id), eq(roosters.rarity, validate(raritySchema, rarity)))
      : eq(roosters.userId, req.user.id);

    const rows = await db
      .select()
      .from(roosters)
      .where(where)
      .orderBy(desc(roosters.level), desc(roosters.acquiredAt))
      .limit(pagination.limit)
      .offset(pagination.offset);

    res.json({ data: rows, page: pagination.page, limit: pagination.limit });
  }),
);

router.post(
  "/roosters",
  requireAuth,
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const body = validate(createRoosterSchema, req.body);
    const [created] = await db
      .insert(roosters)
      .values({
        userId: req.user.id,
        name: body.name,
        rarity: body.rarity,
        class: body.class,
        element: body.element,
        level: body.level,
        evolutionStage: body.evolutionStage,
        stats: body.stats,
        baseStats: body.baseStats,
        bodyParts: body.bodyParts,
        genes: body.genes,
        image: body.image,
      })
      .returning();

    if (!created) {
      throw new ApiError(500, "ROOSTER_CREATE_FAILED", "Unable to create rooster");
    }

    await replaceRoosterSkills(created.id, body.skillIds);
    res.status(201).json({ rooster: await getRoosterWithSkills(req.user.id, created.id) });
  }),
);

router.get(
  "/roosters/:id",
  requireAuth,
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const id = validate(uuidSchema, req.params["id"]);
    const rooster = await getRoosterWithSkills(req.user.id, id);
    if (!rooster) {
      throw new ApiError(404, "ROOSTER_NOT_FOUND", "Rooster not found");
    }
    res.json({ rooster });
  }),
);

router.patch(
  "/roosters/:id",
  requireAuth,
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const id = validate(uuidSchema, req.params["id"]);
    const body = validate(updateRoosterSchema, req.body);
    const { skillIds, ...updates } = body;

    const [updated] = await db
      .update(roosters)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(roosters.id, id), eq(roosters.userId, req.user.id)))
      .returning();

    if (!updated) {
      throw new ApiError(404, "ROOSTER_NOT_FOUND", "Rooster not found");
    }

    if (skillIds) {
      await replaceRoosterSkills(id, skillIds);
    }

    res.json({ rooster: await getRoosterWithSkills(req.user.id, id) });
  }),
);

router.delete(
  "/roosters/:id",
  requireAuth,
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const id = validate(uuidSchema, req.params["id"]);
    const deleted = await db
      .delete(roosters)
      .where(and(eq(roosters.id, id), eq(roosters.userId, req.user.id)))
      .returning({ id: roosters.id });

    if (deleted.length === 0) {
      throw new ApiError(404, "ROOSTER_NOT_FOUND", "Rooster not found");
    }

    res.status(204).send();
  }),
);

router.get(
  "/skills",
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(skills).orderBy(sql`${skills.name} asc`);
    res.json({ data: rows });
  }),
);

export default router;
