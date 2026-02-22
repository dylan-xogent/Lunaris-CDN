import { error } from '@sveltejs/kit';
import { eq, and, sql } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { project, version, file, projectMember } from '$lib/server/db/schema.js';
import { checkProjectAccess, canView } from '$lib/server/project-access.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params, parent, platform }) => {
	const { user } = await parent();

	if (!platform) {
		throw error(500, 'Platform not available');
	}

	const db = createDb(platform.env.DB);
	const access = await checkProjectAccess(db, params.slug, user.id);

	if (!canView(access.role)) {
		throw error(404, 'Project not found');
	}

	const proj = await db.query.project.findFirst({
		where: eq(project.id, access.projectId!)
	});

	if (!proj) {
		throw error(404, 'Project not found');
	}

	const versions = await db.query.version.findMany({
		where: eq(version.projectId, proj.id),
		orderBy: (v, { desc }) => [desc(v.createdAt)]
	});

	// Get file counts and stats per version
	const versionsWithStats = await Promise.all(
		versions.map(async (ver) => {
			const files = await db.query.file.findMany({
				where: eq(file.versionId, ver.id),
				orderBy: (f, { asc }) => [asc(f.fileName)]
			});

			const totalSize = files.reduce((sum, f) => sum + f.sizeBytes, 0);
			const totalDownloads = files.reduce((sum, f) => sum + f.downloadCount, 0);

			return {
				...ver,
				files,
				fileCount: files.length,
				totalSize,
				totalDownloads
			};
		})
	);

	// Get project-level stats
	const stats = await db
		.select({
			totalFiles: sql<number>`count(*)`,
			totalDownloads: sql<number>`coalesce(sum(${file.downloadCount}), 0)`,
			totalSize: sql<number>`coalesce(sum(${file.sizeBytes}), 0)`
		})
		.from(file)
		.where(eq(file.projectId, proj.id));

	// Get member count (excluding owner)
	const members = await db.query.projectMember.findMany({
		where: eq(projectMember.projectId, proj.id)
	});

	return {
		project: proj,
		versions: versionsWithStats,
		stats: {
			totalFiles: stats[0]?.totalFiles ?? 0,
			totalDownloads: stats[0]?.totalDownloads ?? 0,
			totalSize: stats[0]?.totalSize ?? 0
		},
		memberCount: members.length,
		currentUserRole: access.role
	};
};
