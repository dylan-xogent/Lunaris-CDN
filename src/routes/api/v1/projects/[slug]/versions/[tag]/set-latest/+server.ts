import { json } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { project, version } from '$lib/server/db/schema.js';
import { getAuthenticatedUser, jsonError } from '$lib/server/middleware.js';
import { checkProjectAccess, canView, canEdit } from '$lib/server/project-access.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ params, request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	const user = await getAuthenticatedUser(request, platform);
	if (!user) return jsonError('Unauthorized', 401);

	const db = createDb(platform.env.DB);
	const access = await checkProjectAccess(db, params.slug, user.id);

	if (!canView(access.role)) return jsonError('Project not found', 404);
	if (!canEdit(access.role)) return jsonError('You do not have permission to modify versions', 403);

	const proj = await db.query.project.findFirst({
		where: eq(project.id, access.projectId!)
	});

	if (!proj) return jsonError('Project not found', 404);

	const ver = await db.query.version.findFirst({
		where: and(eq(version.projectId, proj.id), eq(version.tag, params.tag))
	});

	if (!ver) return jsonError('Version not found', 404);

	// Unset all versions as latest for this project
	await db
		.update(version)
		.set({ isLatest: false })
		.where(eq(version.projectId, proj.id));

	// Set this version as latest
	await db.update(version).set({ isLatest: true }).where(eq(version.id, ver.id));

	return json({ success: true });
};
