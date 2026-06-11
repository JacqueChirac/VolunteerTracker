// site-wide settings that organizers can change from the dashboard
// stuff like "how many hours does each family owe" and "how much is a donation worth in hours"
// stored in the site_settings table as key-value pairs

import { db } from './db';
import { siteSettings, swimLevelSettings } from './db/schema';
import { swimLevels as hardcodedLevels } from '$lib/swimLevels';
import { eq } from 'drizzle-orm';

// fallback values if nothing is in the database yet
const DEFAULTS: Record<string, { value: string; label: string }> = {
  hours_required_full_member: {
    value: "30",
    label: "Hours Required (Annual Member)",
  },
  hours_required_tryout: { value: "4", label: "Hours Required (Tryout)" },
  donation_to_hour_rate: {
    value: "10",
    label: "Dollars per Hour (Donation Rate)",
  },
};

// get one setting by key
export async function getSetting(key: string): Promise<string> {
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, key));
  if (row) return row.value;
  return DEFAULTS[key]?.value ?? "";
}

// these key prefixes hold text/JSON settings (tutorial copy, season dates,
// email defaults) and must NOT leak into the numeric "Settings" grid on /manage
const NON_NUMERIC_PREFIXES = ["tut_", "season_", "email_"];

// get all settings, merged with defaults
export async function getAllSettings() {
  const rows = await db.select().from(siteSettings);
  const result: Record<string, { value: string; label: string }> = {};

  // start with defaults
  for (const [key, def] of Object.entries(DEFAULTS)) {
    result[key] = { ...def };
  }

  // override with whatever is in the db (skipping non-numeric settings)
  for (const row of rows) {
    if (NON_NUMERIC_PREFIXES.some((p) => row.key.startsWith(p))) continue;
    if (result[row.key]) {
      result[row.key].value = row.value;
    } else {
      result[row.key] = { value: row.value, label: row.label };
    }
  }

  return result;
}

// save a setting (creates it if it doesn't exist yet)
export async function updateSetting(key: string, value: string) {
  const label = DEFAULTS[key]?.label ?? key;
  const existing = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, key));
  if (existing.length > 0) {
    await db
      .update(siteSettings)
      .set({ value })
      .where(eq(siteSettings.key, key));
  } else {
    await db.insert(siteSettings).values({ key, value, label });
  }
}

// convenience: how many hours does this membership tier need?
export async function getHoursRequired(
  status: "full_member" | "tryout",
): Promise<number> {
  const key =
    status === "tryout"
      ? "hours_required_tryout"
      : "hours_required_full_member";
  return Number(await getSetting(key));
}

// convenience: how many dollars = 1 volunteer hour?
export async function getDonationRate(): Promise<number> {
  return Number(await getSetting("donation_to_hour_rate"));
}

// -- Tutorial content --

const TUTORIAL_DEFAULTS: Record<string, string> = {
	tut_step_count: '5',
	tut_faq_count: '4',
	tut_title: 'How to Use This Site',
	tut_subtitle: 'A step-by-step guide to getting started as a volunteer.',
	tut_step1_title: 'Step 1: Add Your Children',
	tut_step1_body: "Go to My Account and click \"+ New Child\". Fill in your child's name, level, and select their status. If your child has multiple guardians who volunteer, each guardian should create their own account — all hours from every linked guardian count toward the child's goal.",
	tut_step1_link_text: 'My Account',
	tut_step1_link_url: '/volunteer/account',
	tut_step2_title: 'Step 2: Sign Up for Events',
	tut_step2_body: 'Visit the Events page to see upcoming events that need volunteers. Click "Sign Up" on any event you can attend. You can cancel your sign-up at any time if your plans change.',
	tut_step2_link_text: 'View Events',
	tut_step2_link_url: '/volunteer/events',
	tut_step3_title: 'Step 3: Log Your Volunteer Hours',
	tut_step3_body: 'After you volunteer, go to Log Contributions and select "Log Volunteering". Enter the date, hours worked, activity type, and any notes. Your entry will be reviewed by an administrator.',
	tut_step3_link_text: 'Log Contributions',
	tut_step3_link_url: '/volunteer/log',
	tut_step4_title: 'Step 4: Log Donations',
	tut_step4_body: 'Monetary donations also count toward your volunteer hours. Go to Log Contributions and select "Log Donation". The conversion rate is shown on the page — just enter the dollar amount and the hours are calculated automatically.',
	tut_step4_link_text: 'Log Contributions',
	tut_step4_link_url: '/volunteer/log',
	tut_step5_title: 'Step 5: Track Your Progress',
	tut_step5_body: "Go to My Account to see each child's progress bar showing how many hours have been completed out of the required total. Remember: your hours count for all of your linked children.",
	tut_step5_link_text: 'My Account',
	tut_step5_link_url: '/volunteer/account',
	tut_faq_title: 'Frequently Asked Questions',
	tut_faq1_q: 'How many hours do I need?',
	tut_faq1_a: 'Manual members need 30 hours per year. Tryout members need 4 hours. These requirements are set by the organizer and may change.',
	tut_faq2_q: 'Do donations count as hours?',
	tut_faq2_a: 'Yes! The current conversion rate is shown on the Log Contributions page.',
	tut_faq3_q: "I share custody — do both guardians' hours count?",
	tut_faq3_a: 'Yes. Each guardian creates their own account and adds the same child. All hours from every linked guardian are added together for that child.',
	tut_faq4_q: 'I have multiple children — do I need to volunteer separately for each?',
	tut_faq4_a: 'No. When you log hours, those hours count for every child linked to your account. 5 hours logged = 5 hours for each of your children.',
};

