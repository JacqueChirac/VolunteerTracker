declare global {
	namespace App {
		interface Locals {
			user?: {
				id: number;
				username: string;
				role: 'parent' | 'organizer';
				firstName: string;
				lastName: string;
			};
		}
	}
}

export {};
