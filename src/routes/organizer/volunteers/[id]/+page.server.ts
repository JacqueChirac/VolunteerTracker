import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	return { id: params.id };
};

export const actions: Actions = {};
