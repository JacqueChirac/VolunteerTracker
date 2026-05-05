import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$env/static/private';
import { json } from '@sveltejs/kit';
import { check } from 'drizzle-orm/gel-core';
const sql = neon(DATABASE_URL);

const lastUpdateRaw = await sql`SELECT last_update FROM email_setting`;
const lastUpdate = lastUpdateRaw[0].last_update
const newUpdate = new Date();
export async function load(){
return {lastUpdate}
}