import { eq } from 'drizzle-orm';
import { createAuth } from './auth.js';
import { createDb } from './db/index.js';
import { user } from './db/schema.js';

export async function getAuthenticatedUser(request: Request, platform: App.Platform) {
	const auth = createAuth(platform.env.DB, platform.env);

	// Try session-based auth first
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (session?.user) {
		const db = createDb(platform.env.DB);
		const dbUser = await db.query.user.findFirst({
			where: eq(user.id, session.user.id)
		});
		if (dbUser) return dbUser;
		return session.user;
	}

	// Try API key auth (Bearer token)
	const authHeader = request.headers.get('authorization');
	if (authHeader?.startsWith('Bearer ')) {
		const key = authHeader.slice(7);
		try {
			const result = await auth.api.verifyApiKey({
				body: { key }
			});
			if (result.valid && result.key?.userId) {
				const db = createDb(platform.env.DB);
				const foundUser = await db.query.user.findFirst({
					where: eq(user.id, result.key.userId)
				});
				if (foundUser) {
					return foundUser;
				}
			}
		} catch {
			// Invalid API key, fall through
		}
	}

	return null;
}

export function jsonError(message: string, status: number) {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}

export function jsonSuccess(data: unknown, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}
