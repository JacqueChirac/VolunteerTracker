// login server logic — verifies credentials and sets session cookie
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { verifyUser, createSessionToken, SESSION_COOKIE } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	// already logged in? redirect to their dashboard
	if (locals.user) {
		throw redirect(302, locals.user.role === 'parent' ? '/volunteer' : '/organizer');
	}
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString().trim() ?? '';
		const password = formData.get('password')?.toString() ?? '';

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required.', email });
		}

		const user = await verifyUser(email, password);
		if (!user) {
			return fail(400, { error: 'Invalid email or password.', email });
		}

		// set session cookie (lasts 30 days)
		const token = createSessionToken(user.id);
		cookies.set(SESSION_COOKIE, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30
		});

		throw redirect(302, user.role === 'parent' ? '/volunteer' : '/organizer');
	}
};
