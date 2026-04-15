// volunteers list — loads all parents with their children and hour progress
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, children, childParentLinks, contributions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getHoursRequired } from '$lib/server/settings';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search')?.toLowerCase() ?? '';
	let parents = await db.select().from(users).where(eq(users.role, 'parent'));

	if (search) {
		parents = parents.filter(p =>
			p.firstName.toLowerCase().includes(search) ||
			p.lastName.toLowerCase().includes(search) ||
			p.username.toLowerCase().includes(search)
		);
	}

	const volunteersData = [];
	for (const parent of parents) {
		const links = await db.select().from(childParentLinks).where(eq(childParentLinks.userId, parent.id));
		const parentContribs = await db.select().from(contributions).where(eq(contributions.userId, parent.id));
		const parentTotalHours = parentContribs.reduce((sum, c) => sum + parseFloat(c.hours ?? '0'), 0);

		const childrenInfo = [];
		for (const link of links) {
			const [child] = await db.select().from(children).where(eq(children.id, link.childId));
			if (!child) continue;
			const allLinks = await db.select().from(childParentLinks).where(eq(childParentLinks.childId, child.id));
			let totalHours = 0;
			for (const l of allLinks) {
				const contribs = await db.select().from(contributions).where(eq(contributions.userId, l.userId));
				totalHours += contribs.reduce((sum, c) => sum + parseFloat(c.hours ?? '0'), 0);
			}
			childrenInfo.push({
				id: child.id, firstName: child.firstName, lastName: child.lastName,
				status: child.status,
				totalHours: Math.round(totalHours * 100) / 100,
				requiredHours: await getHoursRequired(child.status)
			});
		}

		volunteersData.push({
			id: parent.id, firstName: parent.firstName, lastName: parent.lastName,
			username: parent.username,
			totalHours: Math.round(parentTotalHours * 100) / 100,
			children: childrenInfo
		});
	}

	return { volunteers: volunteersData, search };
};
