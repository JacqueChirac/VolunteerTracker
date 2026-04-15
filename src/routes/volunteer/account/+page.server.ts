// account page — manage children (add/link/unlink) + change password
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { children, childParentLinks, contributions, users } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { hashSync, compareSync } from 'bcrypt-ts';
import { getHoursRequired } from '$lib/server/settings';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user!.id;
	const links = await db.select().from(childParentLinks).where(eq(childParentLinks.userId, userId));
	const childIds = links.map(l => l.childId);

	let childrenWithProgress: Array<{
		id: number; firstName: string; lastName: string; level: string | null;
		status: 'full_member' | 'tryout'; totalHours: number; requiredHours: number;
	}> = [];

	if (childIds.length > 0) {
		const childRecords = await db.select().from(children)
			.where(sql`${children.id} IN (${sql.join(childIds.map(id => sql`${id}`), sql`, `)})`);

		for (const child of childRecords) {
			const allLinks = await db.select().from(childParentLinks).where(eq(childParentLinks.childId, child.id));
			let totalHours = 0;
			for (const l of allLinks) {
				const parentContribs = await db.select().from(contributions).where(eq(contributions.userId, l.userId));
				for (const c of parentContribs) totalHours += parseFloat(c.hours ?? '0');
			}
			childrenWithProgress.push({
				id: child.id, firstName: child.firstName, lastName: child.lastName,
				level: child.level, status: child.status,
				totalHours: Math.round(totalHours * 100) / 100,
				requiredHours: await getHoursRequired(child.status)
			});
		}
	}

	const allChildren = await db.select().from(children);
	const unlinkedChildren = allChildren.filter(c => !childIds.includes(c.id));

	return { children: childrenWithProgress, allChildren: unlinkedChildren };
};

export const actions: Actions = {
	addChild: async ({ request, locals }) => {
		const fd = await request.formData();
		const firstName = fd.get('firstName')?.toString().trim() ?? '';
		const lastName = fd.get('lastName')?.toString().trim() ?? '';
		const level = fd.get('level')?.toString().trim() ?? '';
		const status = fd.get('status')?.toString() as 'full_member' | 'tryout' ?? 'full_member';

		if (!firstName || !lastName) return fail(400, { error: 'First and last name are required.' });

		const [child] = await db.insert(children).values({ firstName, lastName, level: level || null, status: status || 'full_member' }).returning();
		await db.insert(childParentLinks).values({ childId: child.id, userId: locals.user!.id });
		return { success: true };
	},

	unlinkChild: async ({ request, locals }) => {
		const fd = await request.formData();
		const childId = Number(fd.get('childId'));
		if (!childId) return fail(400, { error: 'Invalid child.' });
		const links = await db.select().from(childParentLinks).where(eq(childParentLinks.userId, locals.user!.id));
		const link = links.find(l => l.childId === childId);
		if (link) await db.delete(childParentLinks).where(eq(childParentLinks.id, link.id));
		return { unlinkSuccess: true };
	},

	linkChild: async ({ request, locals }) => {
		const fd = await request.formData();
		const childId = Number(fd.get('childId'));
		if (!childId) return fail(400, { error: 'Please select a child.' });
		const existing = await db.select().from(childParentLinks).where(eq(childParentLinks.userId, locals.user!.id));
		if (existing.some(l => l.childId === childId)) return fail(400, { error: 'Already linked.' });
		await db.insert(childParentLinks).values({ childId, userId: locals.user!.id });
		return { linkSuccess: true };
	},

	changePassword: async ({ request, locals }) => {
		const fd = await request.formData();
		const currentPassword = fd.get('currentPassword')?.toString() ?? '';
		const newPassword = fd.get('newPassword')?.toString() ?? '';
		if (!currentPassword || !newPassword) return fail(400, { passwordError: 'Both fields are required.' });
		if (newPassword.length < 4) return fail(400, { passwordError: 'New password must be at least 4 characters.' });

		const [user] = await db.select().from(users).where(eq(users.id, locals.user!.id));
		if (!compareSync(currentPassword, user.passwordHash)) return fail(400, { passwordError: 'Current password is incorrect.' });

		await db.update(users).set({ passwordHash: hashSync(newPassword, 10) }).where(eq(users.id, locals.user!.id));
		return { passwordSuccess: true };
	}
};
