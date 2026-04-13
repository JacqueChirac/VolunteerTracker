import { pgTable, serial, text, integer, boolean, date, timestamp, decimal, pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['parent', 'organizer']);
export const childStatusEnum = pgEnum('child_status', ['full_member', 'tryout']);
export const contributionTypeEnum = pgEnum('contribution_type', ['volunteering', 'donation']);
export const importanceEnum = pgEnum('importance', ['low', 'medium', 'high']);

// Users (organizers)
export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	role: roleEnum('role').notNull().default('parent'), //Parent, Relative, Friends
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// Children
export const children = pgTable('children', {
	id: serial('id').primaryKey(),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	level: text('level'), //Swim Team Level
	status: childStatusEnum('status').notNull().default('full_member'),//Part Members/Full Member
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// Child-Parent links (many-to-many)
export const childParentLinks = pgTable('child_parent_links', {
	id: serial('id').primaryKey(),
	childId: integer('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
	userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' })
});

// Events
export const events = pgTable('events', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	date: date('date').notNull(),
	startTime: text('start_time').notNull(),
	endTime: text('end_time'),
	location: text('location'),
	description: text('description'),
	// volunteersNeeded: integer('volunteers_needed'), Not needed
	budget: decimal('budget', { precision: 10, scale: 2 }), //Probably not needed
	importance: importanceEnum('importance').default('medium'), //Depends if needed
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// Event sign-ups
export const eventSignups = pgTable('event_signups', {
	id: serial('id').primaryKey(),
	eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
	userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	signedUpAt: timestamp('signed_up_at').defaultNow().notNull()
});

// Contributions (volunteering hours or donations)
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

// Activity types (organizer-managed)
export const activityTypes = pgTable('activity_types', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	active: boolean('active').notNull().default(true)
});

// Announcements
export const announcements = pgTable('announcements', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	content: text('content').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// Site settings (key-value, editable by organizer)
export const siteSettings = pgTable('site_settings', {
	key: text('key').primaryKey(),
	value: text('value').notNull(),
	label: text('label').notNull()
});

// Season archives
export const seasonArchives = pgTable('season_archives', {
	id: serial('id').primaryKey(),
	label: text('label').notNull(),
	archivedAt: timestamp('archived_at').defaultNow().notNull(),
	data: text('data').notNull() // JSON snapshot of all contributions/hours for that season
});
