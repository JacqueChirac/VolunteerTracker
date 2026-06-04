// organizer events dashboard — loads events, handles add/edit/delete
import type { PageServerLoad, Actions } from "./$types";
import { db } from "$lib/server/db";
import { events, eventSignups, contributions } from "$lib/server/db/schema";
import { desc, eq } from "drizzle-orm";
import { fail } from "@sveltejs/kit";
import { today, daysFromNow } from "$lib/dateBounds";
import { recordAction, chInsert, chUpdate, chDelete } from "$lib/server/undo";

export const load: PageServerLoad = async () => {
  const allEvents = await db.select().from(events).orderBy(desc(events.date));
  const allSignups = await db.select().from(eventSignups);

  const signupCounts: Record<number, number> = {};
  for (const s of allSignups) {
    signupCounts[s.eventId] = (signupCounts[s.eventId] || 0) + 1;
  }

  return {
    events: allEvents.map((e) => ({
      ...e,
      signupCount: signupCounts[e.id] || 0,
    })),
  };
};

export const actions: Actions = {
  addEvent: async ({ request, locals }) => {
    const fd = await request.formData();
    const title = fd.get("title")?.toString().trim() ?? "";
    const date = fd.get("date")?.toString() ?? "";
    const startTime = fd.get("startTime")?.toString() ?? "";
    const endTime = fd.get("endTime")?.toString() ?? "";
    const location = fd.get("location")?.toString().trim() ?? "";
    const description = fd.get("description")?.toString().trim() ?? "";
    const neededRaw = fd.get("volunteersNeeded")?.toString().trim() ?? "";
    const volunteersNeeded = neededRaw === "" ? null : Number(neededRaw);
    if (volunteersNeeded !== null && (!Number.isInteger(volunteersNeeded) || volunteersNeeded < 0)) {
      return fail(400, { error: "People needed must be a non-negative whole number." });
    }

    if (!title || !date || !startTime) {
      return fail(400, { error: "Title, date, and start time are required." });
    }
    const min = today(),
      max = daysFromNow(730);
    if (date < min)
      return fail(400, { error: "Event date cannot be in the past." });
    if (date > max)
      return fail(400, {
        error: "Event date is too far in the future (max 2 years).",
      });

    const [row] = await db
      .insert(events)
      .values({
        title,
        date,
        startTime,
        endTime: endTime || null,
        location: location || null,
        description: description || null,
        volunteersNeeded,
      })
      .returning();

    await recordAction(String(locals.user!.id), `Add event "${title}"`, [
      chInsert("events", row),
    ]);
    return { success: true, undoable: true, message: `Added event "${title}".` };
  },

  editEvent: async ({ request, locals }) => {
    const fd = await request.formData();
    const id = Number(fd.get("id"));
    const title = fd.get("title")?.toString().trim() ?? "";
    const date = fd.get("date")?.toString() ?? "";
    const startTime = fd.get("startTime")?.toString() ?? "";
    const endTime = fd.get("endTime")?.toString() ?? "";
    const location = fd.get("location")?.toString().trim() ?? "";
    const description = fd.get("description")?.toString().trim() ?? "";
    const neededRaw = fd.get("volunteersNeeded")?.toString().trim() ?? "";
    const volunteersNeeded = neededRaw === "" ? null : Number(neededRaw);
    if (volunteersNeeded !== null && (!Number.isInteger(volunteersNeeded) || volunteersNeeded < 0)) {
      return fail(400, { error: "People needed must be a non-negative whole number." });
    }

    if (!id || !title || !date || !startTime) {
      return fail(400, { error: "Missing required fields." });
    }

    const [before] = await db.select().from(events).where(eq(events.id, id));
    if (!before) return fail(400, { error: "Event not found." });

    const after = {
      ...before,
      title,
      date,
      startTime,
      endTime: endTime || null,
      location: location || null,
      description: description || null,
      volunteersNeeded,
    };

    await db
      .update(events)
      .set({
        title,
        date,
        startTime,
        endTime: endTime || null,
        location: location || null,
        description: description || null,
        volunteersNeeded,
      })
      .where(eq(events.id, id));

    await recordAction(String(locals.user!.id), `Edit event "${title}"`, [
      chUpdate("events", before, after),
    ]);
    return { success: true, undoable: true, message: `Updated event "${title}".` };
  },

  deleteEvent: async ({ request, locals }) => {
    const fd = await request.formData();
    const eventId = Number(fd.get("eventId"));
    if (!eventId) return fail(400, { error: "Invalid event." });

    const [eventRow] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));
    if (!eventRow) return fail(400, { error: "Event not found." });

    // capture cascade: signups are deleted; contributions have eventId nulled
    const signups = await db
      .select()
      .from(eventSignups)
      .where(eq(eventSignups.eventId, eventId));
    const linkedContribs = await db
      .select()
      .from(contributions)
      .where(eq(contributions.eventId, eventId));

    const changes = [
      chDelete("events", eventRow),
      ...signups.map((s) => chDelete("eventSignups", s)),
      ...linkedContribs.map((c) => chUpdate("contributions", c, { ...c, eventId: null })),
    ];

    await db.delete(events).where(eq(events.id, eventId));

    await recordAction(String(locals.user!.id), `Delete event "${eventRow.title}"`, changes);
    return { success: true, undoable: true, message: `Deleted event "${eventRow.title}".` };
  },
};
