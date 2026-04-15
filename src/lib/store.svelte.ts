// this is the "brain" of the paper prototype
// instead of a real database, everything lives in localStorage
// when we switch to a real backend, this whole file gets replaced with server calls
//
// how it works:
// - on page load, init() reads saved state from localStorage (or creates seed data)
// - every time we change data (add user, log hours, etc.), we call persist() to save it back
// - Svelte 5 runes ($state, $derived) make the UI re-render automatically when data changes

import { browser } from '$app/environment';

// ---------- types ----------
// these mirror what the real database tables would look like

export type Role = 'volunteer' | 'organizer';
export type ChildStatus = 'full_member' | 'tryout';
export type Importance = 'low' | 'medium' | 'high';

export interface User {
	id: number;
	username: string;
	password: string; // plaintext — only ok because this is a local prototype, never do this for real
	role: Role;
	firstName: string;
	lastName: string;
	createdAt: string;
}

export interface Child {
	id: number;
	firstName: string;
	lastName: string;
	level: string | null;
	status: ChildStatus;
	createdAt: string;
}

export interface ChildVolunteerLink {
	id: number;
	childId: number;
	userId: number;
}

export interface EventItem {
	id: number;
	title: string;
	date: string;
	startTime: string;
	endTime: string | null;
	location: string | null;
	description: string | null;
	volunteersNeeded: number | null;
	importance: Importance;
	createdAt: string;
}

export interface EventSignup {
	id: number;
	eventId: number;
	userId: number;
	signedUpAt: string;
}

export interface Contribution {
	id: number;
	userId: number;
	date: string;
	hours: string;
	notes: string | null;
	createdAt: string;
}

export interface SiteSetting {
	key: string;
	value: string;
	label: string;
}

// shape of everything we save to localStorage
interface PersistedState {
	users: User[];
	children: Child[];
	childVolunteerLinks: ChildVolunteerLink[];
	events: EventItem[];
	eventSignups: EventSignup[];
	contributions: Contribution[];
	siteSettings: SiteSetting[];
	nextIds: Record<string, number>; // auto-incrementing IDs per table
}

// ---------- localStorage keys ----------

const STORAGE_KEY = 'volunteer-tracker-state-v3';
const SESSION_KEY = 'volunteer-tracker-session-v3';

// ---------- seed data ----------
// this is what you see on first load (before anyone adds real data)

function buildSeedState(): PersistedState {
	const now = new Date().toISOString();

	// simple auto-increment: each entity type gets its own counter
	const nextIds: Record<string, number> = {};
	const take = (entity: string) => {
		nextIds[entity] = (nextIds[entity] ?? 0) + 1;
		return nextIds[entity];
	};

	// demo accounts
	const users: User[] = [
		{
			id: take('user'),
			username: 'admin',
			password: 'admin123',
			role: 'organizer',
			firstName: 'Admin',
			lastName: 'Organizer',
			createdAt: now
		},
		{
			id: take('user'),
			username: 'raymond',
			password: 'password',
			role: 'volunteer',
			firstName: 'Raymond',
			lastName: 'Liu',
			createdAt: now
		}
	];

	// a few sample events so the dashboard isn't empty
	const rawEvents: Omit<EventItem, 'id' | 'createdAt'>[] = [
		{
			title: 'Equipment Inventory',
			date: '2025-10-05',
			startTime: '09:00',
			endTime: '12:00',
			location: 'Storage Room',
			description: 'Counted and cataloged all equipment.',
			volunteersNeeded: 3,
			importance: 'medium'
		},
		{
			title: 'Facility Set Up',
			date: '2026-08-11',
			startTime: '09:00',
			endTime: '13:00',
			location: 'Main Facility',
			description: 'Set up chairs, tables, and equipment for the kickoff event.',
			volunteersNeeded: 8,
			importance: 'high'
		},
		{
			title: 'End of Season Cleanup',
			date: '2026-08-28',
			startTime: '10:00',
			endTime: '14:00',
			location: 'Main Facility',
			description: 'Pack everything up and clean the facility for the off-season.',
			volunteersNeeded: 10,
			importance: 'high'
		}
	];
	const events: EventItem[] = rawEvents.map((e) => ({
		...e,
		id: take('event'),
		createdAt: now
	}));

	// default settings for hour requirements
	const siteSettings: SiteSetting[] = [
		{ key: 'hours_required_full_member', value: '30', label: 'Hours Required (Full Member)' },
		{ key: 'hours_required_tryout', value: '4', label: 'Hours Required (Tryout)' }
	];

	return {
		users,
		children: [],
		childVolunteerLinks: [],
		events,
		eventSignups: [],
		contributions: [],
		siteSettings,
		nextIds
	};
}

