import type { PageServerLoad, Actions } from './$types';
import { getTutorialContent, updateTutorialSetting } from '$lib/server/settings';

export const load: PageServerLoad = async () => {
	return { tut: await getTutorialContent() };
};

export const actions: Actions = {
	saveTutorial: async ({ request }) => {
		const fd = await request.formData();
		const keys = [
			'tut_title', 'tut_subtitle',
			...[1, 2, 3, 4, 5].flatMap((n) => [
				`tut_step${n}_title`,
				`tut_step${n}_body`,
				`tut_step${n}_link_text`,
				`tut_step${n}_link_url`,
			]),
			'tut_faq_title',
			...[1, 2, 3, 4].flatMap((n) => [`tut_faq${n}_q`, `tut_faq${n}_a`]),
		];
		for (const key of keys) {
			const val = fd.get(key)?.toString() ?? '';
			await updateTutorialSetting(key, val);
		}
		return { success: true };
	},
};
