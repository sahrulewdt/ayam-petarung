import type { NextFunction, Request, Response } from "express";
import { db, users } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyJwt } from "../lib/auth";
import { ApiError } from "../lib/http";

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    username: string;
  };
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.header("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
    if (!token) {
      throw new ApiError(401, "UNAUTHORIZED", "Authorization bearer token is required");
    }

    const payload = verifyJwt(token);
    const [user] = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user) {
      throw new ApiError(401, "UNAUTHORIZED", "User no longer exists");
    }

    (req as AuthenticatedRequest).user = user;
    next();
  } catch (err) {
    next(err);
  }
}