// ---------- the actual store ----------
// one global instance, imported everywhere as `store`

class AppStore {
	// all of these are reactive — change them and the UI updates
	users = $state<User[]>([]);
	children = $state<Child[]>([]);
	childVolunteerLinks = $state<ChildVolunteerLink[]>([]);
	events = $state<EventItem[]>([]);
	eventSignups = $state<EventSignup[]>([]);
	contributions = $state<Contribution[]>([]);
	siteSettings = $state<SiteSetting[]>([]);
	currentUserId = $state<number | null>(null);

	private nextIds: Record<string, number> = {};
	private hydrated = false; // prevents double-init

	// who's logged in right now?
	get currentUser(): User | null {
		if (this.currentUserId == null) return null;
		return this.users.find((u) => u.id === this.currentUserId) ?? null;
	}

	// called once on page load from +layout.svelte
	// loads everything from localStorage, or creates seed data if first visit
	init() {
		if (!browser || this.hydrated) return;
		this.hydrated = true;

		let state: PersistedState | null = null;
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			try {
				state = JSON.parse(raw) as PersistedState;
			} catch {
				state = null;
			}
		}
		if (!state) state = buildSeedState();

		this.users = state.users ?? [];
		this.children = state.children ?? [];
		this.childVolunteerLinks = state.childVolunteerLinks ?? [];
		this.events = state.events ?? [];
		this.eventSignups = state.eventSignups ?? [];
		this.contributions = state.contributions ?? [];
		this.siteSettings = state.siteSettings ?? [];
		this.nextIds = state.nextIds ?? {};

		// first run — save the seed data so it's there next time
		if (!raw) this.persist();

