import { eq } from 'drizzle-orm';
import { getAuthenticatedUser, jsonError, jsonSuccess } from '$lib/server/middleware.js';
import { createDb } from '$lib/server/db/index.js';
import { user } from '$lib/server/db/schema.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async (event) => {
	const authUser = await getAuthenticatedUser(event.request, event.platform!);
	if (!authUser) return jsonError('Unauthorized', 401);

	const { username } = await event.request.json();

	if (!username || typeof username !== 'string') {
		return jsonError('Username is required', 400);
	}

	const trimmed = username.trim().toLowerCase();

	if (trimmed.length < 2) {
		return jsonError('Username must be at least 2 characters', 400);
	}

	if (trimmed.length > 39) {
		return jsonError('Username must be 39 characters or less', 400);
	}

	if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(trimmed) && trimmed.length > 1) {
		return jsonError('Username must contain only lowercase letters, numbers, and hyphens', 400);
	}

	// Check if username is already taken
	const db = createDb(event.platform!.env.DB);
	const existing = await db.query.user.findFirst({
		where: eq(user.username, trimmed)
	});

	if (existing && existing.id !== authUser.id) {
		return jsonError('Username is already taken', 409);
	}

	// Update the username
	await db
		.update(user)
		.set({ username: trimmed, updatedAt: new Date() })
		.where(eq(user.id, authUser.id));

	return jsonSuccess({ success: true, username: trimmed });
};
