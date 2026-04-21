// CSV export — organizer downloads all children + hours data
import { db } from '$lib/server/db';
import { users, children, childParentLinks, contributions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getHoursRequired } from '$lib/server/settings';

//It's an api to handle csv export
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'organizer') throw error(403, 'Unauthorized');

	const allChildren = await db.select().from(children);
	const allLinks = await db.select().from(childParentLinks);
	const allParents = await db.select().from(users).where(eq(users.role, 'parent'));
	const allContributions = await db.select().from(contributions);

	const rows: string[][] = [['Child Name', 'Status', 'Level', 'Required Hours', 'Total Hours', 'Remaining', 'Complete', 'Linked Volunteers']];

	for (const child of allChildren) {
		const required = await getHoursRequired(child.status);
		const links = allLinks.filter(l => l.childId === child.id);
		const parentIds = links.map(l => l.userId);
		const parentNames = parentIds.map(pid => {
			const p = allParents.find(u => u.id === pid);
			return p ? `${p.firstName} ${p.lastName}` : 'Unknown';
		});

		let totalHours = 0;
		for (const pid of parentIds) {
			totalHours += allContributions.filter(c => c.userId === pid).reduce((sum, c) => sum + parseFloat(c.hours ?? '0'), 0);
		}
		totalHours = Math.round(totalHours * 100) / 100;

		rows.push([
			`${child.firstName} ${child.lastName}`,
			child.status === 'tryout' ? 'Tryout' : 'Full Member',
			child.level ?? '', required.toString(), totalHours.toString(),
			Math.max(0, required - totalHours).toString(),
			totalHours >= required ? 'Yes' : 'No',
			parentNames.join('; ')
		]);
	}

	const csv = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': `attachment; filename="volunteer-data-${new Date().toISOString().split('T')[0]}.csv"`
		}
	});
};
