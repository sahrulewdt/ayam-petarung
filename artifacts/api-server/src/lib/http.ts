import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodSchema } from "zod";

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function asyncHandler<TReq extends Request = Request>(
  handler: (req: TReq, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req as TReq, res, next).catch(next);
  };
}

export function validate<T extends ZodSchema>(schema: T, input: unknown) {
  try {
    return schema.parse(input);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new ApiError(400, "VALIDATION_ERROR", "Request validation failed", err.flatten());
    }
    throw err;
  }
}

export function parsePagination(query: Request["query"]) {
  const page = Math.max(1, Number(query["page"] ?? 1));
  const limit = Math.min(100, Math.max(1, Number(query["limit"] ?? 25)));
  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

export function toPublicUser(user: {
  id: string;
  username: string;
  email: string;
  level: number;
  exp: number;
  maxExp: number;
  gold: number;
  crystal: number;
  gems: number;
  arenaRank: string;
  arenaPoints: number;
  wins: number;
  losses: number;
  guildName: string | null;
  guildLevel: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    level: user.level,
    exp: user.exp,
    maxExp: user.maxExp,
    gold: user.gold,
    crystal: user.crystal,
    gems: user.gems,
    arenaRank: user.arenaRank,
    arenaPoints: user.arenaPoints,
    wins: user.wins,
    losses: user.losses,
    guildName: user.guildName,
    guildLevel: user.guildLevel,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
