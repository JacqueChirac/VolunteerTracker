# DB migration guide

The database lives on Neon (Postgres). Schema is defined in [src/lib/server/db/schema.ts](../src/lib/server/db/schema.ts) and synced with [drizzle-kit](https://orm.drizzle.team/kit-docs/overview).

## Setup

1. Install deps: `bun install`
2. Create `.env` at the repo root with:
   ```
   DATABASE_URL=postgres://...   # Neon connection string
   ```

## Everyday flow

When you change [schema.ts](../src/lib/server/db/schema.ts):

```bash
bun run db:push
```

This diffs the schema against the live DB and applies the changes interactively. It's safe for additive changes (new columns, new tables, new enum values).

## When `db:push` fails

`drizzle-kit push` can't handle every change automatically. When it errors, identify the category and run the right one-off script **before** retrying `db:push`.

### "invalid input value for enum X: 'Y'"

The enum's allowed values changed in `schema.ts`, but existing rows still use a removed value. `db:push` tries to recreate the enum and chokes on the old data.

**Fix:** rename the value in-place with `ALTER TYPE ... RENAME VALUE`. It's atomic and preserves all rows.

Example (already written) for the `parent` → `volunteer` rename:

```bash
bun run db:migrate-rename-parent-role
bun run db:push
```

For a new rename, copy [../src/lib/server/migrate-rename-parent-role.ts](../src/lib/server/migrate-rename-parent-role.ts), change the enum name + old/new labels, and add a matching script to [package.json](../package.json).

### "column … of relation … contains null values"

You added a `.notNull()` column without a default. Either:

- give the column a `.default(...)` in `schema.ts`, or
- write a one-off script that backfills the column before re-running `db:push`.

### "cannot drop column … referenced by …"

Drop the referencing FK or index first (manually via a script or the Neon console), then re-run `db:push`.

### Renames (table/column)

Drizzle will prompt: "rename or create new?". Pick **rename** to preserve data. If you've already pushed and it created a new column instead, write a backfill script to copy data over before dropping the old column.

## Writing a one-off migration script

Pattern (see [../src/lib/server/migrate-rename-parent-role.ts](../src/lib/server/migrate-rename-parent-role.ts)):

```ts
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// 1. check whether the change is still needed (idempotent)
// 2. run the SQL
// 3. log what happened
```

Then register it in [package.json](../package.json):

```json
"db:migrate-<name>": "bun run src/lib/server/migrate-<name>.ts"
```

Idempotency matters — these scripts should be safe to run twice.

## Destructive changes

`db:push` will ask before dropping tables/columns. Read the prompt carefully. If in doubt, back up first: Neon → project → **Branches** → create a branch from `main`.

## Resetting (dev only)

If the local DB state is beyond repair and you don't care about the data:

1. Neon console → drop the database or spin up a fresh branch
2. Update `DATABASE_URL`
3. `bun run db:push`
4. `bun run db:seed`
