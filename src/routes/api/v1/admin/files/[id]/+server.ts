import { eq } from 'drizzle-orm';
import { getAuthenticatedUser, jsonError, jsonSuccess } from '$lib/server/middleware.js';
import { createDb } from '$lib/server/db/index.js';
import { file } from '$lib/server/db/schema.js';
import { updateProjectUsage } from '$lib/server/quota.js';
import type { RequestHandler } from './$types.js';

export const DELETE: RequestHandler = async (event) => {
	if (!event.platform) return jsonError('Platform not available', 500);
	const authUser = await getAuthenticatedUser(event.request, event.platform);
	if (!authUser) return jsonError('Unauthorized', 401);
	if (authUser.role !== 'admin') return jsonError('Forbidden', 403);

	const db = createDb(event.platform.env.DB);

	// Find file
	const fileRecord = await db.query.file.findFirst({
		where: eq(file.id, event.params.id)
	});
	if (!fileRecord) return jsonError('File not found', 404);

	// Delete from R2
	await event.platform.env.R2.delete(fileRecord.r2Key);

	// Reclaim quota for owner + all members
	await updateProjectUsage(db, fileRecord.projectId, -fileRecord.sizeBytes);

	// Delete from DB
	await db.delete(file).where(eq(file.id, event.params.id));

	return jsonSuccess({ success: true });
};
