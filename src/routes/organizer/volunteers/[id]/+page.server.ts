// individual volunteer profile — server logic for viewing + editing children
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { users, children, childVolunteerLinks, contributions, activityTypes } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { getHoursRequired } from '$lib/server/settings';

export const load: PageServerLoad = async ({ params }) => {
	const userId = Number(params.id);
	const [volunteer] = await db.select().from(users).where(eq(users.id, userId));
	if (!volunteer || volunteer.role !== 'volunteer') throw error(404, 'Volunteer not found');

	const allActivities = await db.select().from(activityTypes);
	const activityMap = new Map(allActivities.map(a => [a.id, a.name]));

	const contribs = await db.select().from(contributions).where(eq(contributions.userId, userId)).orderBy(desc(contributions.date));
	const contributionsWithActivity = contribs.map(c => ({ ...c, activityName: c.activityId ? activityMap.get(c.activityId) ?? null : null }));

	const links = await db.select().from(childVolunteerLinks).where(eq(childVolunteerLinks.userId, userId));
	const childrenData = [];
	for (const link of links) {
		const [child] = await db.select().from(children).where(eq(children.id, link.childId));
		if (!child) continue;
		const allLinks = await db.select().from(childVolunteerLinks).where(eq(childVolunteerLinks.childId, child.id));
		let totalHours = 0;
		for (const l of allLinks) {
			const c = await db.select().from(contributions).where(eq(contributions.userId, l.userId));
			totalHours += c.reduce((sum, x) => sum + parseFloat(x.hours ?? '0'), 0);
		}
		childrenData.push({ ...child, totalHours: Math.round(totalHours * 100) / 100, requiredHours: await getHoursRequired(child.status) });
	}

	const totalHours = contribs.reduce((sum, c) => sum + parseFloat(c.hours ?? '0'), 0);

	return {
		volunteer: { id: volunteer.id, firstName: volunteer.firstName, lastName: volunteer.lastName, email: volunteer.email },
		contributions: contributionsWithActivity,
		children: childrenData,
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
	}
};
