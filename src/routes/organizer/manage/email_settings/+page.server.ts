// email defaults + reusable templates the Emailing composer pulls from
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getEmailSettings, saveEmailDefaults, saveEmailTemplates } from '$lib/server/settings';

export const load: PageServerLoad = async () => {
	return { email: await getEmailSettings() };
};

export const actions: Actions = {
	saveDefaults: async ({ request }) => {
		const fd = await request.formData();
		const subject = fd.get('subject')?.toString().trim() ?? '';
		const signature = fd.get('signature')?.toString().trim() ?? '';
		if (!subject) return fail(400, { error: 'A default subject is required.' });
		await saveEmailDefaults(subject, signature);
		return { defaultsSaved: true };
	},

	addTemplate: async ({ request }) => {
		const fd = await request.formData();
		const name = fd.get('name')?.toString().trim() ?? '';
		const body = fd.get('body')?.toString() ?? '';
		if (!name || !body.trim()) {
			return fail(400, { templateError: 'A template needs both a name and a body.' });
		}
		// names are the key used to pick a template later, so block duplicates (case-insensitive)
		const { templates } = await getEmailSettings();
		if (templates.some((tpl) => tpl.name.toLowerCase() === name.toLowerCase())) {
			return fail(400, { templateError: 'A template with that name already exists.' });
		}
		templates.push({ name, body });
		await saveEmailTemplates(templates);
		return { templateSaved: true };
	},

	deleteTemplate: async ({ request }) => {
		const fd = await request.formData();
		const name = fd.get('name')?.toString() ?? '';
		const { templates } = await getEmailSettings();
		await saveEmailTemplates(templates.filter((tpl) => tpl.name !== name));
		return { templateDeleted: true };
	}
};
