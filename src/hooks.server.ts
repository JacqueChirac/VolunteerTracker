// this runs on EVERY request before it hits any route
// we use it to check if the user is logged in (has a session cookie)
// and if so, attach their info to `event.locals.user` so all routes can access it

import type { Handle } from '@sveltejs/kit';
import { SESSION_COOKIE, parseSessionToken, getUserById } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	console.log('[HOOKS] Request:', event.url.pathname);
	const token = event.cookies.get(SESSION_COOKIE);

	if (token) {
		console.log('[HOOKS] Session token found, parsing...');
		const session = parseSessionToken(token);
		if (session) {
			console.log('[HOOKS] Session parsed, fetching user:', session.userId);
			try {
				const user = await getUserById(session.userId);
				console.log('[HOOKS] User fetched:', user ? user.username : 'null');
				if (user) {
					event.locals.user = {
						id: user.id,
						username: user.username,
						role: user.role,
						firstName: user.firstName,
						lastName: user.lastName
					};
				}
			} catch (err) {
				console.error('[HOOKS] DB error fetching user:', err);
			}
		}
	} else {
		console.log('[HOOKS] No session token');
	}

	return resolve(event);
};
