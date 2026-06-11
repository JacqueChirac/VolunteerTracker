// organizer single-event view — full info + who signed up, so the organizer
// can see registrants and email them
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { events, eventSignups, users, contributions } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { isEventPast } from '$lib/formatEventDate';

export const load: PageServerLoad = async ({ params }) => {
	const eventId = Number(params.id);
	if (!eventId) throw error(404, 'Event not found');

	const [event] = await db.select().from(events).where(eq(events.id, eventId));
	if (!event) throw error(404, 'Event not found');

	const signups = await db
		.select()
		.from(eventSignups)
		.where(eq(eventSignups.eventId, eventId))
		.orderBy(asc(eventSignups.signedUpAt));

	const allUsers = await db
		.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
		.from(users);
	const byId = new Map(allUsers.map((u) => [u.id, u]));

	// hours logged against this event, per volunteer (useful for past events)
	const contribs = await db.select().from(contributions).where(eq(contributions.eventId, eventId));
	const hoursByUser: Record<number, number> = {};
	for (const c of contribs) {
		hoursByUser[c.userId] = (hoursByUser[c.userId] ?? 0) + parseFloat(c.hours ?? '0');
	}

	const registrants = signups
		.map((s) => {
			const u = byId.get(s.userId);
			if (!u) return null;
			return {
				id: u.id,
				firstName: u.firstName,
				lastName: u.lastName,
				email: u.email,
				signedUpAt: s.signedUpAt,
				hours: Math.round((hoursByUser[u.id] ?? 0) * 100) / 100
			};
		})
		.filter((r): r is NonNullable<typeof r> => r !== null);

	return { event, registrants, isPast: isEventPast(event) };
};
