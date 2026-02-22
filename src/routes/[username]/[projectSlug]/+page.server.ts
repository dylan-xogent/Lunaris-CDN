import { error } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { user, project, version, file } from '$lib/server/db/schema.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params, platform }) => {
	if (!platform) throw error(500, 'Platform not available');

	const db = createDb(platform.env.DB);

	const profileUser = await db.query.user.findFirst({
		where: eq(user.username, params.username)
	});

	if (!profileUser) throw error(404, 'User not found');

	const proj = await db.query.project.findFirst({
		where: and(
			eq(project.userId, profileUser.id),
			eq(project.slug, params.projectSlug),
			eq(project.isPublic, true)
		)
	});

	if (!proj) throw error(404, 'Project not found');

	const versions = await db.query.version.findMany({
		where: eq(version.projectId, proj.id),
		orderBy: (v, { desc }) => [desc(v.createdAt)]
	});

	const versionsWithFiles = await Promise.all(
		versions.map(async (ver) => {
			const files = await db.query.file.findMany({
				where: eq(file.versionId, ver.id),
				orderBy: (f, { asc }) => [asc(f.fileName)]
			});

			return { ...ver, files };
		})
	);

	return {
		profile: {
			name: profileUser.name,
			username: profileUser.username
		},
		project: proj,
		versions: versionsWithFiles
	};
};
