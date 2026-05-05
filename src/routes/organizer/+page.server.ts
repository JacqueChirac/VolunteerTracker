// organizer events dashboard — loads events, stats, handles add/edit/delete
import type { PageServerLoad, Actions } from "./$types";
import { db } from "$lib/server/db";
import {
  events,
  eventSignups,
  activityTypes,
  users,
  children,
  childVolunteerLinks,
  contributions,
} from "$lib/server/db/schema";
import { desc, eq } from "drizzle-orm";
import { fail } from "@sveltejs/kit";
import { getHoursRequired } from "$lib/server/settings";
import { today, daysFromNow } from "$lib/dateBounds";

export const load: PageServerLoad = async () => {
  const allEvents = await db.select().from(events).orderBy(desc(events.date));
  const allSignups = await db.select().from(eventSignups);

  // count signups per event
  const signupCounts: Record<number, number> = {};
  for (const s of allSignups) {
    signupCounts[s.eventId] = (signupCounts[s.eventId] || 0) + 1;
  }

  // dashboard stats
  const allVolunteers = await db
    .select()
    .from(users)
    .where(eq(users.role, "volunteer"));
  const allContributions = await db.select().from(contributions);
  const allChildren = await db.select().from(children);
  const allLinks = await db.select().from(childVolunteerLinks);

  const totalHours = allContributions.reduce(
    (sum, c) => sum + parseFloat(c.hours ?? "0"),
    0,
  );

  let childrenMet = 0;
  for (const child of allChildren) {
    const links = allLinks.filter((l) => l.childId === child.id);
    let childHours = 0;
    for (const link of links) {
      childHours += allContributions
        .filter((c) => c.userId === link.userId)
        .reduce((sum, c) => sum + parseFloat(c.hours ?? "0"), 0);
    }
    const required = await getHoursRequired(child.status);
    if (childHours >= required) childrenMet++;
  }

  const activeActivities = await db
    .select()
    .from(activityTypes)
    .where(eq(activityTypes.active, true));

  return {
    events: allEvents.map((e) => ({
      ...e,
      signupCount: signupCounts[e.id] || 0,
    })),
    activityTypes: activeActivities,
    stats: {
      totalVolunteers: allVolunteers.length,
      totalHours: Math.round(totalHours * 100) / 100,
      childrenMet,
      childrenTotal: allChildren.length,
    },
  };
};

export const actions: Actions = {
  addEvent: async ({ request }) => {
    const fd = await request.formData();
    const title = fd.get("title")?.toString().trim() ?? "";
    const date = fd.get("date")?.toString() ?? "";
    const startTime = fd.get("startTime")?.toString() ?? "";
    const endTime = fd.get("endTime")?.toString() ?? "";
    const location = fd.get("location")?.toString().trim() ?? "";
    const description = fd.get("description")?.toString().trim() ?? "";
    const type = fd.get("type")?.toString() ?? "other";

    if (!title || !date || !startTime) {
      return fail(400, { error: "Title, date, and start time are required." });
    }
    //Date constraints for events
    const min = today(),
      max = daysFromNow(730);
    if (date < min)
      return fail(400, { error: "Event date cannot be in the past." });
    if (date > max)
      return fail(400, {
        error: "Event date is too far in the future (max 2 years).",
      });

    await db.insert(events).values({
      title,
      date,
      startTime,
      endTime: endTime || null,
      location: location || null,
      description: description || null,
      type: type || "other",
    });

    return { success: true };
  },

  deleteEvent: async ({ request }) => {
    const fd = await request.formData();
    const eventId = Number(fd.get("eventId"));
    if (!eventId) return fail(400, { error: "Invalid event." });
    await db.delete(events).where(eq(events.id, eventId));
    return { success: true };
  },
};
