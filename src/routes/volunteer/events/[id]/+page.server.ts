// single event detail - shows info, volunteers signed up, signup/cancel actions
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { events, eventSignups, users, contributions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const eventId = Number(params.id);
	const [event] = await db.select().from(events).where(eq(events.id, eventId));
	if (!event) throw error(404, 'Event not found');

	const signups = await db.select().from(eventSignups).where(eq(eventSignups.eventId, eventId));
	// Sum up hours logged against this event per volunteer, shown next to each
	// name once the event is past.
	const eventContribs = await db.select().from(contributions).where(eq(contributions.eventId, eventId));
	const hoursByUser: Record<number, number> = {};
	for (const c of eventContribs) {
		hoursByUser[c.userId] = (hoursByUser[c.userId] || 0) + parseFloat(c.hours ?? '0');
	}

	const volunteers = [];
	for (const s of signups) {
		const [user] = await db.select().from(users).where(eq(users.id, s.userId));
		if (user) volunteers.push({
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
			hours: hoursByUser[user.id] || 0
		});
	}

	const today = new Date().toISOString().split('T')[0];
	const isPast = event.date < today;

	return { event, volunteers, isPast, isSignedUp: signups.some(s => s.userId === locals.user!.id) };
};

export const actions: Actions = {
	signup: async ({ params, locals }) => {
		const eventId = Number(params.id);
		const existing = await db.select().from(eventSignups).where(eq(eventSignups.eventId, eventId));
		if (existing.some(s => s.userId === locals.user!.id)) return fail(400, { error: 'Already signed up.' });
		await db.insert(eventSignups).values({ eventId, userId: locals.user!.id });
		return { success: true };
	},
	cancel: async ({ params, locals }) => {
		const eventId = Number(params.id);
		const signups = await db.select().from(eventSignups).where(eq(eventSignups.eventId, eventId));
		const signup = signups.find(s => s.userId === locals.user!.id);
		if (signup) await db.delete(eventSignups).where(eq(eventSignups.id, signup.id));
		return { success: true };
	}
};
