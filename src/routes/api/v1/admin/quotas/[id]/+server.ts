import { eq } from 'drizzle-orm';
import { getAuthenticatedUser, jsonError, jsonSuccess } from '$lib/server/middleware.js';
import { createDb } from '$lib/server/db/index.js';
import { quotaRequest, userQuota } from '$lib/server/db/schema.js';
import { ensureQuotaExists } from '$lib/server/quota.js';
import type { RequestHandler } from './$types.js';

export const PATCH: RequestHandler = async (event) => {
	if (!event.platform) return jsonError('Platform not available', 500);
	const authUser = await getAuthenticatedUser(event.request, event.platform);
	if (!authUser) return jsonError('Unauthorized', 401);
	if (authUser.role !== 'admin') return jsonError('Forbidden', 403);

	const db = createDb(event.platform.env.DB);
	const body = await event.request.json();

	const { action, adminNote } = body as { action: 'approve' | 'deny'; adminNote?: string };

	// Find the quota request
	const request = await db.query.quotaRequest.findFirst({
		where: eq(quotaRequest.id, event.params.id)
	});
	if (!request) return jsonError('Quota request not found', 404);

	if (action === 'approve') {
		await db
			.update(quotaRequest)
			.set({ status: 'approved', adminNote, resolvedAt: new Date() })
			.where(eq(quotaRequest.id, event.params.id));

		await ensureQuotaExists(db, request.userId);

		await db
			.update(userQuota)
			.set({ storageLimitBytes: request.requestedBytes, updatedAt: new Date() })
			.where(eq(userQuota.userId, request.userId));
	} else if (action === 'deny') {
		await db
			.update(quotaRequest)
			.set({ status: 'denied', adminNote, resolvedAt: new Date() })
			.where(eq(quotaRequest.id, event.params.id));
	}

	return jsonSuccess({ success: true });
};
