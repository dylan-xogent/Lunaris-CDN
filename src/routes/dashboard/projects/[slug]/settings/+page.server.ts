import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { project } from '$lib/server/db/schema.js';
import { checkProjectAccess, canDelete } from '$lib/server/project-access.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params, parent, platform }) => {
	const { user } = await parent();

	if (!platform) throw error(500, 'Platform not available');

	const db = createDb(platform.env.DB);
	const access = await checkProjectAccess(db, params.slug, user.id);

	// Only owners can access project settings
	if (!canDelete(access.role)) throw error(404, 'Project not found');

	const proj = await db.query.project.findFirst({
		where: eq(project.id, access.projectId!)
	});

	if (!proj) throw error(404, 'Project not found');

	return { project: proj };
};
