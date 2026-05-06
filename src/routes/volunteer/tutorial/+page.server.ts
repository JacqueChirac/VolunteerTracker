import type { PageServerLoad } from './$types';
import { getTutorialContent } from '$lib/server/settings';

export const load: PageServerLoad = async () => {
	return { tut: await getTutorialContent() };
};
