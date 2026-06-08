// volunteer-facing tutorial — display for everyone, inline editor for organizers.
// Edit actions are organizer-only (re-checked here since the hook lets organizers
// into this route specifically).
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getTutorialContent, updateTutorialSetting, deleteTutorialSetting } from '$lib/server/settings';
import { db } from '$lib/server/db';
import { siteSettings } from '$lib/server/db/schema';
import { like } from 'drizzle-orm';
import { recordAction, diffRows } from '$lib/server/undo';

export const load: PageServerLoad = async () => {
	return { tut: await getTutorialContent() };
};

// snapshot every tutorial setting row so an edit can be diffed and undone as a unit
function snapTut() {
	return db.select().from(siteSettings).where(like(siteSettings.key, 'tut_%'));
}

// _fr variants are stored alongside EN fields; link_url is language-neutral
const STEP_FIELDS = ['title', 'body', 'link_text', 'link_url', 'title_fr', 'body_fr', 'link_text_fr'] as const;
const FAQ_FIELDS = ['q', 'a', 'q_fr', 'a_fr'] as const;

function requireOrganizer(locals: App.Locals) {
	if (!locals.user || locals.user.role !== 'organizer') {
		return fail(403, { error: 'Only organizers can edit the tutorial.' });
	}
	return null;
}

export const actions: Actions = {
	saveTutorial: async ({ request, locals }) => {
		const denied = requireOrganizer(locals);
		if (denied) return denied;

		const fd = await request.formData();
		const tut = await getTutorialContent();
		const stepCount = Number(tut.tut_step_count || '5');
		const faqCount = Number(tut.tut_faq_count || '4');

		const keys = [
			'tut_title', 'tut_subtitle', 'tut_title_fr', 'tut_subtitle_fr',
			...Array.from({ length: stepCount }, (_, i) => i + 1).flatMap((n) =>
				STEP_FIELDS.map((f) => `tut_step${n}_${f}`)
			),
			'tut_faq_title', 'tut_faq_title_fr',
			...Array.from({ length: faqCount }, (_, i) => i + 1).flatMap((n) =>
				FAQ_FIELDS.map((f) => `tut_faq${n}_${f}`)
			),
		];

		const before = await snapTut();
		for (const key of keys) {
			const val = fd.get(key)?.toString() ?? '';
			await updateTutorialSetting(key, val);
		}
		const changes = diffRows('siteSettings', before, await snapTut());
		await recordAction(String(locals.user!.id), 'Edit tutorial', changes);
		return { success: true, undoable: changes.length > 0, message: 'Tutorial saved.' };
	},

	addStep: async ({ locals }) => {
		const denied = requireOrganizer(locals);
		if (denied) return denied;

		const tut = await getTutorialContent();
		const count = Number(tut.tut_step_count || '5');
		const n = count + 1;
		const before = await snapTut();
		await updateTutorialSetting(`tut_step${n}_title`, `Step ${n}`);
		await updateTutorialSetting(`tut_step${n}_title_fr`, `Étape ${n}`);
		await updateTutorialSetting(`tut_step${n}_body`, '');
		await updateTutorialSetting(`tut_step${n}_body_fr`, '');
		await updateTutorialSetting(`tut_step${n}_link_text`, '');
		await updateTutorialSetting(`tut_step${n}_link_text_fr`, '');
		await updateTutorialSetting(`tut_step${n}_link_url`, '');
		await updateTutorialSetting('tut_step_count', String(n));
		const changes = diffRows('siteSettings', before, await snapTut());
		await recordAction(String(locals.user!.id), 'Add tutorial step', changes);
		return { success: true, undoable: changes.length > 0, message: 'Step added.' };
	},

	deleteStep: async ({ request, locals }) => {
		const denied = requireOrganizer(locals);
		if (denied) return denied;

		const fd = await request.formData();
		const n = Number(fd.get('n'));
		const tut = await getTutorialContent();
		const count = Number(tut.tut_step_count || '5');
		if (n < 1 || n > count || count <= 1) return { success: false };

		const before = await snapTut();
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
		const changes = diffRows('siteSettings', before, await snapTut());
		await recordAction(String(locals.user!.id), 'Delete tutorial step', changes);
		return { success: true, undoable: changes.length > 0, message: 'Step deleted.' };
	},

	addFaq: async ({ locals }) => {
		const denied = requireOrganizer(locals);
		if (denied) return denied;

		const tut = await getTutorialContent();
		const count = Number(tut.tut_faq_count || '4');
		const n = count + 1;
		const before = await snapTut();
		await updateTutorialSetting(`tut_faq${n}_q`, '');
		await updateTutorialSetting(`tut_faq${n}_q_fr`, '');
		await updateTutorialSetting(`tut_faq${n}_a`, '');
		await updateTutorialSetting(`tut_faq${n}_a_fr`, '');
		await updateTutorialSetting('tut_faq_count', String(n));
		const changes = diffRows('siteSettings', before, await snapTut());
		await recordAction(String(locals.user!.id), 'Add tutorial FAQ', changes);
		return { success: true, undoable: changes.length > 0, message: 'FAQ added.' };
	},

	deleteFaq: async ({ request, locals }) => {
		const denied = requireOrganizer(locals);
		if (denied) return denied;

		const fd = await request.formData();
		const n = Number(fd.get('n'));
		const tut = await getTutorialContent();
		const count = Number(tut.tut_faq_count || '4');
		if (n < 1 || n > count || count <= 1) return { success: false };

		const before = await snapTut();
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
		const changes = diffRows('siteSettings', before, await snapTut());
		await recordAction(String(locals.user!.id), 'Delete tutorial FAQ', changes);
		return { success: true, undoable: changes.length > 0, message: 'FAQ deleted.' };
	},
};
