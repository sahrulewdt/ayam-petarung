import { Router, type IRouter } from "express";
import { db, users } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { ApiError, asyncHandler, toPublicUser, validate } from "../lib/http";

const router: IRouter = Router();

const updatePlayerSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/).optional(),
  guildName: z.string().trim().min(1).max(64).nullable().optional(),
});

router.get(
  "/player/profile",
  requireAuth,
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const [user] = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    if (!user) {
      throw new ApiError(404, "PLAYER_NOT_FOUND", "Player not found");
    }
    res.json({ player: toPublicUser(user) });
  }),
);

router.patch(
  "/player/profile",
  requireAuth,
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const body = validate(updatePlayerSchema, req.body);
    const [user] = await db
      .update(users)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(users.id, req.user.id))
      .returning();

    if (!user) {
      throw new ApiError(404, "PLAYER_NOT_FOUND", "Player not found");
    }

    res.json({ player: toPublicUser(user) });
  }),
);

export default router;
