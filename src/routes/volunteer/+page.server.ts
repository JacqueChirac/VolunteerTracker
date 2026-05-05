// volunteer home — loads announcements for the dashboard
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { announcements, contributions } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';

//volunteer contributions data
export const load: PageServerLoad = async ({ locals }) => {
	const news = await db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(10);
	const my = await db.select().from(contributions).where(eq(contributions.userId, locals.user!.id));
  const totalHours = my.reduce((s, c) => s + parseFloat(c.hours ?? '0'), 0);
  const totalDonations = my.filter(c => c.type === 'donation').reduce((s, c) => s + parseFloat(c.amount ?? '0'), 0);	
  return { announcements: news, totals: { hours: Math.round(totalHours * 100) / 100, donations: totalDonations } };
};
