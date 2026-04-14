// connects to our Neon postgres database
// we import this as `db` everywhere we need to run queries

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { DATABASE_URL } from '$env/static/private';

// neon() gives us a serverless-friendly SQL connection
const sql = neon(DATABASE_URL);

// drizzle wraps it so we can write type-safe queries using our schema
export const db = drizzle(sql, { schema });