		// restore logged-in user from session
		const sessionRaw = localStorage.getItem(SESSION_KEY);
		if (sessionRaw) {
			try {
				const parsed = JSON.parse(sessionRaw);
				if (typeof parsed === 'number') this.currentUserId = parsed;
			} catch {
				/* ignore bad session data */
			}
		}
	}

	// wipes everything and reloads seed data (the "reset demo" button)
	resetAll() {
		if (!browser) return;
		localStorage.removeItem(STORAGE_KEY);
		localStorage.removeItem(SESSION_KEY);
		this.currentUserId = null;
		this.hydrated = false;
		this.init();
	}

	// saves all state to localStorage
	private persist() {
		if (!browser) return;
		const data: PersistedState = {
			users: this.users,
			children: this.children,
			childVolunteerLinks: this.childVolunteerLinks,
			events: this.events,
			eventSignups: this.eventSignups,
			contributions: this.contributions,
			siteSettings: this.siteSettings,
			nextIds: this.nextIds
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	}

	// saves/clears the logged-in user ID
	private writeSession() {
		if (!browser) return;
		if (this.currentUserId == null) localStorage.removeItem(SESSION_KEY);
		else localStorage.setItem(SESSION_KEY, JSON.stringify(this.currentUserId));
	}

	// auto-incrementing ID generator (like a database serial column)
	private nextId(entity: string): number {
		this.nextIds[entity] = (this.nextIds[entity] ?? 0) + 1;
		return this.nextIds[entity];
	}

	// ==================== auth ====================

	// checks username + password, logs them in if correct
	login(username: string, password: string): User | null {
		const user = this.users.find((u) => u.username === username && u.password === password);
		if (!user) return null;
		this.currentUserId = user.id;
		this.writeSession();
		return user;
	}

	// creates a new volunteer account
	register(data: {
		username: string;
		password: string;
		firstName: string;
		lastName: string;
	}): { ok: true; user: User } | { ok: false; error: string } {
		if (this.users.some((u) => u.username === data.username)) {
			return { ok: false, error: 'Username already taken.' };
		}
		const user: User = {
			id: this.nextId('user'),
			username: data.username,
			password: data.password,
			role: 'volunteer',
			firstName: data.firstName,
			lastName: data.lastName,
			createdAt: new Date().toISOString()
		};
		this.users = [...this.users, user];
		this.currentUserId = user.id;
		this.writeSession();
		this.persist();
		return { ok: true, user };
	}

	logout() {
		this.currentUserId = null;
		this.writeSession();
	}

	changePassword(
		currentPassword: string,
		newPassword: string
	): { ok: true } | { ok: false; error: string } {
		const user = this.currentUser;
		if (!user) return { ok: false, error: 'Not logged in.' };
		if (user.password !== currentPassword)
			return { ok: false, error: 'Current password is incorrect.' };
		if (newPassword.length < 4)
			return { ok: false, error: 'New password must be at least 4 characters.' };
		this.users = this.users.map((u) =>
			u.id === user.id ? { ...u, password: newPassword } : u
		);
		this.persist();
		return { ok: true };
	}

	// ==================== settings ====================

	getSetting(key: string): string {
		const row = this.siteSettings.find((s) => s.key === key);
		return row?.value ?? '';
	}

	// how many hours does this membership tier need?
	getHoursRequired(status: ChildStatus): number {
		const key = status === 'tryout' ? 'hours_required_tryout' : 'hours_required_full_member';
		return Number(this.getSetting(key));
	}

	updateSetting(key: string, value: string) {
		const existing = this.siteSettings.find((s) => s.key === key);
		if (existing) {
			this.siteSettings = this.siteSettings.map((s) => (s.key === key ? { ...s, value } : s));
		} else {
			this.siteSettings = [...this.siteSettings, { key, value, label: key }];
		}
		this.persist();
	}

	// ==================== children ====================

	// adds a new child AND links them to the currently logged-in user
	addChildForCurrentUser(data: {
		firstName: string;
		lastName: string;
		level: string;
		status: ChildStatus;
	}): Child | null {
		const userId = this.currentUserId;
		if (userId == null) return null;
		const child: Child = {
			id: this.nextId('child'),
			firstName: data.firstName,
			lastName: data.lastName,
			level: data.level || null,
			status: data.status,
			createdAt: new Date().toISOString()
		};
		this.children = [...this.children, child];
		// create the link between this child and the logged-in parent
		this.childVolunteerLinks = [
			...this.childVolunteerLinks,
			{ id: this.nextId('cvLink'), childId: child.id, userId }
		];
		this.persist();
		return child;
	}

	// links an existing child to the current user
	// (e.g. if another guardian already added the child)
	linkChildToCurrentUser(childId: number): { ok: true } | { ok: false; error: string } {
		const userId = this.currentUserId;
		if (userId == null) return { ok: false, error: 'Not logged in.' };
		if (this.childVolunteerLinks.some((l) => l.userId === userId && l.childId === childId)) {
			return { ok: false, error: 'This child is already linked to your account.' };
		}
		this.childVolunteerLinks = [
			...this.childVolunteerLinks,
			{ id: this.nextId('cvLink'), childId, userId }
		];
		this.persist();
		return { ok: true };
	}

	// removes the link between a child and the current user
	unlinkChildFromCurrentUser(childId: number) {
		const userId = this.currentUserId;
		if (userId == null) return;
		this.childVolunteerLinks = this.childVolunteerLinks.filter(
			(l) => !(l.userId === userId && l.childId === childId)
		);
		this.persist();
	}

	// organizer can edit a child's level and status
	editChild(childId: number, data: { level: string; status: ChildStatus }) {
		this.children = this.children.map((c) =>
			c.id === childId ? { ...c, level: data.level || null, status: data.status } : c
		);
		this.persist();
	}

	// ==================== events ====================

	deleteEvent(id: number) {
		this.events = this.events.filter((e) => e.id !== id);
		this.eventSignups = this.eventSignups.filter((s) => s.eventId !== id);
		this.persist();
	}

	// volunteer signs up for an event
	signupForEvent(eventId: number): { ok: true } | { ok: false; error: string } {
		const userId = this.currentUserId;
		if (userId == null) return { ok: false, error: 'Not logged in.' };
		if (this.eventSignups.some((s) => s.eventId === eventId && s.userId === userId)) {
			return { ok: false, error: 'Already signed up.' };
		}
		this.eventSignups = [
			...this.eventSignups,
			{
				id: this.nextId('eventSignup'),
				eventId,
				userId,
				signedUpAt: new Date().toISOString()
			}
		];
		this.persist();
		return { ok: true };
	}

	// volunteer cancels their signup
	cancelSignup(eventId: number) {
		const userId = this.currentUserId;
		if (userId == null) return;
		this.eventSignups = this.eventSignups.filter(
			(s) => !(s.eventId === eventId && s.userId === userId)
		);
		this.persist();
	}

	// ==================== contributions (hours/donations) ====================

	logHoursForCurrentUser(data: { date: string; hours: number; notes: string }): Contribution | null {
		const userId = this.currentUserId;
		if (userId == null) return null;
		const contrib: Contribution = {
			id: this.nextId('contribution'),
			userId,
			date: data.date,
			hours: data.hours.toFixed(2),
			notes: data.notes || null,
			createdAt: new Date().toISOString()
		};
		this.contributions = [...this.contributions, contrib];
		this.persist();
		return contrib;
	}

	deleteContribution(id: number): { ok: true } | { ok: false; error: string } {
		const user = this.currentUser;
		if (!user) return { ok: false, error: 'Not logged in.' };
		const contrib = this.contributions.find((c) => c.id === id);
		if (!contrib) return { ok: false, error: 'Not found.' };
		// only the owner or an organizer can delete
		if (user.role !== 'organizer' && contrib.userId !== user.id) {
			return { ok: false, error: 'Not authorized.' };
		}
		this.contributions = this.contributions.filter((c) => c.id !== id);
		this.persist();
		return { ok: true };
	}

	// ==================== helper queries ====================

	// all contributions for a given user, newest first
	getUserContributions(userId: number): Contribution[] {
		return this.contributions
			.filter((c) => c.userId === userId)
			.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	}

	// total hours logged across all guardians linked to this child
	getChildTotalHours(childId: number): number {
		const linkedVolunteerIds = this.childVolunteerLinks
			.filter((l) => l.childId === childId)
			.map((l) => l.userId);
		let total = 0;
		for (const vid of linkedVolunteerIds) {
			for (const c of this.contributions) {
				if (c.userId === vid) total += parseFloat(c.hours || '0');
			}
		}
		return Math.round(total * 100) / 100;
	}

	// which children are linked to this user?
	getLinkedChildren(userId: number): Child[] {
		const childIds = this.childVolunteerLinks
			.filter((l) => l.userId === userId)
			.map((l) => l.childId);
		return this.children.filter((c) => childIds.includes(c.id));
	}

	// children that exist but aren't linked to the current user yet
	// (used by the "link existing child" dropdown)
	getUnlinkedChildrenForCurrentUser(): Child[] {
		const userId = this.currentUserId;
		if (userId == null) return [];
		const linkedIds = new Set(
			this.childVolunteerLinks.filter((l) => l.userId === userId).map((l) => l.childId)
		);
		return this.children.filter((c) => !linkedIds.has(c.id));
	}

	// how many people signed up for this event?
	getEventSignupCount(eventId: number): number {
		return this.eventSignups.filter((s) => s.eventId === eventId).length;
	}

	// is the current user signed up for this event?
	isCurrentUserSignedUp(eventId: number): boolean {
		const userId = this.currentUserId;
		if (userId == null) return false;
		return this.eventSignups.some((s) => s.eventId === eventId && s.userId === userId);
	}

	// list of users who signed up for an event (for the event detail page)
	getEventVolunteers(eventId: number): User[] {
		const ids = this.eventSignups.filter((s) => s.eventId === eventId).map((s) => s.userId);
		return this.users.filter((u) => ids.includes(u.id));
	}
}

export const store = new AppStore();
