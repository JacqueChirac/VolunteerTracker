// login server logic — verifies credentials and sets a signed session cookie
import type { Actions, PageServerLoad } from "./$types";
import { fail, redirect, error } from "@sveltejs/kit";
import {
  verifyUser,
  createSessionToken,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTS,
} from "$lib/server/auth";
import { dev } from "$app/environment";
import { db } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { RateLimiter } from "sveltekit-rate-limiter/server";
import { env } from "$env/dynamic/private";

// 5 attempts per IP+UA per 15 min; 20 attempts per IP per hour.
// Cookie limiter requires preflight (set in load) and is per-browser.
const loginLimiter = new RateLimiter({
  IP: [20, "h"],
  IPUA: [5, "15m"],
  cookie: {
    name: "loginRateLimit",
    secret: env.SESSION_SECRET ?? "dev-rate-limit-secret",
    rate: [10, "15m"],
    preflight: true,
  },
});

export const load: PageServerLoad = async (event) => {
  // already logged in? redirect to their dashboard
  if (event.locals.user) {
    throw redirect(
      302,
      event.locals.user.role === "volunteer" ? "/volunteer" : "/organizer",
    );
  }
  await loginLimiter.cookieLimiter?.preflight(event);
};

export const actions: Actions = {
  login: async (event) => {
    if (await loginLimiter.isLimited(event)) {
      throw error(429, "Too many login attempts. Please wait and try again.");
    }

    const formData = await event.request.formData();
    const email = formData.get("email")?.toString().trim() ?? "";
    const password = formData.get("password")?.toString() ?? "";

    if (!email || !password) {
      return fail(400, { error: "Email and password are required.", email });
    }

    const user = await verifyUser(email, password);
    if (!user) {
      return fail(400, { error: "Invalid email or password.", email });
    }

    const token = createSessionToken(user.id);
    event.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTS);

    throw redirect(
      302,
      user.role === "volunteer" ? "/volunteer" : "/organizer",
    );
  },
  devLogin: async (event) => {
    if (!dev) return fail(403, { error: "Disabled." });

    const as = (await event.request.formData()).get("as")?.toString();
    let user;
    if (as === "volunteer") {
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, "raymond@example.com"))
        .limit(1);
    } else if (as === "organizer") {
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.role, "organizer"))
        .limit(1);
    }
    if (!user) return fail(404, { error: "Test user not found in DB." });

    const token = createSessionToken(user.id);
    event.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTS);
    throw redirect(
      302,
      user.role === "volunteer" ? "/volunteer" : "/organizer",
    );
  },
};
