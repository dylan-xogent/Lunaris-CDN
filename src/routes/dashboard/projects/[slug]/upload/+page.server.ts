import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { project, version } from '$lib/server/db/schema.js';
import { checkProjectAccess, canEdit } from '$lib/server/project-access.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params, url, parent, platform }) => {
	const { user } = await parent();

	if (!platform) throw error(500, 'Platform not available');

	const db = createDb(platform.env.DB);
	const access = await checkProjectAccess(db, params.slug, user.id);

	if (!access.role) throw error(404, 'Project not found');
	if (!canEdit(access.role)) throw error(403, 'You do not have permission to upload files');

	const proj = await db.query.project.findFirst({
		where: eq(project.id, access.projectId!)
	});

	if (!proj) throw error(404, 'Project not found');

	const versionTag = url.searchParams.get('version');

	const versions = await db.query.version.findMany({
		where: eq(version.projectId, proj.id),
		orderBy: (v, { desc }) => [desc(v.createdAt)]
	});

	if (versions.length === 0) {
		throw error(400, 'Create a version before uploading files');
	}

	return {
		project: proj,
		versions,
		selectedVersion: versionTag || versions.find((v) => v.isLatest)?.tag || versions[0].tag
	};
};
