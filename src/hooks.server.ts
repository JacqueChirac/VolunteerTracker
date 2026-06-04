// Runs on EVERY request before any route handler (GET, POST, etc.).
//
// Responsibilities:
//   1. parse + verify the signed session cookie, attach `event.locals.user`
//   2. enforce role-based route gating (organizer routes need organizer role)
//      — IMPORTANT: must live here, not in +layout.server.ts. SvelteKit runs
//        form actions BEFORE layout loads, so a layout guard would let an
//        authenticated volunteer POST to organizer actions.
//   3. add security headers to every response

import type { Handle } from '@sveltejs/kit';
import { redirect, error } from '@sveltejs/kit';
import { SESSION_COOKIE, parseSessionToken, getUserById } from '$lib/server/auth';
import { dev } from '$app/environment';

export const handle: Handle = async ({ event, resolve }) => {
	// ── 1. session ───────────────────────────────────────────────────────
	const token = event.cookies.get(SESSION_COOKIE);
	if (token) {
		const session = parseSessionToken(token);
		if (session) {
			const user = await getUserById(session.userId);
			if (user) {
				event.locals.user = {
					id: user.id,
					email: user.email,
					role: user.role,
					firstName: user.firstName,
					lastName: user.lastName
				};
			}
		}
	}

	// ── 2. route auth gating ─────────────────────────────────────────────
	const path = event.url.pathname;
	const isApiCall = path.startsWith('/api/');

	if (path.startsWith('/organizer')) {
		if (!event.locals.user) {
			if (isApiCall) throw error(401, 'Not authenticated');
			throw redirect(302, '/login?role=organizer');
		}
		if (event.locals.user.role !== 'organizer') {
			if (isApiCall) throw error(403, 'Forbidden');
			throw redirect(302, '/login?role=organizer');
		}
	} else if (path.startsWith('/volunteer')) {
		if (!event.locals.user) {
			if (isApiCall) throw error(401, 'Not authenticated');
			throw redirect(302, '/login?role=volunteer');
		}
		if (event.locals.user.role !== 'volunteer') {
			if (isApiCall) throw error(403, 'Forbidden');
			throw redirect(302, '/login?role=volunteer');
		}
	} else if (isApiCall) {
		// /api/* always requires auth (export/undo/redo); export double-checks role
		if (!event.locals.user) throw error(401, 'Not authenticated');
	}

	// ── 3. resolve + security headers ────────────────────────────────────
	const response = await resolve(event);

	// HSTS only over HTTPS in prod (browsers ignore it on http://localhost anyway)
	if (!dev) {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	// CSP — Vite needs 'unsafe-inline' for HMR styles in dev; tightened in prod.
	// 'unsafe-inline' on styles stays because the app uses many inline style="" attrs.
	const csp = dev
		? "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' ws: wss:; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
		: "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
	response.headers.set('Content-Security-Policy', csp);

	return response;
};
