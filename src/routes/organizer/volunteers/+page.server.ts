// volunteers list — loads all volunteers with their linked children and hour progress
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, children, childVolunteerLinks, contributions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getHoursRequired } from '$lib/server/settings';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search')?.toLowerCase() ?? '';
	let volunteers = await db.select().from(users).where(eq(users.role, 'volunteer'));

	if (search) {
		volunteers = volunteers.filter(p =>
			p.firstName.toLowerCase().includes(search) ||
			p.lastName.toLowerCase().includes(search) ||
			p.email.toLowerCase().includes(search)
		);
	}

	const volunteersData = [];
	for (const volunteer of volunteers) {
		const links = await db.select().from(childVolunteerLinks).where(eq(childVolunteerLinks.userId, volunteer.id));
		const volunteerContribs = await db.select().from(contributions).where(eq(contributions.userId, volunteer.id));
		const volunteerTotalHours = volunteerContribs.reduce((sum, c) => sum + parseFloat(c.hours ?? '0'), 0);

		const childrenInfo = [];
		for (const link of links) {
			const [child] = await db.select().from(children).where(eq(children.id, link.childId));
			if (!child) continue;
			const allLinks = await db.select().from(childVolunteerLinks).where(eq(childVolunteerLinks.childId, child.id));
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
			id: volunteer.id, firstName: volunteer.firstName, lastName: volunteer.lastName,
			email: volunteer.email,
			totalHours: Math.round(volunteerTotalHours * 100) / 100,
			children: childrenInfo
		});
	}

	return { volunteers: volunteersData, search };
};
