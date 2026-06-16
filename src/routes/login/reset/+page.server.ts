import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import {
  RECOVERY_COOKIE,
  parseRecoveryToken,
  BCRYPT_COST,
  PASSWORD_MIN_LENGTH,
} from "$lib/server/auth";
import { hashSync } from "bcrypt-ts";
import { neon } from "@neondatabase/serverless";
import { DATABASE_URL } from "$env/static/private";
const sql = neon(DATABASE_URL);

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get(RECOVERY_COOKIE);
	
	// Cookie valid check / Expel
	if (!token || !parseRecoveryToken(token)) {
		throw redirect(302, "/login/recovery");
	}

	return {};
};

export const actions: Actions = {
	reset: async ({ request, cookies }) => {
		const formData = await request.formData();
		const password = formData.get("password")?.toString();
		const confirmPassword = formData.get("confirmPassword")?.toString();

		if (!password || !confirmPassword) {
			return fail(400, { error: "Both password fields are required." });
		}

		if (password.length < PASSWORD_MIN_LENGTH) {
			return fail(400, { error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.` });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: "Passwords do not match." });
		}

		// re-verify the cookie on submit; load() can't guard the POST
		const token = cookies.get(RECOVERY_COOKIE);
		const recovery = token ? parseRecoveryToken(token) : null;

		if (!recovery) {
			throw redirect(302, "/login/recovery");
		}

		const newPasswordHash = hashSync(password, BCRYPT_COST);
		// email comes from the signed token, never from user input
		const userEmail = recovery.email;

		//Update
		await sql`UPDATE users SET password_hash = ${newPasswordHash} WHERE email = ${userEmail}`;

		// Trash passkey
		cookies.delete(RECOVERY_COOKIE, { path: "/" });

		throw redirect(302, "/login");
	}
};