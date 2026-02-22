import { json } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { project, version, file, uploadSession } from '$lib/server/db/schema.js';
import { getAuthenticatedUser, jsonError } from '$lib/server/middleware.js';
import { deleteR2Objects } from '$lib/server/r2.js';
import { updateProjectUsage } from '$lib/server/quota.js';
import { checkProjectAccess, canView, canEdit } from '$lib/server/project-access.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ params, request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	const user = await getAuthenticatedUser(request, platform);
	if (!user) return jsonError('Unauthorized', 401);

	const db = createDb(platform.env.DB);
	const access = await checkProjectAccess(db, params.slug, user.id);

	if (!canView(access.role)) return jsonError('Project not found', 404);

	const proj = await db.query.project.findFirst({
		where: eq(project.id, access.projectId!)
	});

	if (!proj) return jsonError('Project not found', 404);

	const ver = await db.query.version.findFirst({
		where: and(eq(version.projectId, proj.id), eq(version.tag, params.tag))
	});

	if (!ver) return jsonError('Version not found', 404);

	const files = await db.query.file.findMany({
		where: eq(file.versionId, ver.id),
		orderBy: (f, { asc }) => [asc(f.fileName)]
	});

	return json({ version: ver, files });
};

export const DELETE: RequestHandler = async ({ params, request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	try {
		const user = await getAuthenticatedUser(request, platform);
		if (!user) return jsonError('Unauthorized', 401);

		const db = createDb(platform.env.DB);
		const access = await checkProjectAccess(db, params.slug, user.id);

		if (!canView(access.role)) return jsonError('Project not found', 404);
		if (!canEdit(access.role)) return jsonError('You do not have permission to delete versions', 403);

		const proj = await db.query.project.findFirst({
			where: eq(project.id, access.projectId!)
		});

		if (!proj) return jsonError('Project not found', 404);

		const ver = await db.query.version.findFirst({
			where: and(eq(version.projectId, proj.id), eq(version.tag, params.tag))
		});

		if (!ver) return jsonError('Version not found', 404);

		// Get files for R2 cleanup and quota reclaim
		const files = await db.query.file.findMany({
			where: eq(file.versionId, ver.id)
		});

		const totalSize = files.reduce((sum, f) => sum + f.sizeBytes, 0);
		const r2Keys = files.map((f) => f.r2Key);

		// Delete R2 objects
		if (r2Keys.length > 0) {
			await deleteR2Objects(platform.env.R2, r2Keys);
		}

		const wasLatest = ver.isLatest;

		// Delete upload sessions first (no cascade on their FK to version)
		await db.delete(uploadSession).where(eq(uploadSession.versionId, ver.id));

		// Delete version (cascades to files, download_logs)
		await db.delete(version).where(eq(version.id, ver.id));

		// Reclaim quota for owner + all members
		if (totalSize > 0) {
			await updateProjectUsage(db, proj.id, -totalSize);
		}

		// If this was the latest version, promote the most recent remaining version
		if (wasLatest) {
			const remaining = await db.query.version.findFirst({
				where: eq(version.projectId, proj.id),
				orderBy: (v, { desc }) => [desc(v.createdAt)]
			});

			if (remaining) {
				await db.update(version).set({ isLatest: true }).where(eq(version.id, remaining.id));
			}
		}

		return json({ success: true });
	} catch (err) {
		console.error('Version delete error:', err);
		return jsonError(err instanceof Error ? err.message : 'Internal error', 500);
	}
};
