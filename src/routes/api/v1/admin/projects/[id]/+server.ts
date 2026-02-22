import { eq } from 'drizzle-orm';
import { getAuthenticatedUser, jsonError, jsonSuccess } from '$lib/server/middleware.js';
import { createDb } from '$lib/server/db/index.js';
import { project, file, uploadSession } from '$lib/server/db/schema.js';
import { updateUsage, getProjectUserIds } from '$lib/server/quota.js';
import type { RequestHandler } from './$types.js';

export const PATCH: RequestHandler = async (event) => {
	if (!event.platform) return jsonError('Platform not available', 500);
	const authUser = await getAuthenticatedUser(event.request, event.platform);
	if (!authUser) return jsonError('Unauthorized', 401);
	if (authUser.role !== 'admin') return jsonError('Forbidden', 403);

	const db = createDb(event.platform.env.DB);
	const body = await event.request.json();

	const { isPublic } = body as { isPublic: boolean };

	await db
		.update(project)
		.set({ isPublic, updatedAt: new Date() })
		.where(eq(project.id, event.params.id));

	return jsonSuccess({ success: true });
};

export const DELETE: RequestHandler = async (event) => {
	if (!event.platform) return jsonError('Platform not available', 500);
	const authUser = await getAuthenticatedUser(event.request, event.platform);
	if (!authUser) return jsonError('Unauthorized', 401);
	if (authUser.role !== 'admin') return jsonError('Forbidden', 403);

	const db = createDb(event.platform.env.DB);

	// Find project
	const proj = await db.query.project.findFirst({
		where: eq(project.id, event.params.id)
	});
	if (!proj) return jsonError('Project not found', 404);

	// Get all files for this project to delete from R2
	const files = await db.query.file.findMany({
		where: eq(file.projectId, event.params.id)
	});

	// Delete files from R2
	if (files.length > 0) {
		await Promise.all(files.map((f) => event.platform.env.R2.delete(f.r2Key)));
	}

	// Get all affected user IDs BEFORE deleting (cascade removes members)
	const totalSize = files.reduce((sum, f) => sum + f.sizeBytes, 0);
	const affectedUserIds = await getProjectUserIds(db, event.params.id);

	// Delete upload sessions (no cascade on their FK to project)
	await db.delete(uploadSession).where(eq(uploadSession.projectId, event.params.id));

	// Delete project (cascades to versions, files, members)
	await db.delete(project).where(eq(project.id, event.params.id));

	// Reclaim quota for owner + all members
	if (totalSize > 0) {
		await Promise.all(affectedUserIds.map((uid) => updateUsage(db, uid, -totalSize)));
	}

	return jsonSuccess({ success: true });
};
