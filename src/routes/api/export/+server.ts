import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	// TODO: export data (CSV/JSON)
	return new Response('', { status: 200 });
};
