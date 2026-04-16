// connects to our Neon postgres database
// we import this as `db` everywhere we need to run queries

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { DATABASE_URL } from '$env/static/private';

console.log('[DB] DATABASE_URL exists:', !!DATABASE_URL);
console.log('[DB] DATABASE_URL length:', DATABASE_URL?.length);
console.log('[DB] Has channel_binding:', DATABASE_URL?.includes('channel_binding'));
console.log('[DB] URL tail:', DATABASE_URL?.slice(-50));

// neon() gives us a serverless-friendly SQL connection
const sql = neon(DATABASE_URL);

// drizzle wraps it so we can write type-safe queries using our schema
export const db = drizzle(sql, { schema });

// test query on startup
sql`SELECT 1 as test`.then(() => console.log('[DB] Connection test OK')).catch((e: unknown) => console.error('[DB] Connection test FAILED:', e));
