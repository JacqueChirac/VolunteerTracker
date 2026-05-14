// log hours — volunteer logs hours or donations
import type { PageServerLoad, Actions } from "./$types";
import { db } from "$lib/server/db";
import { eq, desc } from "drizzle-orm";
import { fail } from "@sveltejs/kit";
import { getDonationRate } from "$lib/server/settings";
import { today, daysAgo } from "$lib/dateBounds";
import { activityTypes, contributions, events } from '$lib/server/db/schema';

// schema caps: hours = decimal(6,2) → max 9999.99 ; amount = decimal(10,2) → max 99,999,999.99
// we keep user-facing limits well below the column ceiling so the message reads naturally
const MAX_HOURS_PER_ENTRY = 24;
const MAX_DONATION_AMOUNT = 10_000; // $10K per entry is the friendly ceiling
const MAX_DERIVED_HOURS = 9999;        // never let a donation's hour-equivalent overflow the column

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

  const allEvents = await db.select().from(events).orderBy(desc(events.date));

  return {
    activities,
    contributions: userContributions,
    donationRate: await getDonationRate(),
    allEvents,
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
    if (hoursNum > MAX_HOURS_PER_ENTRY)
      return fail(400, {
        error: `The amount you entered is too large to be accepted. Hours cannot exceed ${MAX_HOURS_PER_ENTRY} per entry — please split it into multiple entries if needed.`,
      });

    const max = today(), min = daysAgo(365);
    if (date > max)
      return fail(400, { error: "Date cannot be in the future." });
    if (date < min)
      return fail(400, { error: "Date is more than a year ago." });

    const eventIdRaw = fd.get("eventId")?.toString();
    const eventId = eventIdRaw ? Number(eventIdRaw) : null;

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
    if (amountNum > MAX_DONATION_AMOUNT)
      return fail(400, {
        error: `The amount you entered is too large to be accepted. Donations cannot exceed $${MAX_DONATION_AMOUNT.toLocaleString()} per entry — please split it into multiple entries if needed.`,
      });

    const max = today(), min = daysAgo(365);
    if (date > max)
      return fail(400, { error: "Date cannot be in the future." });
    if (date < min)
      return fail(400, { error: "Date is more than a year ago." });

    const eventIdRaw = fd.get("eventId")?.toString();
    const eventId = eventIdRaw ? Number(eventIdRaw) : null;

    const rate = await getDonationRate();
    const hoursEquiv = amountNum / rate;
    if (hoursEquiv > MAX_DERIVED_HOURS)
      return fail(400, {
        error: `The amount you entered is too large to be accepted. With the current conversion rate ($${rate}/hr), this donation would convert to more than ${MAX_DERIVED_HOURS} hours.`,
      });

    await db.insert(contributions).values({
      userId: locals.user!.id,
      type: "donation",
      date,
      hours: hoursEquiv.toFixed(2),
      amount: amountNum.toFixed(2),
      notes: notes || null,
      eventId,
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
