// tells TypeScript what shape `event.locals.user` has
// this is set in hooks.server.ts on every request
declare global {
	namespace App {
		interface Locals {
			user?: {
				id: number;
				email: string;
				role: 'volunteer' | 'organizer';
				firstName: string;
				lastName: string;
			};
		}
	}
}

export {};
