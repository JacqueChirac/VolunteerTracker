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

	// Add up each volunteer's hours once up front; the maps below reuse this lookup.
	const hoursByVol: Record<number, number> = {};
	for (const c of allContributions) {
		hoursByVol[c.userId] = (hoursByVol[c.userId] ?? 0) + parseFloat(c.hours ?? '0');
	}

	// build both directions of the child<->volunteer link map in one pass
	const volsByChild: Record<number, number[]> = {};
	const childrenByVol: Record<number, number[]> = {};
	for (const l of allLinks) {
		(volsByChild[l.childId] ??= []).push(l.userId);
		(childrenByVol[l.userId] ??= []).push(l.childId);
	}

	const volunteers = allVolunteers.map((v) => {
		const totalHours = Math.round((hoursByVol[v.id] ?? 0) * 100) / 100;
		const childIds = childrenByVol[v.id] ?? [];
		return {
			id: v.id,
			firstName: v.firstName,
			lastName: v.lastName,
			email: v.email,
			totalHours,
			manuallyApproved: v.manuallyApproved,
			children: childIds
				.map((cid) => {
					const c = allChildren.find((x) => x.id === cid);
					if (!c) return null;
					const required = c.status === 'tryout' ? hoursTryout : hoursFullMember;
					const childVolIds = volsByChild[c.id] ?? [];
					const childHours = Math.round(childVolIds.reduce((s, vid) => s + (hoursByVol[vid] ?? 0), 0) * 100) / 100;
					return { id: c.id, firstName: c.firstName, lastName: c.lastName, status: c.status, totalHours: childHours, requiredHours: required };
				})
				.filter(Boolean) as { id: number; firstName: string; lastName: string; status: string; totalHours: number; requiredHours: number }[]
		};
	});

	const childrenData = allChildren.map((child) => {
		const required = child.status === 'tryout' ? hoursTryout : hoursFullMember;
		// A child's progress counts the hours of every volunteer linked to them, not just one parent.
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
			complete: totalHours >= required,
			volunteerNames: volIds.map((vid) => {
				const vol = allVolunteers.find((u) => u.id === vid);
				return vol ? `${vol.firstName} ${vol.lastName}` : '?';
			})
		};
	});

	return { volunteers, childrenData };
};
