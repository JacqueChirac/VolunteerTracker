// one-off migration: rename the 'parent' value in the `role` enum to 'volunteer'
// run with: bun run db:migrate-rename-parent-role
// this must run BEFORE `bun run db:push` after pulling the parent→volunteer rename,
// otherwise drizzle-kit fails with: invalid input value for enum role: "parent"

// bun auto-loads .env
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL not set');

const sql = neon(url);

// case A: enum still has 'parent' → rename in place (no data change needed)
const [{ exists: hasParent }] = await sql`
	select exists (
		select 1
		from pg_enum e
		join pg_type t on t.oid = e.enumtypid
		where t.typname = 'role' and e.enumlabel = 'parent'
	) as exists
`;

if (hasParent) {
	await sql`ALTER TYPE role RENAME VALUE 'parent' TO 'volunteer'`;
	console.log("renamed enum role: 'parent' → 'volunteer'");
	process.exit(0);
}

// case B: a previous failed `db:push` left users.role as text with stranded 'parent' rows.
// update the rows so the next `db:push` can cast text → enum cleanly.
const stranded = await sql`
	select column_name, data_type
	from information_schema.columns
	where table_name = 'users' and column_name = 'role'
`;

if (stranded.length && stranded[0].data_type === 'text') {
	const updated = await sql`update users set role = 'volunteer' where role = 'parent' returning id`;
	console.log(`users.role is 'text' (mid-migration state) — updated ${updated.length} 'parent' row(s) to 'volunteer'`);
	console.log("now run: bun run db:push");
	process.exit(0);
}

console.log("nothing to do — enum already migrated and column is clean");
