// log hours — volunteer logs hours or donations
import type { PageServerLoad, Actions } from "./$types";
import { db } from "$lib/server/db";
import { eq, desc, inArray, and} from "drizzle-orm";
import { fail } from "@sveltejs/kit";
import { getDonationRate } from "$lib/server/settings";
import { today, daysAgo } from "$lib/dateBounds";
import { activityTypes, contributions, events, eventSignups } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ locals }) => {
  const activities = await db
    .select()
    .from(activityTypes)
    .where(eq(activityTypes.active, true));
  const userContributions = await db
    .select()
    .from(contributions)
    .where(eq(contributions.userId, locals.user!.id))
    .orderBy(desc(contributions.createdAt))
    .limit(20);

  //Only shows signed up events for users in log hours
  const mySignups = await db
    .select()
    .from(eventSignups)
    .where(eq(eventSignups.userId, locals.user!.id));
  const myEvents = mySignups.length
    ? await db
        .select()
        .from(events)
        .where(
          inArray(
            events.id,
            mySignups.map((s) => s.eventId),
          ),
        )
    : [];
  return {
    activities,
    contributions: userContributions,
    donationRate: await getDonationRate(),
    myEvents,
  };

  return {
    activities,
    contributions: userContributions,
    donationRate: await getDonationRate(),
  };
};

export const actions: Actions = {
  volunteering: async ({ request, locals }) => {
    const fd = await request.formData();
    const date = fd.get("date")?.toString() ?? "";
    const hours = fd.get("hours")?.toString() ?? "";
    const notes = fd.get("notes")?.toString() ?? "";


    if (!date || !hours)
      return fail(400, { error: "Date and hours are required." });
    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0)
      return fail(400, { error: "Hours must be a positive number." });

    //Check if date is out of constraints
    const max = today(),
      min = daysAgo(365);
    if (date > max)
      return fail(400, { error: "Date cannot be in the future." });
    if (date < min)
      return fail(400, { error: "Date is more than a year ago." });

    const eventIdRaw = fd.get("eventId")?.toString();
    const eventId = eventIdRaw ? Number(eventIdRaw) : null;

    if (eventId) {
      const [signup] = await db
        .select()
        .from(eventSignups)
        .where(
          and(
            eq(eventSignups.userId, locals.user!.id),
            eq(eventSignups.eventId, eventId),
          ),
        );
      if (!signup)
        return fail(400, { error: "You are not signed up for that event." });
    }

    await db.insert(contributions).values({
      userId: locals.user!.id,
      type: "volunteering",
      date,
      hours: hoursNum.toFixed(2),
      notes: notes || null,
      eventId,
    });
    return { success: true, message: `Logged ${hoursNum} volunteer hours.` };
  },

  donation: async ({ request, locals }) => {
    const fd = await request.formData();
    const date = fd.get("date")?.toString() ?? "";
    const amount = fd.get("amount")?.toString() ?? "";
    const notes = fd.get("notes")?.toString() ?? "";

    if (!date || !amount)
      return fail(400, { error: "Date and amount are required." });
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0)
      return fail(400, { error: "Amount must be a positive number." });

    //Check if date is out of constraints
    const max = today(),
      min = daysAgo(365);
    if (date > max)
      return fail(400, { error: "Date cannot be in the future." });
    if (date < min)
      return fail(400, { error: "Date is more than a year ago." });

    const rate = await getDonationRate();
    const hoursEquiv = amountNum / rate;

    await db.insert(contributions).values({
      userId: locals.user!.id,
      type: "donation",
      date,
      hours: hoursEquiv.toFixed(2),
      amount: amountNum.toFixed(2),
      notes: notes || null,
    });
    return {
      success: true,
      message: `Logged $${amountNum} donation (= ${hoursEquiv.toFixed(1)} hours).`,
    };
  },

  deleteContribution: async ({ request, locals }) => {
    const fd = await request.formData();
    const id = Number(fd.get("id"));
    if (!id) return fail(400, { error: "Invalid." });
    const [contrib] = await db
      .select()
      .from(contributions)
      .where(eq(contributions.id, id));
    if (!contrib || contrib.userId !== locals.user!.id)
      return fail(403, { error: "Not authorized." });
    await db.delete(contributions).where(eq(contributions.id, id));
    return { success: true, message: "Contribution deleted." };
  },
};
