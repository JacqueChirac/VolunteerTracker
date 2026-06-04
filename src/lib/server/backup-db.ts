// dumps every table to a single JSON file under ./db-backups/
// run with: bun run src/lib/server/backup-db.ts

import { neon } from '@neondatabase/serverless';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL not set');
const sql = neon(url);

const tables = [
	'users',
	'children',
	'child_volunteer_links',
	'events',
	'event_signups',
	'contributions',
	'activity_types',
	'announcements',
	'swim_level_settings',
	'site_settings',
	'season_archives',
	'nodes',
	'email_settings',
	'password_reset_tokens',
	'action_log',
];

const dump: Record<string, unknown[]> = {};
for (const t of tables) {
	try {
		const rows = await sql.query(`select * from ${t}`);
		dump[t] = rows;
		console.log(`  ${t}: ${rows.length} rows`);
	} catch (e) {
		console.warn(`  ${t}: skipped (${(e as Error).message})`);
	}
}

const outDir = join(process.cwd(), 'db-backups');
mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outPath = join(outDir, `backup-${stamp}.json`);
writeFileSync(outPath, JSON.stringify(dump, null, 2));
console.log(`\nbackup written: ${outPath}`);
