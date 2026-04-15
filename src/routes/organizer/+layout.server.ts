// guard — only organizers can access /organizer/* pages
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'organizer') {
		throw redirect(302, '/login?role=organizer');
	}
	return { user: locals.user };
};
