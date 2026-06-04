// manage page server — settings, activity types, announcements, manual entries, archives
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { announcements, users, contributions, children, childVolunteerLinks, seasonArchives, swimLevelSettings } from '$lib/server/db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { getAllSettings, updateSetting, getSetting, getDonationRate, getHoursRequired, getSwimLevels } from '$lib/server/settings';
import { createUser } from '$lib/server/auth';
import { recordAction, chInsert, chUpdate, chDelete } from '$lib/server/undo';
import {init, sendEmailUniversal, getTime} from "$lib/emailLogic"

function advanceOneYear(dateStr: string): string {
	const d = new Date(dateStr + 'T00:00:00Z');
	d.setUTCFullYear(d.getUTCFullYear() + 1);
	return d.toISOString().split('T')[0];
}

// schema caps: hours = decimal(6,2) → 9999.99 max ; amount = decimal(10,2) → ~$100M max
const MAX_MANUAL_HOURS = 9999;
const MAX_MANUAL_DONATION = 1_000_000;
const MAX_DERIVED_HOURS = 9999;

export const load: PageServerLoad = async () => {
	const news = await db.select().from(announcements).orderBy(desc(announcements.createdAt));
	const volunteers = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email }).from(users).where(eq(users.role, 'volunteer')).orderBy(asc(users.firstName));
	const allChildren = await db.select().from(children).orderBy(asc(children.firstName));
	const allLinks = await db.select().from(childVolunteerLinks);
	let archives = await db.select().from(seasonArchives).orderBy(desc(seasonArchives.archivedAt));
	const settings = await getAllSettings();
	const donationRate = await getDonationRate();

	// season date settings (stored separately from numeric settings)
	const seasonStartDate = await getSetting('season_start_date');
	const seasonEndDate = await getSetting('season_end_date');
	const todayStr = new Date().toISOString().split('T')[0];

	// auto-archive: if season end date has passed and no archive created after it
	let autoArchived = false;
	if (seasonEndDate && todayStr > seasonEndDate) {
		const lastArchive = archives[0];
		const alreadyArchived = lastArchive &&
			new Date(lastArchive.archivedAt) > new Date(seasonEndDate + 'T23:59:59Z');

		if (!alreadyArchived) {
			const label = seasonStartDate
				? `${seasonStartDate} – ${seasonEndDate}`
				: `Season ended ${seasonEndDate}`;

			const allContribs = await db.select().from(contributions);
			const allChildrenSnap = await db.select().from(children);
			const allLinksSnap = await db.select().from(childVolunteerLinks);
			const allVolsSnap = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email }).from(users).where(eq(users.role, 'volunteer'));

			await db.insert(seasonArchives).values({
				label,
				data: JSON.stringify({ contributions: allContribs, children: allChildrenSnap, links: allLinksSnap, volunteers: allVolsSnap })
			});
			await db.delete(contributions);

			// advance season dates by one year for next cycle
			await updateSetting('season_end_date', advanceOneYear(seasonEndDate));
			if (seasonStartDate) await updateSetting('season_start_date', advanceOneYear(seasonStartDate));

			autoArchived = true;
			archives = await db.select().from(seasonArchives).orderBy(desc(seasonArchives.archivedAt));
		}
	}

	// attach linked volunteer ids to each child for quick lookup in the UI
	const linksByChild: Record<number, number[]> = {};
	for (const l of allLinks) {
		(linksByChild[l.childId] ??= []).push(l.userId);
	}
	const childrenWithLinks = allChildren.map((c) => ({ ...c, volunteerIds: linksByChild[c.id] ?? [] }));

	const swimLevels = await getSwimLevels();
	return {
		announcements: news, volunteers, children: childrenWithLinks,
		archives, settings, donationRate, swimLevels,
		seasonDates: { start: seasonStartDate, end: seasonEndDate },
		autoArchived
	};
};

