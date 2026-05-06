import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, children, childVolunteerLinks, contributions } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import { getHoursRequired } from '$lib/server/settings';

export const load: PageServerLoad = async () => {
	const [allVolunteers, allChildren, allLinks, allContributions] = await Promise.all([
		db.select().from(users).where(eq(users.role, 'volunteer')).orderBy(asc(users.firstName)),
		db.select().from(children).orderBy(asc(children.firstName)),
		db.select().from(childVolunteerLinks),
		db.select().from(contributions)
	]);

	const [hoursFullMember, hoursTryout] = await Promise.all([
		getHoursRequired('full_member'),
		getHoursRequired('tryout')
	]);

	// hours logged per volunteer
	const hoursByVol: Record<number, number> = {};
	for (const c of allContributions) {
		hoursByVol[c.userId] = (hoursByVol[c.userId] ?? 0) + parseFloat(c.hours ?? '0');
	}

	// link maps
	const volsByChild: Record<number, number[]> = {};
	const childrenByVol: Record<number, number[]> = {};
	for (const l of allLinks) {
		(volsByChild[l.childId] ??= []).push(l.userId);
		(childrenByVol[l.userId] ??= []).push(l.childId);
	}

	const childrenData = allChildren.map((child) => {
		const required = child.status === 'tryout' ? hoursTryout : hoursFullMember;
		const volIds = volsByChild[child.id] ?? [];
		const totalHours = Math.round(volIds.reduce((s, vid) => s + (hoursByVol[vid] ?? 0), 0) * 100) / 100;
		return {
			id: child.id,
			firstName: child.firstName,
			lastName: child.lastName,
			status: child.status,
			level: child.level ?? '',
			totalHours,
			requiredHours: required,
			remaining: Math.max(0, required - totalHours),
			complete: totalHours >= required,
			volunteerNames: volIds.map((vid) => {
				const v = allVolunteers.find((u) => u.id === vid);
				return v ? `${v.firstName} ${v.lastName}` : '?';
			})
		};
	});

	const volunteersData = allVolunteers.map((v) => {
		const totalHours = Math.round((hoursByVol[v.id] ?? 0) * 100) / 100;
		const childIds = childrenByVol[v.id] ?? [];
		return {
			id: v.id,
			firstName: v.firstName,
			lastName: v.lastName,
			email: v.email,
			totalHours,
			manuallyApproved: v.manuallyApproved,
			linkedChildren: childIds
				.map((cid) => {
					const c = allChildren.find((x) => x.id === cid);
					return c ? { firstName: c.firstName, lastName: c.lastName, status: c.status } : null;
				})
				.filter(Boolean) as { firstName: string; lastName: string; status: string }[]
		};
	});

	return { childrenData, volunteersData };
};
