// handles login, registration, and session tokens
// session tokens are HMAC-signed so they can't be forged client-side.
// format: base64url(payload) + "." + base64url(hmac)
// payload = JSON.stringify({ userId, ts })

import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { hashSync, compareSync } from "bcrypt-ts";
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { env } from "$env/dynamic/private";
import { dev } from "$app/environment";

const SESSION_COOKIE = "session";
const RECOVERY_COOKIE = "recovery_token";

// central tuning knobs - change here, not at call sites
export const BCRYPT_COST = 12;
export const PASSWORD_MIN_LENGTH = 8;

// SESSION_SECRET signs cookies. Missing in prod = hard fail; in dev we synth
// a per-process key and log a warning so local dev still works.
function getSecret(): string {
  const s = env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (!dev) {
    throw new Error(
      "SESSION_SECRET env var is required in production (min 32 chars). " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"",
    );
  }
  // dev fallback - sessions reset on each server restart, which is fine for dev
  if (!devSecret) {
    devSecret = randomBytes(48).toString("base64url");
    console.warn(
      "[auth] SESSION_SECRET not set — using a per-process dev secret. " +
      "Add SESSION_SECRET to .env to persist sessions across restarts.",
    );
  }
  return devSecret;
}
let devSecret: string | null = null;

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

// constant-time compare so timing doesn't leak which side mismatched
function safeEqualStr(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

// ── user helpers ──────────────────────────────────────────────────────────

export async function createUser(
  password: string,
  firstName: string,
  lastName: string,
  email: string,
  role: "volunteer" | "organizer" = "volunteer",
) {
  const passwordHash = hashSync(password, BCRYPT_COST);
  const [user] = await db
    .insert(users)
    .values({ passwordHash, firstName, lastName, email, role })
    .returning();
  return user;
}

export async function verifyUser(email: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) return null;
  if (!compareSync(password, user.passwordHash)) return null;
  return user;
}

export async function getUserById(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user || null;
}

// ── signed token helpers ─────────────────────────────────────────────────

export function createSessionToken(userId: number): string {
  const payload = JSON.stringify({ userId, ts: Date.now() });
  return `${b64url(payload)}.${sign(payload)}`;
}

export function createRecoveryToken(email: string): string {
  const payload = JSON.stringify({ email, ts: Date.now() });
  return `${b64url(payload)}.${sign(payload)}`;
}

export function parseSessionToken(token: string): { userId: number } | null {
  try {
    const [b64, mac] = token.split(".");
    if (!b64 || !mac) return null;
    const payload = Buffer.from(b64, "base64url").toString();
    if (!safeEqualStr(sign(payload), mac)) return null;
    const data = JSON.parse(payload);
    if (typeof data.userId !== "number") return null;
    return { userId: data.userId };
  } catch {
    return null;
  }
}

export function parseRecoveryToken(token: string): { email: string } | null {
  try {
    const [b64, mac] = token.split(".");
    if (!b64 || !mac) return null;
    const payload = Buffer.from(b64, "base64url").toString();
    if (!safeEqualStr(sign(payload), mac)) return null;
    const data = JSON.parse(payload);
    if (typeof data.email !== "string") return null;
    return { email: data.email };
  } catch {
    return null;
  }
}

// ── shared cookie opts so flags can't drift between call sites ────────────

export const SESSION_COOKIE_OPTS = {
  path: "/" as const,
  httpOnly: true,
  sameSite: "lax" as const,
  secure: !dev,
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

export const RECOVERY_COOKIE_OPTS = {
  path: "/" as const,
  httpOnly: true,
  sameSite: "lax" as const,
  secure: !dev,
  maxAge: 60 * 10, // 10 minutes
};

export { SESSION_COOKIE, RECOVERY_COOKIE };
