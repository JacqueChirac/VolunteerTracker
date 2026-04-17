// manage page server — settings, activity types, announcements, manual entries, archives
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { activityTypes, announcements, users, contributions, children, childParentLinks, seasonArchives } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { getAllSettings, updateSetting, getDonationRate } from '$lib/server/settings';

export const load: PageServerLoad = async () => {
	const activities = await db.select().from(activityTypes);
	const news = await db.select().from(announcements).orderBy(desc(announcements.createdAt));
	const parents = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email }).from(users).where(eq(users.role, 'parent'));
	const archives = await db.select().from(seasonArchives).orderBy(desc(seasonArchives.archivedAt));
	const settings = await getAllSettings();
	const donationRate = await getDonationRate();

	return { activities, announcements: news, parents, archives, settings, donationRate };
};

export const actions: Actions = {
	addActivity: async ({ request }) => {
		const fd = await request.formData();
		const name = fd.get('name')?.toString().trim() ?? '';
		if (!name) return fail(400, { activityError: 'Activity name is required.' });
		await db.insert(activityTypes).values({ name });
		return { activitySuccess: true };
	},

	toggleActivity: async ({ request }) => {
		const fd = await request.formData();
		const id = Number(fd.get('id'));
		const active = fd.get('active') === 'true';
		await db.update(activityTypes).set({ active: !active }).where(eq(activityTypes.id, id));
		return { activitySuccess: true };
	},

	addAnnouncement: async ({ request }) => {
		const fd = await request.formData();
		const title = fd.get('title')?.toString().trim() ?? '';
		const content = fd.get('content')?.toString().trim() ?? '';
		if (!title || !content) return fail(400, { announcementError: 'Title and content are required.' });
		await db.insert(announcements).values({ title, content });
		return { announcementSuccess: true };
	},

	deleteAnnouncement: async ({ request }) => {
		const fd = await request.formData();
		const id = Number(fd.get('id'));
		await db.delete(announcements).where(eq(announcements.id, id));
		return { announcementSuccess: true };
	},

	addManualHours: async ({ request }) => {
		const fd = await request.formData();
		const userId = Number(fd.get('userId'));
		const type = fd.get('type')?.toString() as 'volunteering' | 'donation';
		const date = fd.get('date')?.toString() ?? '';
		const value = fd.get('value')?.toString() ?? '';
		const notes = fd.get('notes')?.toString() ?? '';

		if (!userId || !date || !value) return fail(400, { manualError: 'Volunteer, date, and value are required.' });
		const num = parseFloat(value);
		if (isNaN(num) || num <= 0) return fail(400, { manualError: 'Value must be a positive number.' });

		if (type === 'donation') {
			const rate = await getDonationRate();
			await db.insert(contributions).values({ userId, type: 'donation', date, hours: (num / rate).toFixed(2), amount: num.toFixed(2), notes: notes || null });
		} else {
			await db.insert(contributions).values({ userId, type: 'volunteering', date, hours: num.toFixed(2), notes: notes || null });
		}
		return { manualSuccess: true };
	},

	updateSettings: async ({ request }) => {
		const fd = await request.formData();
		for (const [key, value] of fd.entries()) {
			if (key.startsWith('setting_')) {
				await updateSetting(key.replace('setting_', ''), value.toString().trim());
			}
		}
		return { settingsSuccess: true };
	},

	archiveSeason: async ({ request }) => {
		const fd = await request.formData();
		const label = fd.get('label')?.toString().trim() ?? '';
		if (!label) return fail(400, { archiveError: 'Season label is required.' });

		const allContributions = await db.select().from(contributions);
		const allChildren = await db.select().from(children);
		const allLinks = await db.select().from(childParentLinks);
		const allParents = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email }).from(users).where(eq(users.role, 'parent'));

		const snapshot = JSON.stringify({ contributions: allContributions, children: allChildren, links: allLinks, parents: allParents });
		await db.insert(seasonArchives).values({ label, data: snapshot });
		await db.delete(contributions);

		return { archiveSuccess: true };
	}
};
