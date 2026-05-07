// individual volunteer profile — server logic for viewing + editing children
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { users, children, childVolunteerLinks, contributions, activityTypes } from '$lib/server/db/schema';
import { eq, desc, asc, and } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { getHoursRequired } from '$lib/server/settings';

export const load: PageServerLoad = async ({ params }) => {
	const userId = Number(params.id);
	const [volunteer] = await db.select().from(users).where(eq(users.id, userId));
	if (!volunteer || volunteer.role !== 'volunteer') throw error(404, 'Volunteer not found');

	const allActivities = await db.select().from(activityTypes);
	const activityMap = new Map(allActivities.map(a => [a.id, a.name]));

	const contribs = await db.select().from(contributions).where(eq(contributions.userId, userId)).orderBy(desc(contributions.date));
	const contributionsWithActivity = contribs.map(c => ({ ...c, activityName: c.activityId ? activityMap.get(c.activityId) ?? null : null }));

	const [links, allChildren, allContribs, allLinks2] = await Promise.all([
		db.select().from(childVolunteerLinks).where(eq(childVolunteerLinks.userId, userId)),
		db.select().from(children).orderBy(asc(children.firstName)),
		db.select().from(contributions),
		db.select().from(childVolunteerLinks),
	]);

	const linkedChildIds = new Set(links.map(l => l.childId));

	const hoursByVol: Record<number, number> = {};
	for (const c of allContribs) {
		hoursByVol[c.userId] = (hoursByVol[c.userId] ?? 0) + parseFloat(c.hours ?? '0');
	}

	const childrenData = [];
	for (const childId of linkedChildIds) {
		const child = allChildren.find(c => c.id === childId);
		if (!child) continue;
		const volIdsForChild = allLinks2.filter(l => l.childId === childId).map(l => l.userId);
		const totalHoursForChild = Math.round(volIdsForChild.reduce((s, vid) => s + (hoursByVol[vid] ?? 0), 0) * 100) / 100;
		childrenData.push({ ...child, totalHours: totalHoursForChild, requiredHours: await getHoursRequired(child.status) });
	}

	const totalHours = contribs.reduce((sum, c) => sum + parseFloat(c.hours ?? '0'), 0);

	return {
		volunteer: { id: volunteer.id, firstName: volunteer.firstName, lastName: volunteer.lastName, email: volunteer.email, manuallyApproved: volunteer.manuallyApproved },
		contributions: contributionsWithActivity,
		children: childrenData,
		allChildren,
		linkedChildIds: [...linkedChildIds],
		totalHours: Math.round(totalHours * 100) / 100
	};
};

export const actions: Actions = {
	editChild: async ({ request }) => {
		const fd = await request.formData();
		const childId = Number(fd.get('childId'));
		const level = fd.get('level')?.toString().trim() ?? '';
		const status = fd.get('status')?.toString() as 'full_member' | 'tryout';
		if (!childId) return fail(400, { error: 'Invalid child.' });
		await db.update(children).set({ level: level || null, status: status || 'full_member' }).where(eq(children.id, childId));
		return { editChildSuccess: true };
	},

	toggleApproval: async ({ params }) => {
		const userId = Number(params.id);
		const [volunteer] = await db.select().from(users).where(eq(users.id, userId));
		if (!volunteer) return fail(404, { error: 'Volunteer not found.' });
		await db.update(users).set({ manuallyApproved: !volunteer.manuallyApproved }).where(eq(users.id, userId));
		return { toggleSuccess: true };
	},

	linkChild: async ({ request, params }) => {
		const fd = await request.formData();
		const childId = Number(fd.get('childId'));
		const userId = Number(params.id);
		if (!childId || !userId) return fail(400, { linkError: 'Invalid child or volunteer.' });
		const existing = await db.select().from(childVolunteerLinks)
			.where(and(eq(childVolunteerLinks.childId, childId), eq(childVolunteerLinks.userId, userId)));
		if (existing.length > 0) return fail(400, { linkError: 'Already linked.' });
		await db.insert(childVolunteerLinks).values({ childId, userId });
		return { linkSuccess: true };
	},

	unlinkChild: async ({ request, params }) => {
		const fd = await request.formData();
		const childId = Number(fd.get('childId'));
		const userId = Number(params.id);
		if (!childId || !userId) return fail(400, { linkError: 'Invalid child or volunteer.' });
		await db.delete(childVolunteerLinks)
			.where(and(eq(childVolunteerLinks.childId, childId), eq(childVolunteerLinks.userId, userId)));
		return { unlinkSuccess: true };
	},

	deleteVolunteer: async ({ params }) => {
		const userId = Number(params.id);
		await db.delete(users).where(eq(users.id, userId));
		redirect(302, '/organizer/volunteers');
	},

};


