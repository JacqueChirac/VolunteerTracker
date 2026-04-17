// one-off migration: add email column, assign fake emails, drop username column
// run with: bun run db:migrate-drop-username

import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = neon(DATABASE_URL);

async function migrate() {
  console.log("Starting username → email migration...");

  // add email column if it doesn't exist yet
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT`;
  console.log("Ensured email column exists");

  // grab all existing users
  const users = await sql`SELECT id, first_name, last_name, username, email FROM users`;
  console.log(`Found ${users.length} users`);

  for (const user of users) {
    // if user already has a proper email, skip
    if (user.email && user.email.trim() !== "") continue;

    // build a fake email from their name
    const first = (user.first_name || "user").toLowerCase().replace(/\s+/g, "");
    const last = (user.last_name || String(user.id)).toLowerCase().replace(/\s+/g, "");
    const fakeEmail = `${first}.${last}@swimteam.example`;

    await sql`UPDATE users SET email = ${fakeEmail} WHERE id = ${user.id}`;
    console.log(`  Updated user #${user.id} (${user.username}) → ${fakeEmail}`);
  }

  // make email NOT NULL and UNIQUE now that all rows have values
  await sql`ALTER TABLE users ALTER COLUMN email SET NOT NULL`;
  await sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_unique') THEN
        ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
      END IF;
    END $$
  `;
  console.log("Set email as NOT NULL + UNIQUE");

  // drop the username column
  await sql`ALTER TABLE users DROP COLUMN IF EXISTS username`;
  console.log("Dropped username column");

  console.log("Done!");
}

migrate().catch(console.error);
