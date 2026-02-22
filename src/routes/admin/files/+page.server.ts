import { createDb } from '$lib/server/db/index.js';
import { file, project, user, version } from '$lib/server/db/schema.js';
import { eq, desc, count } from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

const DEFAULT_LIMIT = 20;

export const load: PageServerLoad = async ({ platform, url }) => {
	if (!platform) {
		return { files: [], page: 1, totalPages: 1, total: 0, limit: DEFAULT_LIMIT };
	}

	const db = createDb(platform.env.DB);

	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
	const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10)));
	const offset = (page - 1) * limit;

	const [totalResult, files] = await Promise.all([
		db.select({ count: count() }).from(file),
		db
			.select({
				id: file.id,
				fileName: file.fileName,
				filePath: file.filePath,
				sizeBytes: file.sizeBytes,
				mimeType: file.mimeType,
				downloadCount: file.downloadCount,
				createdAt: file.createdAt,
				projectId: project.id,
				projectName: project.name,
				projectSlug: project.slug,
				ownerUsername: user.username,
				versionTag: version.tag
			})
			.from(file)
			.innerJoin(project, eq(file.projectId, project.id))
			.innerJoin(user, eq(file.userId, user.id))
			.innerJoin(version, eq(file.versionId, version.id))
			.orderBy(desc(file.createdAt))
			.limit(limit)
			.offset(offset)
	]);

	const total = totalResult[0]?.count ?? 0;
	const totalPages = Math.ceil(total / limit);

	return { files, page, totalPages, total, limit };
};
