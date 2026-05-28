import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { RECOVERY_COOKIE, parseRecoveryToken } from "$lib/server/auth";
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

		if (password !== confirmPassword) {
			return fail(400, { error: "Passwords do not match." });
		}

		const token = cookies.get(RECOVERY_COOKIE);
		const recovery = token ? parseRecoveryToken(token) : null;

		if (!recovery) {
			throw redirect(302, "/login/recovery");
		}

		const newPasswordHash = hashSync(password, 10);
		const userEmail = recovery.email;

		//Update
		await sql`UPDATE users SET password_hash = ${newPasswordHash} WHERE email = ${userEmail}`;

		// Trash passkey
		cookies.delete(RECOVERY_COOKIE, { path: "/" });

		throw redirect(302, "/login");
	}
};