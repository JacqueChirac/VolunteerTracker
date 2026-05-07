// manage page server — settings, activity types, announcements, manual entries, archives
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { activityTypes, announcements, users, contributions, children, childVolunteerLinks, seasonArchives, swimLevelSettings } from '$lib/server/db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { getAllSettings, updateSetting, getSetting, getDonationRate, getHoursRequired, getSwimLevels } from '$lib/server/settings';
import { createUser } from '$lib/server/auth';

function advanceOneYear(dateStr: string): string {
	const d = new Date(dateStr + 'T00:00:00Z');
	d.setUTCFullYear(d.getUTCFullYear() + 1);
	return d.toISOString().split('T')[0];
}

export const load: PageServerLoad = async () => {
	const activities = await db.select().from(activityTypes);
	const news = await db.select().from(announcements).orderBy(desc(announcements.createdAt));
	const volunteers = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email }).from(users).where(eq(users.role, 'volunteer')).orderBy(asc(users.firstName));
	const allChildren = await db.select().from(children).orderBy(asc(children.firstName));
	const allLinks = await db.select().from(childVolunteerLinks);
	let archives = await db.select().from(seasonArchives).orderBy(desc(seasonArchives.archivedAt));
	const settings = await getAllSettings();
	const donationRate = await getDonationRate();

	// season date settings (stored separately from numeric settings)
	const seasonStartDate = await getSetting('season_start_date');
	const seasonEndDate = await getSetting('season_end_date');
	const todayStr = new Date().toISOString().split('T')[0];

	// auto-archive: if season end date has passed and no archive created after it
	let autoArchived = false;
	if (seasonEndDate && todayStr > seasonEndDate) {
		const lastArchive = archives[0];
		const alreadyArchived = lastArchive &&
			new Date(lastArchive.archivedAt) > new Date(seasonEndDate + 'T23:59:59Z');

		if (!alreadyArchived) {
			const label = seasonStartDate
				? `${seasonStartDate} – ${seasonEndDate}`
				: `Season ended ${seasonEndDate}`;

			const allContribs = await db.select().from(contributions);
			const allChildrenSnap = await db.select().from(children);
			const allLinksSnap = await db.select().from(childVolunteerLinks);
			const allVolsSnap = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email }).from(users).where(eq(users.role, 'volunteer'));

			await db.insert(seasonArchives).values({
				label,
				data: JSON.stringify({ contributions: allContribs, children: allChildrenSnap, links: allLinksSnap, volunteers: allVolsSnap })
			});
			await db.delete(contributions);

			// advance season dates by one year for next cycle
			await updateSetting('season_end_date', advanceOneYear(seasonEndDate));
			if (seasonStartDate) await updateSetting('season_start_date', advanceOneYear(seasonStartDate));

			autoArchived = true;
			archives = await db.select().from(seasonArchives).orderBy(desc(seasonArchives.archivedAt));
		}
	}

	// attach linked volunteer ids to each child for quick lookup in the UI
	const linksByChild: Record<number, number[]> = {};
	for (const l of allLinks) {
		(linksByChild[l.childId] ??= []).push(l.userId);
	}
	const childrenWithLinks = allChildren.map((c) => ({ ...c, volunteerIds: linksByChild[c.id] ?? [] }));

	const swimLevels = await getSwimLevels();
	return {
		activities, announcements: news, volunteers, children: childrenWithLinks,
		archives, settings, donationRate, swimLevels,
		seasonDates: { start: seasonStartDate, end: seasonEndDate },
		autoArchived
	};
};