export const actions: Actions = {
	addAnnouncement: async ({ request, locals }) => {
		const fd = await request.formData();
		const title = fd.get('title')?.toString().trim() ?? '';
		const content = fd.get('content')?.toString().trim() ?? '';
		if (!title || !content) return fail(400, { announcementError: 'Title and content are required.' });
		const [row] = await db.insert(announcements).values({ title, content }).returning();
		await recordAction(String(locals.user!.id), `Post announcement "${title}"`, [chInsert('announcements', row)]);
		return { announcementSuccess: true, success: true, undoable: true, message: `Posted "${title}".` };
	},

	editAnnouncement: async ({ request, locals }) => {
		const fd = await request.formData();
		const id = Number(fd.get('id'));
		const title = fd.get('title')?.toString().trim() ?? '';
		const content = fd.get('content')?.toString().trim() ?? '';
		if (!id || !title || !content) return fail(400, { announcementError: 'Title and content are required.' });
		const [before] = await db.select().from(announcements).where(eq(announcements.id, id));
		if (!before) return fail(400, { announcementError: 'Announcement not found.' });
		const after = { ...before, title, content };
		await db.update(announcements).set({ title, content }).where(eq(announcements.id, id));
		await recordAction(String(locals.user!.id), `Edit announcement "${title}"`, [chUpdate('announcements', before, after)]);
		return { announcementSuccess: true, success: true, undoable: true, message: `Updated "${title}".` };
	},

	deleteAnnouncement: async ({ request, locals }) => {
		const fd = await request.formData();
		const id = Number(fd.get('id'));
		const [before] = await db.select().from(announcements).where(eq(announcements.id, id));
		if (!before) return fail(400, { announcementError: 'Announcement not found.' });
		await db.delete(announcements).where(eq(announcements.id, id));
		await recordAction(String(locals.user!.id), `Delete announcement "${before.title}"`, [chDelete('announcements', before)]);
		return { announcementSuccess: true, success: true, undoable: true, message: `Deleted "${before.title}".` };
	},

	addManualHours: async ({ request, locals }) => {
		const fd = await request.formData();
		const userId = Number(fd.get('userId'));
		const type = fd.get('type')?.toString() as 'volunteering' | 'donation';
		const date = fd.get('date')?.toString() ?? '';
		const value = fd.get('value')?.toString() ?? '';
		const notes = fd.get('notes')?.toString() ?? '';

		if (!userId || !date || !value) return fail(400, { manualError: 'Volunteer, date, and value are required.' });
		const num = parseFloat(value);
		if (isNaN(num) || num <= 0) return fail(400, { manualError: 'Value must be a positive number.' });

		let inserted;
		if (type === 'donation') {
			if (num > MAX_MANUAL_DONATION) {
				return fail(400, {
					manualError: `The amount you entered is too large to be accepted. Donations cannot exceed $${MAX_MANUAL_DONATION.toLocaleString()} per entry.`,
				});
			}
			const rate = await getDonationRate();
			const hoursEquiv = num / rate;
			if (hoursEquiv > MAX_DERIVED_HOURS) {
				return fail(400, {
					manualError: `The amount you entered is too large to be accepted. With the current conversion rate ($${rate}/hr), this donation would convert to more than ${MAX_DERIVED_HOURS} hours.`,
				});
			}
			[inserted] = await db.insert(contributions).values({ userId, type: 'donation', date, hours: hoursEquiv.toFixed(2), amount: num.toFixed(2), notes: notes || null }).returning();
		} else {
			if (num > MAX_MANUAL_HOURS) {
				return fail(400, {
					manualError: `The amount you entered is too large to be accepted. Hours cannot exceed ${MAX_MANUAL_HOURS} per entry.`,
				});
			}
			[inserted] = await db.insert(contributions).values({ userId, type: 'volunteering', date, hours: num.toFixed(2), notes: notes || null }).returning();
		}
		await recordAction(String(locals.user!.id), 'Add manual entry', [chInsert('contributions', inserted)]);
		return { manualSuccess: true, success: true, undoable: true, message: 'Manual entry added.' };
	},

	updateSettings: async ({ request }) => {
		const fd = await request.formData();
		for (const [key, value] of fd.entries()) {
			if (key.startsWith('setting_')) {
				await updateSetting(key.replace('setting_', ''), value.toString().trim());
			}
		}
		return { settingsSuccess: true };
	},

	addVolunteer: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'organizer') {
			return fail(403, { volunteerError: 'Not authorized.' });
		}
		const fd = await request.formData();
		const firstName = fd.get('firstName')?.toString().trim() ?? '';
		const lastName = fd.get('lastName')?.toString().trim() ?? '';
		const email = fd.get('email')?.toString().trim().toLowerCase() ?? '';
		const password = fd.get('password')?.toString() ?? '';

		if (!firstName || !lastName || !email || !password) {
			return fail(400, { volunteerError: 'All fields are required.' });
		}
		if (password.length < 4) {
			return fail(400, { volunteerError: 'Password must be at least 4 characters.' });
		}
		const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRe.test(email)) {
			return fail(400, { volunteerError: 'Please enter a valid email address.' });
		}
		const existing = await db.select().from(users).where(eq(users.email, email));
		if (existing.length > 0) {
			return fail(400, { volunteerError: 'A user with this email already exists.' });
		}

		const user = await createUser(password, firstName, lastName, email, 'volunteer');
		await recordAction(String(locals.user!.id), `Add volunteer ${firstName} ${lastName}`, [chInsert('users', user)]);
		const node = await init();
 		 const messageParams = {
  		  subject: "CPWD: your account has been created",
		    name: "CPWD security",
		    message: `Greetings ${lastName},
			
			Your Carleton Place Water Dragons swim team account has been created by an administrator.

			You can sign in at https://volunteer-tracker-git-main-jacquechiracs-projects.vercel.app/ using the following credentials:

			Email: ${email}
			Temporary Password: ${password}

			Please do not share your password with anyone. For security reasons, we strongly recommend changing your password after your first login.`,
		    time: getTime(),
		    recipient: email,
		  };
		  sendEmailUniversal(node,"message", messageParams);
		
		return { volunteerSuccess: `Created volunteer ${firstName} ${lastName}.`, success: true, undoable: true, message: `Created volunteer ${firstName} ${lastName}.` };
	},

	addChild: async ({ request, locals }) => {
		const fd = await request.formData();
		const firstName = fd.get('firstName')?.toString().trim() ?? '';
		const lastName = fd.get('lastName')?.toString().trim() ?? '';
		const status = fd.get('status')?.toString() === 'tryout' ? 'tryout' : 'full_member';
		const level = fd.get('level')?.toString().trim() ?? '';
		const linkUserIdRaw = fd.get('linkUserId')?.toString() ?? '';

		if (!firstName || !lastName) {
			return fail(400, { childError: 'First and last name are required.' });
		}

		const [child] = await db.insert(children).values({
			firstName, lastName,
			status: status as 'full_member' | 'tryout',
			level: level || null
		}).returning();

		const changes = [chInsert('children', child)];
		const linkUserId = Number(linkUserIdRaw);
		if (linkUserId && Number.isFinite(linkUserId)) {
			const [link] = await db.insert(childVolunteerLinks).values({ childId: child.id, userId: linkUserId }).returning();
			changes.push(chInsert('childVolunteerLinks', link));
		}

		await recordAction(String(locals.user!.id), `Add child ${firstName} ${lastName}`, changes);
		return { childSuccess: `Added child ${firstName} ${lastName}.`, success: true, undoable: true, message: `Added child ${firstName} ${lastName}.` };
	},

	linkChild: async ({ request, locals }) => {
		const fd = await request.formData();
		const childId = Number(fd.get('childId'));
		const userId = Number(fd.get('userId'));
		if (!childId || !userId) return fail(400, { linkError: 'Child and volunteer required.' });

		const existing = await db.select().from(childVolunteerLinks)
			.where(eq(childVolunteerLinks.childId, childId));
		if (existing.some((l) => l.userId === userId)) {
			return fail(400, { linkError: 'That volunteer is already linked to this child.' });
		}

		const [row] = await db.insert(childVolunteerLinks).values({ childId, userId }).returning();
		await recordAction(String(locals.user!.id), 'Link child to volunteer', [chInsert('childVolunteerLinks', row)]);
		return { linkSuccess: true, success: true, undoable: true, message: 'Linked child to volunteer.' };
	},

	unlinkChild: async ({ request, locals }) => {
		const fd = await request.formData();
		const childId = Number(fd.get('childId'));
		const userId = Number(fd.get('userId'));
		if (!childId || !userId) return fail(400, { linkError: 'Child and volunteer required.' });
		const all = await db.select().from(childVolunteerLinks).where(eq(childVolunteerLinks.childId, childId));
		const target = all.find((l) => l.userId === userId);
		if (target) {
			await db.delete(childVolunteerLinks).where(eq(childVolunteerLinks.id, target.id));
			await recordAction(String(locals.user!.id), 'Unlink child from volunteer', [chDelete('childVolunteerLinks', target)]);
		}
		return { linkSuccess: true, success: true, undoable: !!target, message: 'Unlinked child from volunteer.' };
	},

	deleteChild: async ({ request, locals }) => {
		const fd = await request.formData();
		const childId = Number(fd.get('childId'));
		if (!childId) return fail(400, { childError: 'Invalid child.' });
		const [child] = await db.select().from(children).where(eq(children.id, childId));
		if (!child) return fail(400, { childError: 'Child not found.' });
		const links = await db.select().from(childVolunteerLinks).where(eq(childVolunteerLinks.childId, childId));
		await db.delete(children).where(eq(children.id, childId));
		const changes = [chDelete('children', child), ...links.map((l) => chDelete('childVolunteerLinks', l))];
		await recordAction(String(locals.user!.id), `Delete child ${child.firstName} ${child.lastName}`, changes);
		return { childSuccess: 'Child removed.', success: true, undoable: true, message: `Removed ${child.firstName} ${child.lastName}.` };
	},

	markMet: async ({ request, locals }) => {
		const fd = await request.formData();
		const userId = Number(fd.get('userId'));
		if (!userId) return fail(400, { markMetError: 'Invalid volunteer.' });

		const markAs = fd.get('markAs')?.toString() as 'full_member' | 'tryout' ?? 'full_member';

		const allContributions = await db.select().from(contributions).where(eq(contributions.userId, userId));
		const currentHours = allContributions.reduce((sum, c) => sum + parseFloat(c.hours ?? '0'), 0);

		const maxRequired = await getHoursRequired(markAs);

		const remaining = maxRequired - currentHours;
		if (remaining <= 0) return fail(400, { markMetError: 'This volunteer already meets requirements.' });
		if (remaining > MAX_MANUAL_HOURS) {
			return fail(400, {
				markMetError: `The hours requirement is too large to top up in one entry (would need ${remaining.toFixed(1)} hours). Lower the requirement in Settings or add hours manually in chunks.`,
			});
		}

		const today = new Date().toISOString().split('T')[0];
		const [inserted] = await db.insert(contributions).values({
			userId,
			eventId: null,
			type: 'volunteering' as const,
			date: today,
			hours: remaining.toFixed(2),
			amount: null,
			notes: 'Manually marked as met by organizer'
		}).returning();

		await recordAction(String(locals.user!.id), 'Mark requirements met', [chInsert('contributions', inserted)]);
		return { markMetSuccess: true, success: true, undoable: true, message: 'Marked requirements as met.' };
	},

	addSwimLevel: async ({ request, locals }) => {
		const fd = await request.formData();
		const value = fd.get('value')?.toString().trim() ?? '';
		const name = fd.get('name')?.toString().trim() ?? '';
		const description = fd.get('description')?.toString().trim() ?? '';
		if (!value || !name) return fail(400, { swimLevelError: 'Value and name are required.' });
		const existing = await db.select().from(swimLevelSettings);
		const [row] = await db.insert(swimLevelSettings).values({ value, name, description: description || null, displayOrder: existing.length }).returning();
		await recordAction(String(locals.user!.id), `Add swim level "${name}"`, [chInsert('swimLevelSettings', row)]);
		return { swimLevelSuccess: true, success: true, undoable: true, message: `Added swim level "${name}".` };
	},

	editSwimLevel: async ({ request, locals }) => {
		const fd = await request.formData();
		const id = Number(fd.get('id'));
		const name = fd.get('name')?.toString().trim() ?? '';
		const description = fd.get('description')?.toString().trim() ?? '';
		if (!id || !name) return fail(400, { swimLevelError: 'Name is required.' });
		const [before] = await db.select().from(swimLevelSettings).where(eq(swimLevelSettings.id, id));
		if (!before) return fail(400, { swimLevelError: 'Level not found.' });
		const after = { ...before, name, description: description || null };
		await db.update(swimLevelSettings).set({ name, description: description || null }).where(eq(swimLevelSettings.id, id));
		await recordAction(String(locals.user!.id), `Edit swim level "${name}"`, [chUpdate('swimLevelSettings', before, after)]);
		return { swimLevelSuccess: true, success: true, undoable: true, message: `Updated swim level "${name}".` };
	},

	deleteSwimLevel: async ({ request, locals }) => {
		const fd = await request.formData();
		const id = Number(fd.get('id'));
		if (!id) return fail(400, { swimLevelError: 'Invalid level.' });
		const [before] = await db.select().from(swimLevelSettings).where(eq(swimLevelSettings.id, id));
		if (!before) return fail(400, { swimLevelError: 'Level not found.' });
		await db.delete(swimLevelSettings).where(eq(swimLevelSettings.id, id));
		await recordAction(String(locals.user!.id), `Delete swim level "${before.name}"`, [chDelete('swimLevelSettings', before)]);
		return { swimLevelSuccess: true, success: true, undoable: true, message: `Deleted swim level "${before.name}".` };
	},

	archiveSeason: async ({ request }) => {
		const fd = await request.formData();
		const label = fd.get('label')?.toString().trim() ?? '';
		if (!label) return fail(400, { archiveError: 'Season label is required.' });

		const allContributions = await db.select().from(contributions);
		const allChildren = await db.select().from(children);
		const allLinks = await db.select().from(childVolunteerLinks);
		const allVolunteers = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email }).from(users).where(eq(users.role, 'volunteer'));

		const snapshot = JSON.stringify({ contributions: allContributions, children: allChildren, links: allLinks, volunteer: allVolunteers });
		await db.insert(seasonArchives).values({ label, data: snapshot });
		await db.delete(contributions);

		return { archiveSuccess: true };
	}
};
