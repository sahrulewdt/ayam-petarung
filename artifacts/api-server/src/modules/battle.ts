import { Router, type IRouter } from "express";
import { battleHistory, db, ranking, roosters, users } from "@workspace/db";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { ApiError, asyncHandler, parsePagination, validate } from "../lib/http";
import { battleModeSchema, rewardSchema, uuidSchema } from "./schemas";

const router: IRouter = Router();

const recordBattleSchema = z.object({
  mode: battleModeSchema,
  opponentName: z.string().trim().min(1).max(64),
  won: z.boolean(),
  teamRoosterIds: z.array(uuidSchema).min(1).max(3),
  rewards: rewardSchema,
});

function ratingDeltaFor(mode: string, won: boolean) {
  if (mode !== "arena") {
    return 0;
  }
  return won ? 25 : -10;
}

router.get(
  "/battles/history",
  requireAuth,
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const pagination = parsePagination(req.query);
    const rows = await db
      .select()
      .from(battleHistory)
      .where(eq(battleHistory.userId, req.user.id))
      .orderBy(desc(battleHistory.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);

    res.json({ data: rows, page: pagination.page, limit: pagination.limit });
  }),
);

router.post(
  "/battles",
  requireAuth,
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const body = validate(recordBattleSchema, req.body);
    const ownedTeam = await db
      .select({ id: roosters.id })
      .from(roosters)
      .where(and(eq(roosters.userId, req.user.id), inArray(roosters.id, body.teamRoosterIds)));

    if (ownedTeam.length !== body.teamRoosterIds.length) {
      throw new ApiError(400, "INVALID_TEAM", "All team roosters must belong to the authenticated player");
    }

    const ratingDelta = ratingDeltaFor(body.mode, body.won);
    const goldReward = body.rewards.gold ?? (body.won ? 500 : 100);
    const arenaPointsDelta = body.mode === "arena" ? ratingDelta : (body.rewards.arenaPoints ?? 0);

    const [history] = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(battleHistory)
        .values({
          userId: req.user.id,
          mode: body.mode,
          opponentName: body.opponentName,
          won: body.won,
          teamRoosterIds: body.teamRoosterIds,
          rewards: { ...body.rewards, gold: goldReward, arenaPoints: arenaPointsDelta },
          ratingDelta,
        })
        .returning();

      await tx
        .update(users)
        .set({
          wins: sql`${users.wins} + ${body.won ? 1 : 0}`,
          losses: sql`${users.losses} + ${body.won ? 0 : 1}`,
          gold: sql`${users.gold} + ${goldReward}`,
          crystal: sql`${users.crystal} + ${body.rewards.crystal ?? 0}`,
          gems: sql`${users.gems} + ${body.rewards.gems ?? 0}`,
          arenaPoints: sql`GREATEST(0, ${users.arenaPoints} + ${arenaPointsDelta})`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, req.user.id));

      await tx
        .insert(ranking)
        .values({
          userId: req.user.id,
          season: "current",
          rank: 1_000_000,
          points: Math.max(0, arenaPointsDelta),
          wins: body.won ? 1 : 0,
          losses: body.won ? 0 : 1,
        })
        .onConflictDoUpdate({
          target: [ranking.userId, ranking.season],
          set: {
            points: sql`GREATEST(0, ${ranking.points} + ${arenaPointsDelta})`,
            wins: sql`${ranking.wins} + ${body.won ? 1 : 0}`,
            losses: sql`${ranking.losses} + ${body.won ? 0 : 1}`,
            updatedAt: new Date(),
          },
        });

      return [created];
    });

    if (!history) {
      throw new ApiError(500, "BATTLE_RECORD_FAILED", "Unable to record battle");
    }

    res.status(201).json({ battle: history });
  }),
);

export default router;
