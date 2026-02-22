import { createDb } from '$lib/server/db/index.js';
import { project, user, file, version } from '$lib/server/db/schema.js';
import { sql, eq, desc, count } from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

const DEFAULT_LIMIT = 20;

export const load: PageServerLoad = async ({ platform, url }) => {
	if (!platform) {
		return { projects: [], page: 1, totalPages: 1, total: 0, limit: DEFAULT_LIMIT };
	}

	const db = createDb(platform.env.DB);

	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
	const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10)));
	const offset = (page - 1) * limit;

	const [totalResult, projects] = await Promise.all([
		db.select({ count: count() }).from(project),
		db
			.select({
				id: project.id,
				name: project.name,
				slug: project.slug,
				description: project.description,
				isPublic: project.isPublic,
				createdAt: project.createdAt,
				updatedAt: project.updatedAt,
				userId: project.userId,
				ownerName: user.name,
				ownerUsername: user.username,
				versionCount: sql<number>`(
					select count(*) from ${version}
					where ${version.projectId} = ${project.id}
				)`,
				fileCount: sql<number>`(
					select count(*) from ${file}
					where ${file.projectId} = ${project.id}
				)`,
				totalSize: sql<number>`coalesce((
					select sum(${file.sizeBytes}) from ${file}
					where ${file.projectId} = ${project.id}
				), 0)`,
				totalDownloads: sql<number>`coalesce((
					select sum(${file.downloadCount}) from ${file}
					where ${file.projectId} = ${project.id}
				), 0)`
			})
			.from(project)
			.innerJoin(user, eq(project.userId, user.id))
			.orderBy(desc(project.createdAt))
			.limit(limit)
			.offset(offset)
	]);

	const total = totalResult[0]?.count ?? 0;
	const totalPages = Math.ceil(total / limit);

	return { projects, page, totalPages, total, limit };
};
