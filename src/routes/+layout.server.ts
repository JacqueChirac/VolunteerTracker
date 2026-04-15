// passes the logged-in user to every page via `data.user`
// this runs on every request (the user comes from hooks.server.ts)
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user ?? null
	};
};
