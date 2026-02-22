import { json } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { project, version, file, uploadSession } from '$lib/server/db/schema.js';
import { getAuthenticatedUser, jsonError } from '$lib/server/middleware.js';
import { updateProjectSchema, parseBody } from '$lib/server/validation.js';
import { deleteR2Objects } from '$lib/server/r2.js';
import { updateUsage, getProjectUserIds } from '$lib/server/quota.js';
import { slugify } from '$lib/utils.js';
import { dispatchWebhook } from '$lib/server/webhooks.js';
import { checkProjectAccess, canView, canDelete } from '$lib/server/project-access.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ params, request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	const authUser = await getAuthenticatedUser(request, platform);
	if (!authUser) return jsonError('Unauthorized', 401);

	const db = createDb(platform.env.DB);
	const access = await checkProjectAccess(db, params.slug, authUser.id);

	if (!canView(access.role)) return jsonError('Project not found', 404);

	const proj = await db.query.project.findFirst({
		where: eq(project.id, access.projectId!)
	});

	if (!proj) return jsonError('Project not found', 404);

	const versions = await db.query.version.findMany({
		where: eq(version.projectId, proj.id),
		orderBy: (v, { desc }) => [desc(v.createdAt)]
	});

	return json({ project: proj, versions, role: access.role });
};

export const PATCH: RequestHandler = async ({ params, request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	const authUser = await getAuthenticatedUser(request, platform);
	if (!authUser) return jsonError('Unauthorized', 401);

	const parsed = await parseBody(request, updateProjectSchema);
	if ('error' in parsed) return parsed.error;
	const body = parsed.data;

	const db = createDb(platform.env.DB);
	// Only owners can update project settings
	const proj = await db.query.project.findFirst({
		where: and(eq(project.userId, authUser.id), eq(project.slug, params.slug))
	});

	if (!proj) return jsonError('Project not found', 404);

	const updates: Record<string, unknown> = { updatedAt: new Date() };

	if (body.name !== undefined) {
		const newSlug = slugify(body.name);
		if (!newSlug) return jsonError('Project name must contain valid characters', 400);

		// Check slug uniqueness if changed
		if (newSlug !== proj.slug) {
			const existing = await db.query.project.findFirst({
				where: and(eq(project.userId, authUser.id), eq(project.slug, newSlug))
			});
			if (existing) return jsonError('A project with this name already exists', 409);
			updates.slug = newSlug;
		}

		updates.name = body.name;
	}

	if (body.description !== undefined) {
		updates.description = body.description || null;
	}

	if (body.isPublic !== undefined) {
		updates.isPublic = body.isPublic;
	}

	await db.update(project).set(updates).where(eq(project.id, proj.id));

	const updated = await db.query.project.findFirst({
		where: eq(project.id, proj.id)
	});

	return json({ project: updated });
};

export const DELETE: RequestHandler = async ({ params, request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	try {
		const authUser = await getAuthenticatedUser(request, platform);
		if (!authUser) return jsonError('Unauthorized', 401);

		const db = createDb(platform.env.DB);
		const access = await checkProjectAccess(db, params.slug, authUser.id);

		if (!canView(access.role)) return jsonError('Project not found', 404);
		if (!canDelete(access.role)) return jsonError('Only the project owner can delete a project', 403);

		const proj = await db.query.project.findFirst({
			where: eq(project.id, access.projectId!)
		});

		if (!proj) return jsonError('Project not found', 404);

		// Get all files to delete from R2 and reclaim quota
		const files = await db.query.file.findMany({
			where: eq(file.projectId, proj.id)
		});

		const totalSize = files.reduce((sum, f) => sum + f.sizeBytes, 0);
		const r2Keys = files.map((f) => f.r2Key);

		// Get all affected user IDs BEFORE deleting (cascade removes members)
		const affectedUserIds = await getProjectUserIds(db, proj.id);

		// Delete R2 objects
		if (r2Keys.length > 0) {
			await deleteR2Objects(platform.env.R2, r2Keys);
		}

		// Delete upload sessions first (no cascade on their FK to project/version)
		await db.delete(uploadSession).where(eq(uploadSession.projectId, proj.id));

		// Delete project (cascades to versions, files, download_logs, members)
		await db.delete(project).where(eq(project.id, proj.id));

		// Reclaim storage quota for owner + all members
		if (totalSize > 0) {
			await Promise.all(affectedUserIds.map((uid) => updateUsage(db, uid, -totalSize)));
		}

		// Dispatch project.deleted webhook event
		dispatchWebhook(
			db,
			authUser.id,
			'project.deleted',
			{
				projectId: proj.id,
				name: proj.name,
				slug: proj.slug
			},
			platform.context
		);

		return json({ success: true });
	} catch (err) {
		console.error('Project delete error:', err);
		return jsonError(err instanceof Error ? err.message : 'Internal error', 500);
	}
};
