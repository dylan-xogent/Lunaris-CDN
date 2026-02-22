import { createAuth } from '$lib/server/auth.js';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({ request, platform }) => {
	if (!platform) {
		return { user: null };
	}

	const auth = createAuth(platform.env.DB, platform.env);

	try {
		const session = await auth.api.getSession({
			headers: request.headers
		});

		if (session?.user) {
			const { createDb } = await import('$lib/server/db/index.js');
			const { user: userTable } = await import('$lib/server/db/schema.js');
			const { eq } = await import('drizzle-orm');
			const db = createDb(platform.env.DB);
			const dbUser = await db.query.user.findFirst({
				where: eq(userTable.id, session.user.id)
			});
			return {
				user: dbUser
					? { ...session.user, role: dbUser.role, username: dbUser.username, image: dbUser.image }
					: session.user
			};
		}

		return { user: null };
	} catch {
		return { user: null };
	}
};
