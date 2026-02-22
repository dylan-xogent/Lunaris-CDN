import { json } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { eq, and } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { project, version, file, uploadSession } from '$lib/server/db/schema.js';
import { getAuthenticatedUser, jsonError } from '$lib/server/middleware.js';
import { checkQuota } from '$lib/server/quota.js';
import { initiateUploadSchema, parseBody } from '$lib/server/validation.js';
import { sanitizePath } from '$lib/server/utils.js';
import { cleanupExpiredSessions } from '$lib/server/uploadCleanup.js';
import { checkProjectAccess, canView, canEdit } from '$lib/server/project-access.js';
import type { RequestHandler } from './$types.js';

const PART_SIZE = 50 * 1024 * 1024; // 50 MB
const MIN_PART_SIZE = 5 * 1024 * 1024; // 5 MB (R2 minimum)

export const POST: RequestHandler = async ({ request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	try {
		const user = await getAuthenticatedUser(request, platform);
		if (!user) return jsonError('Unauthorized', 401);

		const parsed = await parseBody(request, initiateUploadSchema);
		if ('error' in parsed) return parsed.error;
		const body = parsed.data;

		const db = createDb(platform.env.DB);

		// Piggyback cleanup of expired upload sessions (fire-and-forget, non-blocking)
		cleanupExpiredSessions(db, platform.env.R2).catch((err) => {
			console.error('Background session cleanup failed:', err);
		});

		// Verify project access
		const access = await checkProjectAccess(db, body.projectSlug, user.id);

		if (!canView(access.role)) return jsonError('Project not found', 404);
		if (!canEdit(access.role)) return jsonError('You do not have permission to upload files', 403);

		const proj = await db.query.project.findFirst({
			where: eq(project.id, access.projectId!)
		});

		if (!proj) return jsonError('Project not found', 404);

		// Verify version exists
		const ver = await db.query.version.findFirst({
			where: and(eq(version.projectId, proj.id), eq(version.tag, body.versionTag))
		});

		if (!ver) return jsonError('Version not found', 404);

		// Check storage quota — the upload counts against both the uploader and the owner
		const uploaderQuota = await checkQuota(db, user.id, body.totalSize);
		if (!uploaderQuota.allowed) {
			return jsonError(
				`Insufficient storage. ${Math.round(uploaderQuota.remaining / (1024 * 1024))} MB remaining.`,
				413
			);
		}
		if (user.id !== proj.userId) {
			const ownerQuota = await checkQuota(db, proj.userId, body.totalSize);
			if (!ownerQuota.allowed) {
				return jsonError('The project owner has insufficient storage for this upload.', 413);
			}
		}

		// Sanitize file path to prevent path traversal
		let filePath: string;
		try {
			const rawPath = body.filePath || body.fileName;
			filePath = sanitizePath(rawPath);
		} catch (err) {
			return jsonError(err instanceof Error ? err.message : 'Invalid file path', 400);
		}

		// Check if file already exists in this version
		const existingFile = await db.query.file.findFirst({
			where: and(eq(file.versionId, ver.id), eq(file.filePath, filePath))
		});

		if (existingFile) {
			return jsonError('A file with this path already exists in this version', 409);
		}

		// Calculate parts
		const partSize = body.totalSize <= MIN_PART_SIZE ? body.totalSize : PART_SIZE;
		const totalParts = Math.ceil(body.totalSize / partSize);

		// Create R2 key — use project owner's ID so all files live under the same namespace
		const r2Key = `${proj.userId}/${proj.slug}/${ver.tag}/${filePath}`;

		// Create R2 multipart upload
		const multipartUpload = await platform.env.R2.createMultipartUpload(r2Key);

		// Create upload session
		const sessionId = nanoid();
		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

		await db.insert(uploadSession).values({
			id: sessionId,
			userId: user.id,
			projectId: proj.id,
			versionId: ver.id,
			fileName: body.fileName,
			filePath,
			r2Key,
			r2UploadId: multipartUpload.uploadId,
			totalSize: body.totalSize,
			partSize,
			totalParts,
			uploadedParts: '[]',
			status: 'in_progress',
			expiresAt,
			createdAt: new Date()
		});

		return json(
			{
				uploadSessionId: sessionId,
				partSize,
				totalParts,
				expiresAt: expiresAt.toISOString()
			},
			{ status: 201 }
		);
	} catch (err) {
		console.error('Upload initiate error:', err);
		return jsonError(err instanceof Error ? err.message : 'Internal error', 500);
	}
};
