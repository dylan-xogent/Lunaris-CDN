import { json } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { uploadSession, file, project } from '$lib/server/db/schema.js';
import { getAuthenticatedUser, jsonError } from '$lib/server/middleware.js';
import { updateProjectUsage } from '$lib/server/quota.js';
import { checkAndNotifyQuota } from '$lib/server/quota-check.js';
import { completeUploadSchema, parseBody } from '$lib/server/validation.js';
import { dispatchWebhook } from '$lib/server/webhooks.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	try {
		const user = await getAuthenticatedUser(request, platform);
		if (!user) return jsonError('Unauthorized', 401);

		const parsed = await parseBody(request, completeUploadSchema);
		if ('error' in parsed) return parsed.error;
		const body = parsed.data;

		const db = createDb(platform.env.DB);

		const session = await db.query.uploadSession.findFirst({
			where: eq(uploadSession.id, body.uploadSessionId)
		});

		if (!session) return jsonError('Upload session not found', 404);
		if (session.userId !== user.id) return jsonError('Unauthorized', 403);
		if (session.status !== 'in_progress') return jsonError('Upload session is not active', 400);

		const uploadedParts: { partNumber: number; etag: string }[] = JSON.parse(
			session.uploadedParts
		);

		if (uploadedParts.length !== session.totalParts) {
			return jsonError(
				`Only ${uploadedParts.length} of ${session.totalParts} parts uploaded`,
				400
			);
		}

		// Complete the multipart upload
		const multipartUpload = platform.env.R2.resumeMultipartUpload(
			session.r2Key,
			session.r2UploadId
		);

		await multipartUpload.complete(uploadedParts);

		// Detect MIME type from file extension
		const mimeType = getMimeType(session.fileName);

		// Look up the project owner for webhooks/notifications
		const proj = await db.query.project.findFirst({
			where: eq(project.id, session.projectId)
		});
		const ownerId = proj?.userId ?? user.id;

		// Create file record
		const fileId = nanoid();
		await db.insert(file).values({
			id: fileId,
			versionId: session.versionId,
			projectId: session.projectId,
			userId: user.id,
			fileName: session.fileName,
			filePath: session.filePath,
			r2Key: session.r2Key,
			sizeBytes: session.totalSize,
			mimeType,
			sha256: body.sha256,
			downloadCount: 0,
			createdAt: new Date()
		});

		// Update storage quota for owner + all members
		await updateProjectUsage(db, session.projectId, session.totalSize);

		// Mark session as completed
		await db
			.update(uploadSession)
			.set({ status: 'completed' })
			.where(eq(uploadSession.id, session.id));

		// Non-blocking: check quota thresholds and notify project owner by email
		void checkAndNotifyQuota(db, platform.env, ownerId);

		// Dispatch file.uploaded webhook event for project owner
		dispatchWebhook(
			db,
			ownerId,
			'file.uploaded',
			{
				fileId,
				fileName: session.fileName,
				filePath: session.filePath,
				projectId: session.projectId,
				versionId: session.versionId,
				sizeBytes: session.totalSize,
				mimeType,
				sha256: body.sha256
			},
			platform.context
		);

		return json({
			file: {
				id: fileId,
				fileName: session.fileName,
				filePath: session.filePath,
				sizeBytes: session.totalSize,
				sha256: body.sha256,
				mimeType
			}
		});
	} catch (err) {
		console.error('Upload complete error:', err);
		return jsonError(err instanceof Error ? err.message : 'Internal error', 500);
	}
};

function getMimeType(fileName: string): string {
	const ext = fileName.split('.').pop()?.toLowerCase();
	const mimeTypes: Record<string, string> = {
		exe: 'application/vnd.microsoft.portable-executable',
		msi: 'application/x-msi',
		dmg: 'application/x-apple-diskimage',
		pkg: 'application/x-newton-compatible-pkg',
		deb: 'application/vnd.debian.binary-package',
		rpm: 'application/x-rpm',
		appimage: 'application/x-executable',
		zip: 'application/zip',
		'tar.gz': 'application/gzip',
		tgz: 'application/gzip',
		gz: 'application/gzip',
		bz2: 'application/x-bzip2',
		xz: 'application/x-xz',
		'7z': 'application/x-7z-compressed',
		rar: 'application/x-rar-compressed',
		tar: 'application/x-tar',
		pdf: 'application/pdf',
		json: 'application/json',
		xml: 'application/xml',
		yaml: 'application/x-yaml',
		yml: 'application/x-yaml',
		txt: 'text/plain',
		md: 'text/markdown',
		html: 'text/html',
		css: 'text/css',
		js: 'application/javascript',
		ts: 'application/typescript',
		wasm: 'application/wasm',
		iso: 'application/x-iso9660-image',
		img: 'application/octet-stream',
		bin: 'application/octet-stream',
		dll: 'application/x-msdownload',
		so: 'application/x-sharedlib',
		dylib: 'application/x-mach-binary',
		jar: 'application/java-archive',
		war: 'application/java-archive',
		whl: 'application/x-wheel+zip',
		gem: 'application/x-tar',
		nupkg: 'application/zip',
		svg: 'image/svg+xml',
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		gif: 'image/gif',
		ico: 'image/x-icon',
		webp: 'image/webp'
	};

	return mimeTypes[ext ?? ''] ?? 'application/octet-stream';
}
