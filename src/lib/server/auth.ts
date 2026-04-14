// handles login, registration, and session tokens
// sessions use a simple base64 token stored in a cookie
// good enough for our project — production apps would use signed JWTs

import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import { hashSync, compareSync } from 'bcrypt-ts';

// name of the cookie we store the session in
const SESSION_COOKIE = 'session';

// creates a new user and hashes their password before saving
export async function createUser(
	username: string,
	password: string,
	firstName: string,
	lastName: string,
	role: 'parent' | 'organizer' = 'parent'
) {
	const passwordHash = hashSync(password, 10);
	const [user] = await db.insert(users).values({
		username, passwordHash, firstName, lastName, role
	}).returning();
	return user;
}

// checks username + password, returns the user if correct, null if not
export async function verifyUser(username: string, password: string) {
	const [user] = await db.select().from(users).where(eq(users.username, username));
	if (!user) return null;
	if (!compareSync(password, user.passwordHash)) return null;
	return user;
}

// fetch a user by their id (used to load session data on each request)
export async function getUserById(id: number) {
	const [user] = await db.select().from(users).where(eq(users.id, id));
	return user || null;
}

// packs the userId into a base64 string we can stuff in a cookie
export function createSessionToken(userId: number): string {
	return Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString('base64');
}

// reads that base64 cookie back into a userId
export function parseSessionToken(token: string): { userId: number } | null {
	try {
		const data = JSON.parse(Buffer.from(token, 'base64').toString());
		if (typeof data.userId === 'number') return { userId: data.userId };
		return null;
	} catch {
		return null;
	}
}

export { SESSION_COOKIE };
