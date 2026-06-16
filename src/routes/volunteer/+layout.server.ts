// Most /volunteer/* pages are volunteer-only. /volunteer/tutorial is the
// exception: organizers open it too (it doubles as the editor). This load also
// hands every volunteer page its undo state.
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getUndoState } from '$lib/server/undo';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(302, '/login?role=volunteer');
	}
	const isTutorial = url.pathname === '/volunteer/tutorial' || url.pathname.startsWith('/volunteer/tutorial/');
	if (locals.user.role !== 'volunteer' && !isTutorial) {
		throw redirect(302, '/login?role=volunteer');
	}
	return { user: locals.user, undoState: await getUndoState(String(locals.user.id)) };
};