export const actions: Actions = {
	addActivity: async ({ request }) => {
		const fd = await request.formData();
		const name = fd.get('name')?.toString().trim() ?? '';
		if (!name) return fail(400, { activityError: 'Activity name is required.' });
		await db.insert(activityTypes).values({ name });
		return { activitySuccess: true };
	},

	editActivity: async ({ request }) => {
		const fd = await request.formData();
		const id = Number(fd.get('id'));
		const name = fd.get('name')?.toString().trim() ?? '';
		if (!id || !name) return fail(400, { activityError: 'Name is required.' });
		await db.update(activityTypes).set({ name }).where(eq(activityTypes.id, id));
		return { activitySuccess: true };
	},

	deleteActivity: async ({ request }) => {
		const fd = await request.formData();
		const id = Number(fd.get('id'));
		if (!id) return fail(400, { activityError: 'Invalid activity.' });
		await db.update(contributions).set({ activityId: null }).where(eq(contributions.activityId, id));
		await db.delete(activityTypes).where(eq(activityTypes.id, id));
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

	addVolunteer: async ({ request }) => {
		const fd = await request.formData();
		const firstName = fd.get('firstName')?.toString().trim() ?? '';
		const lastName = fd.get('lastName')?.toString().trim() ?? '';
		const email = fd.get('email')?.toString().trim().toLowerCase() ?? '';
		const password = fd.get('password')?.toString() ?? '';

		if (!firstName || !lastName || !email || !password) {
			return fail(400, { volunteerError: 'All fields are required.' });
		}
		if (password.length < 4) {
			return fail(400, { volunteerError: 'Password must be at least 4 characters.' });
		}
		const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRe.test(email)) {
			return fail(400, { volunteerError: 'Please enter a valid email address.' });
		}
		const existing = await db.select().from(users).where(eq(users.email, email));
		if (existing.length > 0) {
			return fail(400, { volunteerError: 'A user with this email already exists.' });
		}

		await createUser(password, firstName, lastName, email, 'volunteer');
		return { volunteerSuccess: `Created volunteer ${firstName} ${lastName}.` };
	},

	addChild: async ({ request }) => {
		const fd = await request.formData();
		const firstName = fd.get('firstName')?.toString().trim() ?? '';
		const lastName = fd.get('lastName')?.toString().trim() ?? '';
		const status = fd.get('status')?.toString() === 'tryout' ? 'tryout' : 'full_member';
		const level = fd.get('level')?.toString().trim() ?? '';
		const linkUserIdRaw = fd.get('linkUserId')?.toString() ?? '';

		if (!firstName || !lastName) {
			return fail(400, { childError: 'First and last name are required.' });
		}

		const [child] = await db.insert(children).values({
			firstName, lastName,
			status: status as 'full_member' | 'tryout',
			level: level || null
		}).returning();

		const linkUserId = Number(linkUserIdRaw);
		if (linkUserId && Number.isFinite(linkUserId)) {
			await db.insert(childVolunteerLinks).values({ childId: child.id, userId: linkUserId });
		}

		return { childSuccess: `Added child ${firstName} ${lastName}.` };
	},

	linkChild: async ({ request }) => {
		const fd = await request.formData();
		const childId = Number(fd.get('childId'));
		const userId = Number(fd.get('userId'));
		if (!childId || !userId) return fail(400, { linkError: 'Child and volunteer required.' });

		const existing = await db.select().from(childVolunteerLinks)
			.where(eq(childVolunteerLinks.childId, childId));
		if (existing.some((l) => l.userId === userId)) {
			return fail(400, { linkError: 'That volunteer is already linked to this child.' });
		}

		await db.insert(childVolunteerLinks).values({ childId, userId });
		return { linkSuccess: true };
	},

	unlinkChild: async ({ request }) => {
		const fd = await request.formData();
		const childId = Number(fd.get('childId'));
		const userId = Number(fd.get('userId'));
		if (!childId || !userId) return fail(400, { linkError: 'Child and volunteer required.' });
		const all = await db.select().from(childVolunteerLinks).where(eq(childVolunteerLinks.childId, childId));
		const target = all.find((l) => l.userId === userId);
		if (target) {
			await db.delete(childVolunteerLinks).where(eq(childVolunteerLinks.id, target.id));
		}
		return { linkSuccess: true };
	},

	deleteChild: async ({ request }) => {
		const fd = await request.formData();
		const childId = Number(fd.get('childId'));
		if (!childId) return fail(400, { childError: 'Invalid child.' });
		await db.delete(children).where(eq(children.id, childId));
		return { childSuccess: 'Child removed.' };
	},

	markMet: async ({ request }) => {
		const fd = await request.formData();
		const userId = Number(fd.get('userId'));
		if (!userId) return fail(400, { markMetError: 'Invalid volunteer.' });

		const markAs = fd.get('markAs')?.toString() as 'full_member' | 'tryout' ?? 'full_member';

		const allContributions = await db.select().from(contributions).where(eq(contributions.userId, userId));
		const currentHours = allContributions.reduce((sum, c) => sum + parseFloat(c.hours ?? '0'), 0);

		const maxRequired = await getHoursRequired(markAs);

		const remaining = maxRequired - currentHours;
		if (remaining <= 0) return fail(400, { markMetError: 'This volunteer already meets requirements.' });

		const today = new Date().toISOString().split('T')[0];
		await db.insert(contributions).values({
			userId,
			eventId: null,
			type: 'volunteering' as const,
			date: today,
			hours: remaining.toFixed(2),
			amount: null,
			activityId: null,
			notes: 'Manually marked as met by organizer'
		});

		return { markMetSuccess: true };
	},

	addSwimLevel: async ({ request }) => {
		const fd = await request.formData();
		const value = fd.get('value')?.toString().trim() ?? '';
		const name = fd.get('name')?.toString().trim() ?? '';
		const description = fd.get('description')?.toString().trim() ?? '';
		if (!value || !name) return fail(400, { swimLevelError: 'Value and name are required.' });
		const existing = await db.select().from(swimLevelSettings);
		await db.insert(swimLevelSettings).values({ value, name, description: description || null, displayOrder: existing.length });
		return { swimLevelSuccess: true };
	},

	editSwimLevel: async ({ request }) => {
		const fd = await request.formData();
		const id = Number(fd.get('id'));
		const name = fd.get('name')?.toString().trim() ?? '';
		const description = fd.get('description')?.toString().trim() ?? '';
		if (!id || !name) return fail(400, { swimLevelError: 'Name is required.' });
		await db.update(swimLevelSettings).set({ name, description: description || null }).where(eq(swimLevelSettings.id, id));
		return { swimLevelSuccess: true };
	},

	deleteSwimLevel: async ({ request }) => {
		const fd = await request.formData();
		const id = Number(fd.get('id'));
		if (!id) return fail(400, { swimLevelError: 'Invalid level.' });
		await db.delete(swimLevelSettings).where(eq(swimLevelSettings.id, id));
		return { swimLevelSuccess: true };
	},

	archiveSeason: async ({ request }) => {
		const fd = await request.formData();
		const label = fd.get('label')?.toString().trim() ?? '';
		if (!label) return fail(400, { archiveError: 'Season label is required.' });

		const allContributions = await db.select().from(contributions);
		const allChildren = await db.select().from(children);
		const allLinks = await db.select().from(childVolunteerLinks);
		const allVolunteers = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email }).from(users).where(eq(users.role, 'volunteer'));

		const snapshot = JSON.stringify({ contributions: allContributions, children: allChildren, links: allLinks, volunteer: allVolunteers });
		await db.insert(seasonArchives).values({ label, data: snapshot });
		await db.delete(contributions);

		return { archiveSuccess: true };
	}
};
