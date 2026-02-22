import { error } from '@sveltejs/kit';
import { createDb } from '$lib/server/db/index.js';
import { user, project, file, version, quotaRequest } from '$lib/server/db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { getQuota } from '$lib/server/quota.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params, platform }) => {
	if (!platform) {
		throw error(500, 'Platform not available');
	}

	const db = createDb(platform.env.DB);

	const targetUser = await db.query.user.findFirst({
		where: eq(user.id, params.id)
	});

	if (!targetUser) {
		throw error(404, 'User not found');
	}

	const quota = await getQuota(db, targetUser.id);

	const userProjects = await db
		.select({
			id: project.id,
			name: project.name,
			slug: project.slug,
			description: project.description,
			isPublic: project.isPublic,
			createdAt: project.createdAt,
			fileCount: sql<number>`(select count(*) from file where file.project_id = ${project.id})`,
			versionCount: sql<number>`(select count(*) from version where version.project_id = ${project.id})`,
			totalDownloads: sql<number>`coalesce((select sum(download_count) from file where file.project_id = ${project.id}), 0)`
		})
		.from(project)
		.where(eq(project.userId, targetUser.id))
		.orderBy(desc(project.createdAt));

	const userQuotaRequests = await db
		.select()
		.from(quotaRequest)
		.where(eq(quotaRequest.userId, targetUser.id))
		.orderBy(desc(quotaRequest.createdAt));

	return {
		targetUser,
		quota: {
			used: quota.storageUsedBytes,
			limit: quota.storageLimitBytes
		},
		projects: userProjects,
		quotaRequests: userQuotaRequests
	};
};
