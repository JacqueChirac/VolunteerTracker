import type { PageServerLoad, Actions } from './$types';
import { getTutorialContent, updateTutorialSetting, deleteTutorialSetting } from '$lib/server/settings';

export const load: PageServerLoad = async () => {
	return { tut: await getTutorialContent() };
};

const STEP_FIELDS = ['title', 'body', 'link_text', 'link_url'] as const;
const FAQ_FIELDS = ['q', 'a'] as const;

export const actions: Actions = {
	saveTutorial: async ({ request }) => {
		const fd = await request.formData();
		const tut = await getTutorialContent();
		const stepCount = Number(tut.tut_step_count || '5');
		const faqCount = Number(tut.tut_faq_count || '4');

		const keys = [
			'tut_title', 'tut_subtitle',
			...Array.from({ length: stepCount }, (_, i) => i + 1).flatMap((n) =>
				STEP_FIELDS.map((f) => `tut_step${n}_${f}`)
			),
			'tut_faq_title',
			...Array.from({ length: faqCount }, (_, i) => i + 1).flatMap((n) =>
				FAQ_FIELDS.map((f) => `tut_faq${n}_${f}`)
			),
		];

		for (const key of keys) {
			const val = fd.get(key)?.toString() ?? '';
			await updateTutorialSetting(key, val);
		}
		return { success: true };
	},

	addStep: async () => {
		const tut = await getTutorialContent();
		const count = Number(tut.tut_step_count || '5');
		const n = count + 1;
		await updateTutorialSetting(`tut_step${n}_title`, `Step ${n}`);
		await updateTutorialSetting(`tut_step${n}_body`, '');
		await updateTutorialSetting(`tut_step${n}_link_text`, '');
		await updateTutorialSetting(`tut_step${n}_link_url`, '');
		await updateTutorialSetting('tut_step_count', String(n));
		return { success: true };
	},

	deleteStep: async ({ request }) => {
		const fd = await request.formData();
		const n = Number(fd.get('n'));
		const tut = await getTutorialContent();
		const count = Number(tut.tut_step_count || '5');
		if (n < 1 || n > count || count <= 1) return { success: false };

		for (let i = n; i < count; i++) {
			for (const field of STEP_FIELDS) {
				const val = tut[`tut_step${i + 1}_${field}`] ?? '';
				await updateTutorialSetting(`tut_step${i}_${field}`, val);
			}
		}
		for (const field of STEP_FIELDS) {
			await deleteTutorialSetting(`tut_step${count}_${field}`);
		}
		await updateTutorialSetting('tut_step_count', String(count - 1));
		return { success: true };
	},

	addFaq: async () => {
		const tut = await getTutorialContent();
		const count = Number(tut.tut_faq_count || '4');
		const n = count + 1;
		await updateTutorialSetting(`tut_faq${n}_q`, '');
		await updateTutorialSetting(`tut_faq${n}_a`, '');
		await updateTutorialSetting('tut_faq_count', String(n));
		return { success: true };
	},

	deleteFaq: async ({ request }) => {
		const fd = await request.formData();
		const n = Number(fd.get('n'));
		const tut = await getTutorialContent();
		const count = Number(tut.tut_faq_count || '4');
		if (n < 1 || n > count || count <= 1) return { success: false };

		for (let i = n; i < count; i++) {
			for (const field of FAQ_FIELDS) {
				const val = tut[`tut_faq${i + 1}_${field}`] ?? '';
				await updateTutorialSetting(`tut_faq${i}_${field}`, val);
			}
		}
		for (const field of FAQ_FIELDS) {
			await deleteTutorialSetting(`tut_faq${count}_${field}`);
		}
		await updateTutorialSetting('tut_faq_count', String(count - 1));
		return { success: true };
	},
};
