// individual volunteer profile — server logic for viewing + editing children
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { users, children, childVolunteerLinks, contributions, activityTypes, eventSignups } from '$lib/server/db/schema';
import { eq, desc, asc, and } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { getHoursRequired } from '$lib/server/settings';
import { recordAction, chInsert, chUpdate, chDelete } from '$lib/server/undo';

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
	editChild: async ({ request, locals }) => {
		const fd = await request.formData();
		const childId = Number(fd.get('childId'));
		const level = fd.get('level')?.toString().trim() ?? '';
		const status = fd.get('status')?.toString() as 'full_member' | 'tryout';
		if (!childId) return fail(400, { error: 'Invalid child.' });
		const [before] = await db.select().from(children).where(eq(children.id, childId));
		if (!before) return fail(400, { error: 'Child not found.' });
		const after = { ...before, level: level || null, status: status || 'full_member' };
		await db.update(children).set({ level: level || null, status: status || 'full_member' }).where(eq(children.id, childId));
		await recordAction(String(locals.user!.id), `Edit ${before.firstName} ${before.lastName}`, [chUpdate('children', before, after)]);
		return { editChildSuccess: true, success: true, undoable: true, message: `Updated ${before.firstName} ${before.lastName}.` };
	},

	toggleApproval: async ({ params, locals }) => {
		const userId = Number(params.id);
		const [volunteer] = await db.select().from(users).where(eq(users.id, userId));
		if (!volunteer) return fail(404, { error: 'Volunteer not found.' });
		const after = { ...volunteer, manuallyApproved: !volunteer.manuallyApproved };
		await db.update(users).set({ manuallyApproved: !volunteer.manuallyApproved }).where(eq(users.id, userId));
		await recordAction(String(locals.user!.id), `${after.manuallyApproved ? 'Approve' : 'Unapprove'} ${volunteer.firstName} ${volunteer.lastName}`, [chUpdate('users', volunteer, after)]);
		return { toggleSuccess: true, success: true, undoable: true, message: `${after.manuallyApproved ? 'Approved' : 'Unapproved'} ${volunteer.firstName}.` };
	},

	linkChild: async ({ request, params, locals }) => {
		const fd = await request.formData();
		const childId = Number(fd.get('childId'));
		const userId = Number(params.id);
		if (!childId || !userId) return fail(400, { linkError: 'Invalid child or volunteer.' });
		const existing = await db.select().from(childVolunteerLinks)
			.where(and(eq(childVolunteerLinks.childId, childId), eq(childVolunteerLinks.userId, userId)));
		if (existing.length > 0) return fail(400, { linkError: 'Already linked.' });
		const [row] = await db.insert(childVolunteerLinks).values({ childId, userId }).returning();
		await recordAction(String(locals.user!.id), 'Link child', [chInsert('childVolunteerLinks', row)]);
		return { linkSuccess: true, success: true, undoable: true, message: 'Linked child.' };
	},

	unlinkChild: async ({ request, params, locals }) => {
		const fd = await request.formData();
		const childId = Number(fd.get('childId'));
		const userId = Number(params.id);
		if (!childId || !userId) return fail(400, { linkError: 'Invalid child or volunteer.' });
		const rows = await db.select().from(childVolunteerLinks)
			.where(and(eq(childVolunteerLinks.childId, childId), eq(childVolunteerLinks.userId, userId)));
		await db.delete(childVolunteerLinks)
			.where(and(eq(childVolunteerLinks.childId, childId), eq(childVolunteerLinks.userId, userId)));
		if (rows.length > 0) {
			await recordAction(String(locals.user!.id), 'Unlink child', rows.map((r) => chDelete('childVolunteerLinks', r)));
		}
		return { unlinkSuccess: true, success: true, undoable: rows.length > 0, message: 'Unlinked child.' };
	},

	deleteVolunteer: async ({ params, locals }) => {
		const userId = Number(params.id);
		const [volunteer] = await db.select().from(users).where(eq(users.id, userId));
		if (!volunteer) return fail(404, { error: 'Volunteer not found.' });

		// capture cascade: links, signups, contributions all deleted with the user
		const [links, signups, contribs] = await Promise.all([
			db.select().from(childVolunteerLinks).where(eq(childVolunteerLinks.userId, userId)),
			db.select().from(eventSignups).where(eq(eventSignups.userId, userId)),
			db.select().from(contributions).where(eq(contributions.userId, userId)),
		]);

		const changes = [
			chDelete('users', volunteer),
			...links.map((l) => chDelete('childVolunteerLinks', l)),
			...signups.map((s) => chDelete('eventSignups', s)),
			...contribs.map((c) => chDelete('contributions', c)),
		];

		await db.delete(users).where(eq(users.id, userId));
		await recordAction(String(locals.user!.id), `Delete ${volunteer.firstName} ${volunteer.lastName}`, changes);
		redirect(302, '/organizer/volunteers');
	},

};


