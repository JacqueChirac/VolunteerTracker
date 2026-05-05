// login server logic — verifies credentials and sets session cookie
import type { Actions, PageServerLoad } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import {
  verifyUser,
  createSessionToken,
  SESSION_COOKIE,
} from "$lib/server/auth";
import { dev } from "$app/environment";
import { db } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async ({ locals }) => {
  // already logged in? redirect to their dashboard
  if (locals.user) {
    throw redirect(
      302,
      locals.user.role === "volunteer" ? "/volunteer" : "/organizer",
    );
  }
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const email = formData.get("email")?.toString().trim() ?? "";
    const password = formData.get("password")?.toString() ?? "";

    if (!email || !password) {
      return fail(400, { error: "Email and password are required.", email });
    }

    const user = await verifyUser(email, password);
    if (!user) {
      return fail(400, { error: "Invalid email or password.", email });
    }

    // set session cookie (lasts 30 day)
    const token = createSessionToken(user.id);
    cookies.set(SESSION_COOKIE, token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    throw redirect(
      302,
      user.role === "volunteer" ? "/volunteer" : "/organizer",
    );
  },
  devLogin: async ({ request, cookies }) => {
    if (!dev) return fail(403, { error: "Disabled." });

    const as = (await request.formData()).get("as")?.toString();
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
    cookies.set(SESSION_COOKIE, token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    throw redirect(
      302,
      user.role === "volunteer" ? "/volunteer" : "/organizer",
    );
  },
};
