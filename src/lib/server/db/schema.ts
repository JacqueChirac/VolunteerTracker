// all our database tables live here
// drizzle uses these to generate SQL and give us type safety
// run `bun run db:push` to sync these to the actual database

import { pgTable, serial, text, integer, boolean, date, timestamp, decimal, pgEnum } from 'drizzle-orm/pg-core';

// -- enums (dropdown-style columns with fixed options) --

export const roleEnum = pgEnum('role', ['parent', 'organizer']);
export const childStatusEnum = pgEnum('child_status', ['full_member', 'tryout']);
export const contributionTypeEnum = pgEnum('contribution_type', ['volunteering', 'donation']);
export const importanceEnum = pgEnum('importance', ['low', 'medium', 'high']);

// -- tables --

// who can log in — parents, relatives, friends, and organizers
export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	role: roleEnum('role').notNull().default('parent'), // parent = parent/relative/friend
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	email: text('email').notNull().unique(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// swimmers on the team
export const children = pgTable('children', {
	id: serial('id').primaryKey(),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	level: text('level'), // swim team level
	status: childStatusEnum('status').notNull().default('full_member'), // part member or full member
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// links children to their parent accounts (a kid can have multiple parents listed)
export const childParentLinks = pgTable('child_parent_links', {
	id: serial('id').primaryKey(),
	childId: integer('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
	userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' })
});

// volunteer events (meets, cleanup days, fundraisers, etc.)
export const events = pgTable('events', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	date: date('date').notNull(),
	startTime: text('start_time').notNull(),
	endTime: text('end_time'),
	location: text('location'),
	description: text('description'),
	// volunteersNeeded: integer('volunteers_needed'), // not needed for now
	budget: decimal('budget', { precision: 10, scale: 2 }), // probably not needed, keeping just in case
	importance: importanceEnum('importance').default('medium'), // depends if we want to show priority
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// tracks which parents signed up for which events
export const eventSignups = pgTable('event_signups', {
	id: serial('id').primaryKey(),
	eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
	userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	signedUpAt: timestamp('signed_up_at').defaultNow().notNull()
});

// logged hours or donations from parents
export const contributions = pgTable('contributions', {
	id: serial('id').primaryKey(),
	userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	type: contributionTypeEnum('type').notNull(),
	date: date('date').notNull(),
	hours: decimal('hours', { precision: 6, scale: 2 }),
	amount: decimal('amount', { precision: 10, scale: 2 }),
	activityId: integer('activity_id').references(() => activityTypes.id),
	notes: text('notes'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// types of volunteer work (organizer can add/remove these)
export const activityTypes = pgTable('activity_types', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	active: boolean('active').notNull().default(true)
});

// news posts shown on the dashboard
export const announcements = pgTable('announcements', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	content: text('content').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// key-value settings the organizer can tweak (hours required, donation rate, etc.)
export const siteSettings = pgTable('site_settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull(),
	label: text('label').notNull()
});

// end-of-season snapshots so we can reset hours without losing history
export const seasonArchives = pgTable('season_archives', {
	id: serial('id').primaryKey(),
	label: text('label').notNull(),
	archivedAt: timestamp('archived_at').defaultNow().notNull(),
	data: text('data').notNull() // JSON dump of that season's contributions
});
