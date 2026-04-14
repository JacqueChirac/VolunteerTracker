// tells drizzle-kit where our schema is and how to connect to the database
// used by `bun run db:push` to sync schema changes to Neon

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL!
	}
});
