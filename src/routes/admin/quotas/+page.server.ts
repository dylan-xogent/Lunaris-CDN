import { createDb } from '$lib/server/db/index.js';
import { quotaRequest, user, userQuota } from '$lib/server/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform) {
		return { requests: [] };
	}

	const db = createDb(platform.env.DB);

	const requests = await db
		.select({
			id: quotaRequest.id,
			userId: quotaRequest.userId,
			requestedBytes: quotaRequest.requestedBytes,
			reason: quotaRequest.reason,
			status: quotaRequest.status,
			adminNote: quotaRequest.adminNote,
			createdAt: quotaRequest.createdAt,
			resolvedAt: quotaRequest.resolvedAt,
			userName: user.name,
			userUsername: user.username,
			userEmail: user.email,
			storageUsedBytes: userQuota.storageUsedBytes,
			storageLimitBytes: userQuota.storageLimitBytes
		})
		.from(quotaRequest)
		.innerJoin(user, eq(quotaRequest.userId, user.id))
		.leftJoin(userQuota, eq(quotaRequest.userId, userQuota.userId))
		.orderBy(desc(quotaRequest.createdAt));

	return { requests };
};
