// guard — only volunteer users can access /volunteer/* pages
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'volunteer') {
		throw redirect(302, '/login?role=volunteer');
	}
	return { user: locals.user };
};
