import { error } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { user, project, file, version } from '$lib/server/db/schema.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params, platform }) => {
	if (!platform) throw error(500, 'Platform not available');

	const db = createDb(platform.env.DB);

	const profileUser = await db.query.user.findFirst({
		where: eq(user.username, params.username)
	});

	if (!profileUser) throw error(404, 'User not found');

	const projects = await db.query.project.findMany({
		where: (p, { and, eq: e }) => and(e(p.userId, profileUser.id), e(p.isPublic, true)),
		orderBy: (p, { desc }) => [desc(p.createdAt)]
	});

	const projectsWithStats = await Promise.all(
		projects.map(async (proj) => {
			const fileStats = await db
				.select({
					downloads: sql<number>`coalesce(sum(${file.downloadCount}), 0)`,
					totalSize: sql<number>`coalesce(sum(${file.sizeBytes}), 0)`,
					fileCount: sql<number>`count(${file.id})`
				})
				.from(file)
				.where(eq(file.projectId, proj.id));

			const versionStats = await db
				.select({
					versionCount: sql<number>`count(${version.id})`
				})
				.from(version)
				.where(eq(version.projectId, proj.id));

			return {
				name: proj.name,
				slug: proj.slug,
				description: proj.description,
				createdAt: proj.createdAt,
				totalDownloads: fileStats[0]?.downloads ?? 0,
				totalSize: fileStats[0]?.totalSize ?? 0,
				fileCount: fileStats[0]?.fileCount ?? 0,
				versionCount: versionStats[0]?.versionCount ?? 0
			};
		})
	);

	return {
		profile: {
			name: profileUser.name,
			username: profileUser.username,
			image: profileUser.image,
			createdAt: profileUser.createdAt
		},
		projects: projectsWithStats
	};
};
