import { createDb } from '$lib/server/db/index.js';
import { user, project, file, userQuota, quotaRequest } from '$lib/server/db/schema.js';
import { sql, eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform) {
		return {
			totalUsers: 0,
			totalProjects: 0,
			totalFiles: 0,
			totalStorage: 0,
			totalDownloads: 0,
			pendingQuotaRequests: 0,
			recentUsers: [],
			recentFiles: []
		};
	}

	const db = createDb(platform.env.DB);

	const [users, projects, files, storage, downloads, pendingQuotas, recentUsers, recentFiles] =
		await Promise.all([
			db
				.select({ count: sql<number>`count(*)` })
				.from(user),
			db
				.select({ count: sql<number>`count(*)` })
				.from(project),
			db
				.select({ count: sql<number>`count(*)` })
				.from(file),
			db
				.select({
					total: sql<number>`coalesce(sum(${userQuota.storageUsedBytes}), 0)`
				})
				.from(userQuota),
			db
				.select({
					total: sql<number>`coalesce(sum(${file.downloadCount}), 0)`
				})
				.from(file),
			db
				.select({ count: sql<number>`count(*)` })
				.from(quotaRequest)
				.where(eq(quotaRequest.status, 'pending')),
			db
				.select({
					id: user.id,
					name: user.name,
					username: user.username,
					email: user.email,
					createdAt: user.createdAt
				})
				.from(user)
				.orderBy(desc(user.createdAt))
				.limit(5),
			db
				.select({
					id: file.id,
					fileName: file.fileName,
					sizeBytes: file.sizeBytes,
					createdAt: file.createdAt,
					projectName: project.name,
					userName: user.name,
					username: user.username
				})
				.from(file)
				.innerJoin(project, eq(file.projectId, project.id))
				.innerJoin(user, eq(file.userId, user.id))
				.orderBy(desc(file.createdAt))
				.limit(5)
		]);

	return {
		totalUsers: users[0]?.count ?? 0,
		totalProjects: projects[0]?.count ?? 0,
		totalFiles: files[0]?.count ?? 0,
		totalStorage: storage[0]?.total ?? 0,
		totalDownloads: downloads[0]?.total ?? 0,
		pendingQuotaRequests: pendingQuotas[0]?.count ?? 0,
		recentUsers,
		recentFiles
	};
};
