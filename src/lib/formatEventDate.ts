// Centralized date+time rendering for events.
// Handles two date precisions: 'day' (full date + optional time) and 'month'
// (e.g. "March 2026" — no day, no time). Keeps display logic out of components.

type EventLike = {
	date: string; // YYYY-MM-DD (month-precision uses YYYY-MM-01)
	datePrecision?: string | null; // 'day' | 'month' (defaults to 'day' for old rows)
	startTime?: string | null;
	endTime?: string | null;
};

const monthNames = {
	en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
};

// "March 2026" / "mars 2026" / "March 12, 2026" / "12 mars 2026"
export function formatEventDate(event: EventLike, l: 'en' | 'fr' = 'en'): string {
	const [y, m, d] = event.date.split('-').map(Number);
	const month = monthNames[l][m - 1] ?? '';
	if (event.datePrecision === 'month') {
		return `${month} ${y}`;
	}
	return l === 'fr' ? `${d} ${month} ${y}` : `${month} ${d}, ${y}`;
}

// Date + time on one line. Returns just the date for month-precision events.
export function formatEventDateTime(event: EventLike, l: 'en' | 'fr' = 'en'): string {
	const date = formatEventDate(event, l);
	if (event.datePrecision === 'month' || !event.startTime) return date;
	const sep = l === 'fr' ? ' à ' : ' at ';
	const time = event.endTime ? `${event.startTime} - ${event.endTime}` : event.startTime;
	return `${date}${sep}${time}`;
}

// Returns true if the event has already passed.
// - day-precision: passed when event.date < today
// - month-precision: passed when the event's month is fully behind us
//   (e.g. a "March 2026" event is past starting April 1, 2026)
export function isEventPast(event: EventLike, todayStr: string = new Date().toISOString().split('T')[0]): boolean {
	if (event.datePrecision === 'month') {
		const eventMonth = event.date.slice(0, 7); // YYYY-MM
		const todayMonth = todayStr.slice(0, 7);
		return eventMonth < todayMonth;
	}
	return event.date < todayStr;
}
