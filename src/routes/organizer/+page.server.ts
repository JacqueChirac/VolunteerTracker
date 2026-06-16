// organizer home - dashboard stats + recent announcements
import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import {
  users,
  children,
  childVolunteerLinks,
  contributions,
  announcements,
} from "$lib/server/db/schema";
import { desc, eq } from "drizzle-orm";
import { getHoursRequired } from "$lib/server/settings";

export const load: PageServerLoad = async ({ locals }) => {
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

  // count how many children have hit their required hours. A child's hours are
  // the combined hours of every volunteer linked to that child.
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

  const recentAnnouncements = await db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.createdAt))
    .limit(5);

  return {
    user: locals.user,
    stats: {
      totalVolunteers: allVolunteers.length,
      totalHours: Math.round(totalHours * 100) / 100,
      childrenMet,
      childrenTotal: allChildren.length,
    },
    announcements: recentAnnouncements,
  };
};
