import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { user } from '$lib/server/db/schema.js';
import { createAuth } from '$lib/server/auth.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ request, platform }) => {
	if (!platform) throw redirect(302, '/');

	const auth = createAuth(platform.env.DB, platform.env);
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session?.user) throw redirect(302, '/auth/login');

	const db = createDb(platform.env.DB);
	const dbUser = await db.query.user.findFirst({
		where: eq(user.id, session.user.id)
	});

	if (!dbUser) throw redirect(302, '/auth/login');

	// If username doesn't start with ~, they already have a real one
	if (!dbUser.username.startsWith('~')) {
		throw redirect(302, '/dashboard');
	}

	return {
		user: {
			id: dbUser.id,
			name: dbUser.name,
			email: dbUser.email
		}
	};
};
