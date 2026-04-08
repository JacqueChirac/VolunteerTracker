import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// TODO: read session cookie, look up user, set event.locals.user
	return resolve(event);
};
