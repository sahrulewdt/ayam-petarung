import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { env } from "./env";
import { ApiError } from "./http";

const scrypt = promisify(scryptCallback);

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function decodeBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, salt, stored] = passwordHash.split("$");
  if (algorithm !== "scrypt" || !salt || !stored) {
    return false;
  }

  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const storedBuffer = Buffer.from(stored, "base64url");
  return storedBuffer.length === derived.length && timingSafeEqual(storedBuffer, derived);
}

export function signJwt(payload: { sub: string; username: string }) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const body = {
    ...payload,
    iat: now,
    exp: now + env.JWT_EXPIRES_IN_SECONDS,
  };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedBody = base64Url(JSON.stringify(body));
  const signature = createHmac("sha256", env.JWT_SECRET)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest("base64url");

  return `${encodedHeader}.${encodedBody}.${signature}`;
}

export function verifyJwt(token: string) {
  const [encodedHeader, encodedBody, signature] = token.split(".");
  if (!encodedHeader || !encodedBody || !signature) {
    throw new ApiError(401, "INVALID_TOKEN", "Invalid authorization token");
  }

  const expected = createHmac("sha256", env.JWT_SECRET)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest("base64url");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw new ApiError(401, "INVALID_TOKEN", "Invalid authorization token");
  }

  const payload = JSON.parse(decodeBase64Url(encodedBody)) as {
    sub?: string;
    username?: string;
    exp?: number;
  };

  if (!payload.sub || !payload.username || !payload.exp) {
    throw new ApiError(401, "INVALID_TOKEN", "Invalid authorization token");
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new ApiError(401, "TOKEN_EXPIRED", "Authorization token has expired");
  }

  return {
    userId: payload.sub,
    username: payload.username,
  };
}
