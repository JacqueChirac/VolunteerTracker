// volunteer home — loads announcements for the dashboard
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { announcements } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const news = await db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(10);
	return { announcements: news };
};
