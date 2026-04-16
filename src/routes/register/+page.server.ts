// registration server logic — creates a new parent/volunteer account
import type { Actions, PageServerLoad } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import {
  createUser,
  createSessionToken,
  SESSION_COOKIE,
} from "$lib/server/auth";
import { db } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(
      302,
      locals.user.role === "parent" ? "/volunteer" : "/organizer",
    );
  }
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const username = formData.get("username")?.toString().trim() ?? "";
    const password = formData.get("password")?.toString() ?? "";
    const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";
    const firstName = formData.get("firstName")?.toString().trim() ?? "";
    const lastName = formData.get("lastName")?.toString().trim() ?? "";
    const email = formData.get("email")?.toString().trim() ?? "";

    if (!username || !password || !firstName || !lastName || !email) {
      return fail(400, {
        error: "All fields are required.",
        username,
        firstName,
        lastName,
        email,
      });
    }
    if (password.length < 4) {
      return fail(400, {
        error: "Password must be at least 4 characters.",
        username,
        firstName,
        lastName,
        email,
      });
    }
    if (password !== confirmPassword) {
      return fail(400, {
        error: "Passwords do not match.",
        username,
        firstName,
        lastName,
        email,
      });
    }

    // check if username is taken
    const existingUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    if (existingUsername.length > 0) {
      return fail(400, {
        error: "Username already taken.",
        username,
        firstName,
        lastName,
        email,
      });
    }

    // check if email is taken
    const existingEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (existingEmail.length > 0) {
      return fail(400, {
        error: "Email already in use.",
        username,
        firstName,
        lastName,
        email,
      });
    }

    const user = await createUser(
      username,
      password,
      firstName,
      lastName,
      email,
      "parent",
    );

    const token = createSessionToken(user.id);
    cookies.set(SESSION_COOKIE, token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    throw redirect(302, "/volunteer");
  },
};
