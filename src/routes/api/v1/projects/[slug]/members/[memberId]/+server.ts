import { eq, and, sql } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { project, projectMember, file } from '$lib/server/db/schema.js';
import { getAuthenticatedUser, jsonError, jsonSuccess } from '$lib/server/middleware.js';
import { updateUsage } from '$lib/server/quota.js';
import { checkProjectAccess, canManageMembers, canView } from '$lib/server/project-access.js';
import type { RequestHandler } from './$types.js';

export const PATCH: RequestHandler = async ({ params, request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	const authUser = await getAuthenticatedUser(request, platform);
	if (!authUser) return jsonError('Unauthorized', 401);

	const db = createDb(platform.env.DB);
	const access = await checkProjectAccess(db, params.slug, authUser.id);

	if (!canView(access.role)) return jsonError('Project not found', 404);
	if (!canManageMembers(access.role)) return jsonError('You do not have permission to update member roles', 403);

	const projectId = access.projectId!;

	// Get the member to update
	const member = await db.query.projectMember.findFirst({
		where: and(eq(projectMember.id, params.memberId), eq(projectMember.projectId, projectId))
	});

	if (!member) return jsonError('Member not found', 404);

	// Non-owners (admins) cannot promote someone to admin or modify other admins
	if (access.role === 'admin') {
		if (member.role === 'admin') {
			return jsonError('Admins cannot modify other admins', 403);
		}
	}

	let body: { role: string };
	try {
		body = await request.json();
	} catch {
		return jsonError('Invalid JSON body', 400);
	}

	const { role } = body;
	const validRoles = ['viewer', 'editor', 'admin'];
	if (!role || !validRoles.includes(role)) {
		return jsonError('Role must be one of: viewer, editor, admin', 400);
	}

	// Non-owners cannot assign admin role
	if (access.role === 'admin' && role === 'admin') {
		return jsonError('Only the project owner can assign the admin role', 403);
	}

	await db
		.update(projectMember)
		.set({ role })
		.where(and(eq(projectMember.id, params.memberId), eq(projectMember.projectId, projectId)));

	const updated = await db.query.projectMember.findFirst({
		where: eq(projectMember.id, params.memberId)
	});

	return jsonSuccess({ member: updated });
};

export const DELETE: RequestHandler = async ({ params, request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	const authUser = await getAuthenticatedUser(request, platform);
	if (!authUser) return jsonError('Unauthorized', 401);

	const db = createDb(platform.env.DB);
	const access = await checkProjectAccess(db, params.slug, authUser.id);

	if (!canView(access.role)) return jsonError('Project not found', 404);

	const projectId = access.projectId!;

	// Get the member to remove
	const member = await db.query.projectMember.findFirst({
		where: and(eq(projectMember.id, params.memberId), eq(projectMember.projectId, projectId))
	});

	if (!member) return jsonError('Member not found', 404);

	// Users can remove themselves; otherwise only owner/admin can remove members
	const isSelf = member.userId === authUser.id;
	if (!isSelf && !canManageMembers(access.role)) {
		return jsonError('You do not have permission to remove members', 403);
	}

	// Admins cannot remove other admins (only owner can)
	if (!isSelf && access.role === 'admin' && member.role === 'admin') {
		return jsonError('Admins cannot remove other admins', 403);
	}

	// Verify this member is not the project owner
	const proj = await db.query.project.findFirst({
		where: eq(project.id, projectId)
	});
	if (proj && member.userId === proj.userId) {
		return jsonError('Cannot remove the project owner', 400);
	}

	// Calculate the project's total file size to reclaim from removed member's quota
	const sizeResult = await db
		.select({ total: sql<number>`coalesce(sum(${file.sizeBytes}), 0)` })
		.from(file)
		.where(eq(file.projectId, projectId));

	const projectSize = sizeResult[0]?.total ?? 0;

	await db
		.delete(projectMember)
		.where(and(eq(projectMember.id, params.memberId), eq(projectMember.projectId, projectId)));

	// Reclaim the project's storage from the removed member's quota
	if (projectSize > 0) {
		await updateUsage(db, member.userId, -projectSize);
	}

	return jsonSuccess({ success: true });
};
