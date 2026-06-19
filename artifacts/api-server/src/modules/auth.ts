import { Router, type IRouter } from "express";
import { db, users } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { hashPassword, signJwt, verifyPassword } from "../lib/auth";
import { ApiError, asyncHandler, toPublicUser, validate } from "../lib/http";
import { rateLimit } from "../middlewares/rate-limit";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();

const registerSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

router.post(
  "/auth/register",
  rateLimit({ windowMs: 60_000, max: 10, keyPrefix: "auth-register" }),
  asyncHandler(async (req, res) => {
    const body = validate(registerSchema, req.body);
    const passwordHash = await hashPassword(body.password);

    try {
      const [user] = await db
        .insert(users)
        .values({
          username: body.username,
          email: body.email,
          passwordHash,
        })
        .returning();

      if (!user) {
        throw new ApiError(500, "USER_CREATE_FAILED", "Unable to create user");
      }

      const token = signJwt({ sub: user.id, username: user.username });
      res.status(201).json({ token, user: toPublicUser(user) });
    } catch (err) {
      if (err instanceof Error && err.message.includes("duplicate key")) {
        throw new ApiError(409, "USER_EXISTS", "Username or email is already registered");
      }
      throw err;
    }
  }),
);

router.post(
  "/auth/login",
  rateLimit({ windowMs: 60_000, max: 20, keyPrefix: "auth-login" }),
  asyncHandler(async (req, res) => {
    const body = validate(loginSchema, req.body);
    const [user] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${body.email}`)
      .limit(1);

    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    const token = signJwt({ sub: user.id, username: user.username });
    res.json({ token, user: toPublicUser(user) });
  }),
);

router.get(
  "/auth/me",
  requireAuth,
  asyncHandler<AuthenticatedRequest>(async (req, res) => {
    const [user] = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "User not found");
    }
    res.json({ user: toPublicUser(user) });
  }),
);

export default router;
