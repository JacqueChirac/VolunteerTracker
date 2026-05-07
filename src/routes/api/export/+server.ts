// CSV export — organizer downloads all children + hours data
import { db } from "$lib/server/db";
import {
  users,
  children,
  childVolunteerLinks,
  contributions,
} from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getHoursRequired } from "$lib/server/settings";

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user || locals.user.role !== 'organizer') throw error(403, 'Unauthorized');

	const type = url.searchParams.get('type') ?? 'children';
	const date = new Date().toISOString().split('T')[0];

	const allVolunteers = await db.select().from(users).where(eq(users.role, 'volunteer'));
	const allContributions = await db.select().from(contributions);
	const allLinks = await db.select().from(childVolunteerLinks);

	if (type === 'volunteers') {
		const hoursByVol: Record<number, number> = {};
		for (const c of allContributions) {
			hoursByVol[c.userId] = (hoursByVol[c.userId] ?? 0) + parseFloat(c.hours ?? '0');
		}
		const childrenByVol: Record<number, number[]> = {};
		for (const l of allLinks) {
			(childrenByVol[l.userId] ??= []).push(l.childId);
		}
		const allChildren = await db.select().from(children);

		const rows: string[][] = [['First Name', 'Last Name', 'Email', 'Total Hours', 'Approved', 'Linked Children']];
		for (const v of allVolunteers) {
			const totalHours = Math.round((hoursByVol[v.id] ?? 0) * 100) / 100;
			const childNames = (childrenByVol[v.id] ?? []).map((cid) => {
				const c = allChildren.find((x) => x.id === cid);
				return c ? `${c.firstName} ${c.lastName}` : 'Unknown';
			});
			rows.push([v.firstName, v.lastName, v.email, totalHours.toString(), v.manuallyApproved ? 'Yes' : 'No', childNames.join('; ')]);
		}

		const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
		return new Response(csv, {
			headers: {
				'Content-Type': 'text/csv',
				'Content-Disposition': `attachment; filename="volunteers-${date}.csv"`
			}
		});
	}

	// default: children export
	const allChildren = await db.select().from(children);
	const [hoursFullMember, hoursTryout] = await Promise.all([
		getHoursRequired('full_member'),
		getHoursRequired('tryout')
	]);

	const hoursByVol: Record<number, number> = {};
	for (const c of allContributions) {
		hoursByVol[c.userId] = (hoursByVol[c.userId] ?? 0) + parseFloat(c.hours ?? '0');
	}
	const volsByChild: Record<number, number[]> = {};
	for (const l of allLinks) {
		(volsByChild[l.childId] ??= []).push(l.userId);
	}

	const rows: string[][] = [['Child Name', 'Status', 'Level', 'Required Hours', 'Total Hours', 'Remaining', 'Complete', 'Linked Volunteers']];
	for (const child of allChildren) {
		const required = child.status === 'tryout' ? hoursTryout : hoursFullMember;
		const volIds = volsByChild[child.id] ?? [];
		const totalHours = Math.round(volIds.reduce((s, vid) => s + (hoursByVol[vid] ?? 0), 0) * 100) / 100;
		const volunteerNames = volIds.map((pid) => {
			const p = allVolunteers.find((u) => u.id === pid);
			return p ? `${p.firstName} ${p.lastName}` : 'Unknown';
		});
		rows.push([
			`${child.firstName} ${child.lastName}`,
			child.status === 'tryout' ? 'Tryout' : 'Annual Member',
			child.level ?? '', required.toString(), totalHours.toString(),
			Math.max(0, required - totalHours).toString(),
			totalHours >= required ? 'Yes' : 'No',
			volunteerNames.join('; ')
		]);
	}

	const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': `attachment; filename="children-${date}.csv"`
		}
	});
};
