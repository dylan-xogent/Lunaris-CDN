import { eq } from 'drizzle-orm';
import { getAuthenticatedUser, jsonError, jsonSuccess } from '$lib/server/middleware.js';
import { createDb } from '$lib/server/db/index.js';
import { user, userQuota, file, uploadSession } from '$lib/server/db/schema.js';
import type { RequestHandler } from './$types.js';

export const PATCH: RequestHandler = async (event) => {
	if (!event.platform) return jsonError('Platform not available', 500);
	const authUser = await getAuthenticatedUser(event.request, event.platform);
	if (!authUser) return jsonError('Unauthorized', 401);
	if (authUser.role !== 'admin') return jsonError('Forbidden', 403);

	const db = createDb(event.platform.env.DB);
	const body = await event.request.json();

	const { name, username, email, role, storageLimitGB } = body;

	// Update user fields if any provided
	const userFields: Record<string, unknown> = {};
	if (name !== undefined) userFields.name = name;
	if (username !== undefined) userFields.username = username;
	if (email !== undefined) userFields.email = email;
	if (role !== undefined) userFields.role = role;

	if (Object.keys(userFields).length > 0) {
		userFields.updatedAt = new Date();
		await db.update(user).set(userFields).where(eq(user.id, event.params.id));
	}

	// Update storage limit if provided
	if (storageLimitGB !== undefined) {
		const storageLimitBytes = storageLimitGB * 1073741824;
		await db
			.update(userQuota)
			.set({ storageLimitBytes, updatedAt: new Date() })
			.where(eq(userQuota.userId, event.params.id));
	}

	return jsonSuccess({ success: true });
};

export const DELETE: RequestHandler = async (event) => {
	if (!event.platform) return jsonError('Platform not available', 500);
	const authUser = await getAuthenticatedUser(event.request, event.platform);
	if (!authUser) return jsonError('Unauthorized', 401);
	if (authUser.role !== 'admin') return jsonError('Forbidden', 403);

	const db = createDb(event.platform.env.DB);

	// Find user
	const targetUser = await db.query.user.findFirst({
		where: eq(user.id, event.params.id)
	});
	if (!targetUser) return jsonError('User not found', 404);

	// Get all files for this user to delete from R2
	const files = await db.query.file.findMany({
		where: eq(file.userId, event.params.id)
	});

	// Delete files from R2
	if (files.length > 0) {
		await Promise.all(files.map((f) => event.platform.env.R2.delete(f.r2Key)));
	}

	// Delete upload sessions (no cascade on their FK to user)
	await db.delete(uploadSession).where(eq(uploadSession.userId, event.params.id));

	// Delete user (cascades to projects, versions, files, quotaRequests, sessions, accounts)
	await db.delete(user).where(eq(user.id, event.params.id));

	return jsonSuccess({ success: true });
};
