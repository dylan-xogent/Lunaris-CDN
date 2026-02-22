import { eq } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { uploadSession } from '$lib/server/db/schema.js';
import { getAuthenticatedUser, jsonError, jsonSuccess } from '$lib/server/middleware.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	try {
		const user = await getAuthenticatedUser(request, platform);
		if (!user) return jsonError('Unauthorized', 401);

		let body: { uploadSessionId: string };
		try {
			body = await request.json();
		} catch {
			return jsonError('Invalid JSON body', 400);
		}

		if (!body.uploadSessionId) {
			return jsonError('uploadSessionId is required', 400);
		}

		const db = createDb(platform.env.DB);

		const session = await db.query.uploadSession.findFirst({
			where: eq(uploadSession.id, body.uploadSessionId)
		});

		if (!session) return jsonError('Upload session not found', 404);
		if (session.userId !== user.id) return jsonError('Unauthorized', 403);

		// Only abort if still in progress
		if (session.status === 'in_progress') {
			try {
				const multipart = platform.env.R2.resumeMultipartUpload(
					session.r2Key,
					session.r2UploadId
				);
				await multipart.abort();
			} catch {
				// The multipart upload may have already been aborted or expired
			}
		}

		// Delete the session record
		await db.delete(uploadSession).where(eq(uploadSession.id, session.id));

		return jsonSuccess({ success: true });
	} catch (err) {
		console.error('Upload abort error:', err);
		return jsonError(err instanceof Error ? err.message : 'Internal error', 500);
	}
};
