import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async () => {
		// TODO: create user, log them in
		return {};
	}
};