export async function getTutorialContent(): Promise<Record<string, string>> {
	const rows = await db.select().from(siteSettings);
	const result = { ...TUTORIAL_DEFAULTS };
	for (const row of rows) {
		if (row.key.startsWith('tut_')) result[row.key] = row.value;
	}
	return result;
}

export async function deleteTutorialSetting(key: string) {
	if (!key.startsWith('tut_')) return;
	await db.delete(siteSettings).where(eq(siteSettings.key, key));
}

export async function updateTutorialSetting(key: string, value: string) {
	if (!key.startsWith('tut_')) return;
	const label = key.replace(/^tut_/, '').replace(/_/g, ' ');
	const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
	if (existing.length > 0) {
		await db.update(siteSettings).set({ value }).where(eq(siteSettings.key, key));
	} else {
		await db.insert(siteSettings).values({ key, value, label });
	}
}

// -- Email composer defaults + reusable templates --
// stored in site_settings under the "email_" prefix (kept out of the numeric grid)

export type EmailTemplate = { name: string; body: string };
export type EmailSettings = { subject: string; signature: string; templates: EmailTemplate[] };

const EMAIL_DEFAULTS = {
	subject: 'CPWD communication',
	signature: 'CPWD'
};

export async function getEmailSettings(): Promise<EmailSettings> {
	const subject = (await getSetting('email_default_subject')) || EMAIL_DEFAULTS.subject;
	const signature = (await getSetting('email_default_signature')) || EMAIL_DEFAULTS.signature;
	const templatesRaw = await getSetting('email_templates');

	let templates: EmailTemplate[] = [];
	if (templatesRaw) {
		try {
			const parsed = JSON.parse(templatesRaw);
			if (Array.isArray(parsed)) {
				templates = parsed
					.filter((tpl) => tpl && typeof tpl.name === 'string' && typeof tpl.body === 'string')
					.map((tpl) => ({ name: tpl.name, body: tpl.body }));
			}
		} catch {
			templates = [];
		}
	}
	return { subject, signature, templates };
}

export async function saveEmailDefaults(subject: string, signature: string) {
	await updateSetting('email_default_subject', subject);
	await updateSetting('email_default_signature', signature);
}

export async function saveEmailTemplates(templates: EmailTemplate[]) {
	await updateSetting('email_templates', JSON.stringify(templates));
}

// get swim levels from DB, seeding from hardcoded list if empty
export async function getSwimLevels() {
	const rows = await db.select().from(swimLevelSettings).orderBy(swimLevelSettings.displayOrder);
	if (rows.length > 0) return rows;
	// seed from hardcoded list on first use
	for (let i = 0; i < hardcodedLevels.length; i++) {
		const lvl = hardcodedLevels[i];
		await db.insert(swimLevelSettings).values({ value: lvl.value, name: lvl.name, description: lvl.description, displayOrder: i }).onConflictDoNothing();
	}
	return await db.select().from(swimLevelSettings).orderBy(swimLevelSettings.displayOrder);
}
