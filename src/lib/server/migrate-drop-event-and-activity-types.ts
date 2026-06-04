// one-off migration: drop events.type, contributions.activity_id, and activity_types
// run with: bun run src/lib/server/migrate-drop-event-and-activity-types.ts
// idempotent — safe to run twice. Run BEFORE `bun run db:push`.

import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL not set');
const sql = neon(url);

// 1. drop any FK from contributions.activity_id (constraint name varies by history)
const fks = await sql`
	select conname
	from pg_constraint c
	join pg_class t on t.oid = c.conrelid
	join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
	where t.relname = 'contributions'
		and a.attname = 'activity_id'
		and c.contype = 'f'
`;
for (const { conname } of fks) {
	await sql(`ALTER TABLE contributions DROP CONSTRAINT "${conname}"`);
	console.log(`dropped FK constraint contributions.${conname}`);
}

// 2. drop contributions.activity_id column
await sql`ALTER TABLE contributions DROP COLUMN IF EXISTS activity_id`;
console.log('dropped column contributions.activity_id (or was already gone)');

// 3. drop events.type column
await sql`ALTER TABLE events DROP COLUMN IF EXISTS type`;
console.log('dropped column events.type (or was already gone)');

// 4. drop activity_types table
await sql`DROP TABLE IF EXISTS activity_types`;
console.log('dropped table activity_types (or was already gone)');

console.log('\ndone. now run: bun run db:push');
