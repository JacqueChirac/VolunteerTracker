// registration server logic - admin (organizer) creates a volunteer account
import type { Actions, PageServerLoad } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import { createUser } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async ({ locals }) => {
  // only organizers (admins) may create volunteer accounts
  if (!locals.user || locals.user.role !== "organizer") {
    throw redirect(302, "/login?role=organizer");
  }
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (!locals.user || locals.user.role !== "organizer") {
      throw redirect(302, "/login?role=organizer");
    }

    const formData = await request.formData();
    const password = formData.get("password")?.toString() ?? "";
    const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";
    const firstName = formData.get("firstName")?.toString().trim() ?? "";
    const lastName = formData.get("lastName")?.toString().trim() ?? "";
    const email = formData.get("email")?.toString().trim() ?? "";

    if (!password || !firstName || !lastName || !email) {
      return fail(400, {
        error: "All fields are required.",
        firstName,
        lastName,
        email,
      });
    }
    if (password.length < 4) {
      return fail(400, {
        error: "Password must be at least 4 characters.",
        firstName,
        lastName,
        email,
      });
    }
    if (password !== confirmPassword) {
      return fail(400, {
        error: "Passwords do not match.",
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
        firstName,
        lastName,
        email,
      });
    }

    await createUser(password, firstName, lastName, email, "volunteer");

    // keep the admin's own session; send them back to the people list
    throw redirect(302, "/organizer/manage");
  },
};
