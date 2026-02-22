import { eq, and } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { file, downloadLog } from '$lib/server/db/schema.js';
import { getAuthenticatedUser, jsonError, jsonSuccess } from '$lib/server/middleware.js';
import { updateProjectUsage } from '$lib/server/quota.js';
import { checkProjectAccess, canView, canEdit } from '$lib/server/project-access.js';
import { sanitizePath } from '$lib/server/utils.js';
import type { RequestHandler } from './$types.js';

export const DELETE: RequestHandler = async ({ params, request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	try {
		const user = await getAuthenticatedUser(request, platform);
		if (!user) return jsonError('Unauthorized', 401);

		const db = createDb(platform.env.DB);
		const access = await checkProjectAccess(db, params.slug, user.id);

		if (!canView(access.role)) return jsonError('Project not found', 404);
		if (!canEdit(access.role)) return jsonError('You do not have permission to delete files', 403);

		const fileRecord = await db.query.file.findFirst({
			where: eq(file.id, params.fileId)
		});

		if (!fileRecord) return jsonError('File not found', 404);

		// Verify the file belongs to this project
		if (fileRecord.projectId !== access.projectId) {
			return jsonError('File not found', 404);
		}

		// Delete from R2
		await platform.env.R2.delete(fileRecord.r2Key);

		// Delete related download logs first (FK constraint)
		await db.delete(downloadLog).where(eq(downloadLog.fileId, params.fileId));

		// Delete file from DB
		await db.delete(file).where(eq(file.id, params.fileId));

		// Reclaim quota for owner + all members
		await updateProjectUsage(db, fileRecord.projectId, -fileRecord.sizeBytes);

		return jsonSuccess({ success: true });
	} catch (err) {
		console.error('File delete error:', err);
		return jsonError(err instanceof Error ? err.message : 'Internal error', 500);
	}
};

export const PATCH: RequestHandler = async ({ params, request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	try {
		const user = await getAuthenticatedUser(request, platform);
		if (!user) return jsonError('Unauthorized', 401);

		const db = createDb(platform.env.DB);
		const access = await checkProjectAccess(db, params.slug, user.id);

		if (!canView(access.role)) return jsonError('Project not found', 404);
		if (!canEdit(access.role)) return jsonError('You do not have permission to rename files', 403);

		const fileRecord = await db.query.file.findFirst({
			where: eq(file.id, params.fileId)
		});

		if (!fileRecord) return jsonError('File not found', 404);

		// Verify the file belongs to this project
		if (fileRecord.projectId !== access.projectId) {
			return jsonError('File not found', 404);
		}

		const body = await request.json();
		const { fileName, filePath } = body as { fileName?: string; filePath?: string };

		if (!fileName && !filePath) {
			return jsonError('At least one of fileName or filePath is required', 400);
		}

		const updates: { fileName?: string; filePath?: string } = {};

		if (filePath) {
			// Sanitize the new path
			let sanitized: string;
			try {
				sanitized = sanitizePath(filePath);
			} catch (err) {
				return jsonError(err instanceof Error ? err.message : 'Invalid file path', 400);
			}

			// Check for conflicts with existing files in the same version
			const existing = await db.query.file.findFirst({
				where: and(eq(file.versionId, fileRecord.versionId), eq(file.filePath, sanitized))
			});

			if (existing && existing.id !== fileRecord.id) {
				return jsonError('A file with this path already exists in this version', 409);
			}

			updates.filePath = sanitized;
			// Also update fileName to match the last segment of the path
			updates.fileName = sanitized.split('/').pop() ?? sanitized;
		} else if (fileName) {
			updates.fileName = fileName;
		}

		await db.update(file).set(updates).where(eq(file.id, params.fileId));

		// Return the updated file record
		const updatedFile = await db.query.file.findFirst({
			where: eq(file.id, params.fileId)
		});

		return jsonSuccess(updatedFile);
	} catch (err) {
		console.error('File rename error:', err);
		return jsonError(err instanceof Error ? err.message : 'Internal error', 500);
	}
};
