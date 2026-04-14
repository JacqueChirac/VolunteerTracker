// site-wide settings that organizers can change from the dashboard
// stuff like "how many hours does each family owe" and "how much is a donation worth in hours"
// stored in the site_settings table as key-value pairs

import { db } from './db';
import { siteSettings } from './db/schema';
import { eq } from 'drizzle-orm';

// fallback values if nothing is in the database yet
const DEFAULTS: Record<string, { value: string; label: string }> = {
	hours_required_full_member: { value: '30', label: 'Hours Required (Full Member)' },
	hours_required_tryout: { value: '4', label: 'Hours Required (Tryout)' },
	donation_to_hour_rate: { value: '10', label: 'Dollars per Hour (Donation Rate)' }
};

// get one setting by key
export async function getSetting(key: string): Promise<string> {
	const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
	if (row) return row.value;
	return DEFAULTS[key]?.value ?? '';
}

// get all settings, merged with defaults
export async function getAllSettings() {
	const rows = await db.select().from(siteSettings);
	const result: Record<string, { value: string; label: string }> = {};

	// start with defaults
	for (const [key, def] of Object.entries(DEFAULTS)) {
		result[key] = { ...def };
	}

	// override with whatever is in the db
	for (const row of rows) {
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
	const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
	if (existing.length > 0) {
		await db.update(siteSettings).set({ value }).where(eq(siteSettings.key, key));
	} else {
		await db.insert(siteSettings).values({ key, value, label });
	}
}

// convenience: how many hours does this membership tier need?
export async function getHoursRequired(status: 'full_member' | 'tryout'): Promise<number> {
	const key = status === 'tryout' ? 'hours_required_tryout' : 'hours_required_full_member';
	return Number(await getSetting(key));
}

// convenience: how many dollars = 1 volunteer hour?
export async function getDonationRate(): Promise<number> {
	return Number(await getSetting('donation_to_hour_rate'));
}
