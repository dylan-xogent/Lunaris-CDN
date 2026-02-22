import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { uploadSession } from '$lib/server/db/schema.js';
import { getAuthenticatedUser, jsonError } from '$lib/server/middleware.js';
import type { RequestHandler } from './$types.js';

export const PUT: RequestHandler = async ({ request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	try {
		const user = await getAuthenticatedUser(request, platform);
		if (!user) return jsonError('Unauthorized', 401);

		const sessionId = request.headers.get('x-upload-session-id');
		const partNumberStr = request.headers.get('x-part-number');

		if (!sessionId || !partNumberStr) {
			return jsonError('Missing x-upload-session-id or x-part-number headers', 400);
		}

		const partNumber = parseInt(partNumberStr, 10);
		if (isNaN(partNumber) || partNumber < 1) {
			return jsonError('Invalid part number', 400);
		}

		const db = createDb(platform.env.DB);

		const session = await db.query.uploadSession.findFirst({
			where: eq(uploadSession.id, sessionId)
		});

		if (!session) return jsonError('Upload session not found', 404);
		if (session.userId !== user.id) return jsonError('Unauthorized', 403);
		if (session.status !== 'in_progress') return jsonError('Upload session is not active', 400);

		if (new Date() > session.expiresAt) {
			return jsonError('Upload session has expired', 410);
		}

		if (partNumber > session.totalParts) {
			return jsonError(
				`Part number ${partNumber} exceeds total parts (${session.totalParts})`,
				400
			);
		}

		const uploadedParts: { partNumber: number; etag: string }[] = JSON.parse(
			session.uploadedParts
		);

		if (uploadedParts.some((p) => p.partNumber === partNumber)) {
			return jsonError(`Part ${partNumber} has already been uploaded`, 409);
		}

		// Resume the multipart upload and upload this part
		const multipartUpload = platform.env.R2.resumeMultipartUpload(
			session.r2Key,
			session.r2UploadId
		);

		const body = request.body;
		if (!body) {
			return jsonError('Request body is required', 400);
		}

		const uploadedPart = await multipartUpload.uploadPart(partNumber, body);

		// Record the uploaded part
		uploadedParts.push({ partNumber, etag: uploadedPart.etag });
		uploadedParts.sort((a, b) => a.partNumber - b.partNumber);

		await db
			.update(uploadSession)
			.set({ uploadedParts: JSON.stringify(uploadedParts) })
			.where(eq(uploadSession.id, sessionId));

		return json({
			partNumber,
			etag: uploadedPart.etag,
			uploadedCount: uploadedParts.length,
			totalParts: session.totalParts
		});
	} catch (err) {
		console.error('Upload part error:', err);
		return jsonError(err instanceof Error ? err.message : 'Internal error', 500);
	}
};
