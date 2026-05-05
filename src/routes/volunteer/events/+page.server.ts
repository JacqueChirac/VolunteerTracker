// events list — loads upcoming events with signup status
import type { PageServerLoad, Actions } from "./$types";
import { db } from "$lib/server/db";
import { events, eventSignups } from "$lib/server/db/schema";
import { eq, asc } from "drizzle-orm";
import { fail } from "@sveltejs/kit";
import { contributions } from "$lib/server/db/schema";

// Loads data such as what users signed up for what events and links when page laods
export const load: PageServerLoad = async ({ locals }) => {
  const allEvents = await db.select().from(events).orderBy(asc(events.date));

  const userSignups = await db
    .select()
    .from(eventSignups)
    .where(eq(eventSignups.userId, locals.user!.id));
  const signedUpEventIds = new Set(userSignups.map((s) => s.eventId));

  const allSignups = await db.select().from(eventSignups);
  const signupCounts: Record<number, number> = {};

  const myContribs = await db
    .select()
    .from(contributions)
    .where(eq(contributions.userId, locals.user!.id));
  const hoursByEvent: Record<number, number> = {};
  for (const c of myContribs) {
    if (c.eventId)
      hoursByEvent[c.eventId] =
        (hoursByEvent[c.eventId] || 0) + parseFloat(c.hours ?? "0");
  }
  for (const s of allSignups)
    signupCounts[s.eventId] = (signupCounts[s.eventId] || 0) + 1;

  return {
    events: allEvents.map((e) => ({
      ...e,
      signedUp: signedUpEventIds.has(e.id),
      signupCount: signupCounts[e.id] || 0,    
      myHours: hoursByEvent[e.id] || 0  
    })),
  };
};

//Sign up event button backend
export const actions: Actions = {
  signup: async ({ request, locals }) => {
    const fd = await request.formData();
    const eventId = Number(fd.get("eventId"));
    if (!eventId) return fail(400, { error: "Invalid event." });
    const existing = await db
      .select()
      .from(eventSignups)
      .where(eq(eventSignups.userId, locals.user!.id));
    if (existing.some((s) => s.eventId === eventId))
      return fail(400, { error: "Already signed up." });
    await db.insert(eventSignups).values({ eventId, userId: locals.user!.id });
    return { success: true };
  },

  //Cancel sign up
  cancel: async ({ request, locals }) => {
    const fd = await request.formData();
    const eventId = Number(fd.get("eventId"));
    if (!eventId) return fail(400, { error: "Invalid event." });
    const userSignups = await db
      .select()
      .from(eventSignups)
      .where(eq(eventSignups.userId, locals.user!.id));
    const signup = userSignups.find((s) => s.eventId === eventId);
    if (signup)
      await db.delete(eventSignups).where(eq(eventSignups.id, signup.id));
    return { success: true };
  },
};
