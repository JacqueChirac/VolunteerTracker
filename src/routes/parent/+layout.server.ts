import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// TODO: guard — require locals.user.role === 'parent'
	return { user: locals.user };
};
