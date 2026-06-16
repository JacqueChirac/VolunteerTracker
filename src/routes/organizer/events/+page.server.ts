// organizer events dashboard - loads events, handles add/edit/delete
import type { PageServerLoad, Actions } from "./$types";
import { db } from "$lib/server/db";
import { events, eventSignups, contributions } from "$lib/server/db/schema";
import { desc, eq } from "drizzle-orm";
import { fail } from "@sveltejs/kit";
import { today, daysFromNow } from "$lib/dateBounds";
import { recordAction, chInsert, chUpdate, chDelete } from "$lib/server/undo";

// Parses the form's date fields based on precision.
// day-precision: requires `date` (YYYY-MM-DD) and `startTime` (HH:MM)
// month-precision: requires `month` (YYYY-MM); stored as YYYY-MM-01, time optional
// `allowPast` is true for edits so organizers can fix typos on past events
// without being forced to push the date into the future.
function parseDateFields(fd: FormData, allowPast = false) {
  const precisionRaw = fd.get("datePrecision")?.toString() ?? "day";
  const precision = precisionRaw === "month" ? "month" : "day";
  const min = today();
  const max = daysFromNow(730);
  const monthMin = min.slice(0, 7);
  const monthMax = max.slice(0, 7);

  if (precision === "month") {
    const month = fd.get("month")?.toString() ?? "";
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return { ok: false, error: "A valid month is required." } as const;
    }
    if (!allowPast && month < monthMin) return { ok: false, error: "Event month cannot be in the past." } as const;
    if (month > monthMax) return { ok: false, error: "Event month is too far in the future (max 2 years)." } as const;
    return {
      ok: true,
      precision,
      date: `${month}-01`,
      startTime: null,
      endTime: null,
    } as const;
  }

  const date = fd.get("date")?.toString() ?? "";
  const startTime = fd.get("startTime")?.toString() ?? "";
  const endTime = fd.get("endTime")?.toString() ?? "";
  if (!date || !startTime) {
    return { ok: false, error: "Date and start time are required." } as const;
  }
  if (!allowPast && date < min) return { ok: false, error: "Event date cannot be in the past." } as const;
  if (date > max) return { ok: false, error: "Event date is too far in the future (max 2 years)." } as const;
  return {
    ok: true,
    precision,
    date,
    startTime,
    endTime: endTime || null,
  } as const;
}

export const load: PageServerLoad = async () => {
  const allEvents = await db.select().from(events).orderBy(desc(events.date));
  const allSignups = await db.select().from(eventSignups);

  // Tally how many people signed up for each event so the list can show
  // "X signed up" without a separate query per event.
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
    const location = fd.get("location")?.toString().trim() ?? "";
    const description = fd.get("description")?.toString().trim() ?? "";
    const neededRaw = fd.get("volunteersNeeded")?.toString().trim() ?? "";
    const volunteersNeeded = neededRaw === "" ? null : Number(neededRaw);
    if (volunteersNeeded !== null && (!Number.isInteger(volunteersNeeded) || volunteersNeeded < 0)) {
      return fail(400, { error: "People needed must be a non-negative whole number." });
    }
    if (!title) return fail(400, { error: "Title is required." });

    const parsed = parseDateFields(fd);
    if (!parsed.ok) return fail(400, { error: parsed.error });

    const [row] = await db
      .insert(events)
      .values({
        title,
        date: parsed.date,
        datePrecision: parsed.precision,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
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
    const location = fd.get("location")?.toString().trim() ?? "";
    const description = fd.get("description")?.toString().trim() ?? "";
    const neededRaw = fd.get("volunteersNeeded")?.toString().trim() ?? "";
    const volunteersNeeded = neededRaw === "" ? null : Number(neededRaw);
    if (volunteersNeeded !== null && (!Number.isInteger(volunteersNeeded) || volunteersNeeded < 0)) {
      return fail(400, { editId: id, error: "People needed must be a non-negative whole number." });
    }
    if (!id) return fail(400, { error: "Event id missing." });
    if (!title) return fail(400, { editId: id, error: "Title is required." });

    // allowPast = true: editing a past event for a typo shouldn't be blocked by the date check
    const parsed = parseDateFields(fd, true);
    if (!parsed.ok) return fail(400, { editId: id, error: parsed.error });

    // Grab the row as it is now so the undo log can store both the old and new
    // versions and roll the edit back if needed.
    const [before] = await db.select().from(events).where(eq(events.id, id));
    if (!before) return fail(400, { editId: id, error: "Event not found." });

    const after = {
      ...before,
      title,
      date: parsed.date,
      datePrecision: parsed.precision,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      location: location || null,
      description: description || null,
      volunteersNeeded,
    };

    await db
      .update(events)
      .set({
        title,
        date: parsed.date,
        datePrecision: parsed.precision,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
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
