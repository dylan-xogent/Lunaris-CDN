import { createDb } from '$lib/server/db/index.js';
import { getQuota } from '$lib/server/quota.js';
import { project, file } from '$lib/server/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ parent, platform }) => {
	const { user } = await parent();

	if (!platform) {
		return {
			quota: { used: 0, limit: 107_374_182_400 },
			projectCount: 0,
			totalDownloads: 0
		};
	}

	const db = createDb(platform.env.DB);

	const quota = await getQuota(db, user.id);

	const projects = await db
		.select({ count: sql<number>`count(*)` })
		.from(project)
		.where(eq(project.userId, user.id));

	const downloads = await db
		.select({ total: sql<number>`coalesce(sum(${file.downloadCount}), 0)` })
		.from(file)
		.where(eq(file.userId, user.id));

	return {
		quota: {
			used: quota.storageUsedBytes,
			limit: quota.storageLimitBytes
		},
		projectCount: projects[0]?.count ?? 0,
		totalDownloads: downloads[0]?.total ?? 0
	};
};
