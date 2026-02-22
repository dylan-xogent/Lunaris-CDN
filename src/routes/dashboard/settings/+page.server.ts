import { eq } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { account, quotaRequest } from '$lib/server/db/schema.js';
import { getQuota } from '$lib/server/quota.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ parent, platform }) => {
	const { user } = await parent();

	if (!platform) throw new Error('Platform not available');

	const db = createDb(platform.env.DB);
	const quota = await getQuota(db, user.id);

	const requests = await db.query.quotaRequest.findMany({
		where: eq(quotaRequest.userId, user.id),
		orderBy: (r, { desc }) => [desc(r.createdAt)]
	});

	// Determine if the user has a password-based account (for deletion confirmation UI)
	const accounts = await db.query.account.findMany({
		where: eq(account.userId, user.id),
		columns: { providerId: true, password: true }
	});
	const hasPassword = accounts.some((a) => a.providerId === 'credential' && a.password);

	return {
		quota: {
			used: quota.storageUsedBytes,
			limit: quota.storageLimitBytes
		},
		quotaRequests: requests,
		hasPassword
	};
};
