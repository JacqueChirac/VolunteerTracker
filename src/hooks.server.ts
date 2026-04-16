// this runs on EVERY request before it hits any route
// we use it to check if the user is logged in (has a session cookie)
// and if so, attach their info to `event.locals.user` so all routes can access it

import type { Handle } from '@sveltejs/kit';
import { SESSION_COOKIE, parseSessionToken, getUserById } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE);

	if (token) {
		const session = parseSessionToken(token);
		if (session) {
			const user = await getUserById(session.userId);
			if (user) {
				event.locals.user = {
					id: user.id,
					username: user.username,
					role: user.role,
					firstName: user.firstName,
					lastName: user.lastName
				};
			}
		}
	}

	return resolve(event);
};
