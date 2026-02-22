import { eq, and } from 'drizzle-orm';
import { project, projectMember } from './db/schema.js';
import type { Database } from './db/index.js';

export type ProjectRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface ProjectAccess {
	role: ProjectRole | null;
	projectId: string | null;
}

/**
 * Check what access level a user has to a project looked up by slug.
 *
 * Resolution order:
 *   1. The user owns a project with this slug → 'owner'
 *   2. The user is a member of ANY project with this slug → member role
 *
 * Since slug uniqueness is per (userId, slug), two different owners can have
 * the same slug. We prioritise the user's own project first, then fall back
 * to membership (which could match any owner's project).
 *
 * Returns { role, projectId } where role is null if no access.
 */
export async function checkProjectAccess(
	db: Database,
	slug: string,
	userId: string
): Promise<ProjectAccess> {
	// 1. Check ownership first
	const ownedProject = await db.query.project.findFirst({
		where: and(eq(project.slug, slug), eq(project.userId, userId))
	});

	if (ownedProject) {
		return { role: 'owner', projectId: ownedProject.id };
	}

	// 2. Find all projects with this slug, then check if the user is a member
	const allProjectsWithSlug = await db.query.project.findMany({
		where: eq(project.slug, slug)
	});

	for (const proj of allProjectsWithSlug) {
		const member = await db.query.projectMember.findFirst({
			where: and(eq(projectMember.projectId, proj.id), eq(projectMember.userId, userId))
		});

		if (member) {
			return { role: member.role as ProjectRole, projectId: proj.id };
		}
	}

	return { role: null, projectId: allProjectsWithSlug[0]?.id ?? null };
}

/**
 * Check access to a specific project by its ID.
 */
export async function checkProjectAccessById(
	db: Database,
	projectId: string,
	userId: string
): Promise<ProjectRole | null> {
	const proj = await db.query.project.findFirst({
		where: eq(project.id, projectId)
	});

	if (!proj) return null;

	if (proj.userId === userId) return 'owner';

	const member = await db.query.projectMember.findFirst({
		where: and(eq(projectMember.projectId, projectId), eq(projectMember.userId, userId))
	});

	if (!member) return null;

	return member.role as ProjectRole;
}

export function canView(role: ProjectRole | null): boolean {
	return role !== null;
}

export function canEdit(role: ProjectRole | null): boolean {
	return role === 'owner' || role === 'admin' || role === 'editor';
}

export function canManageMembers(role: ProjectRole | null): boolean {
	return role === 'owner' || role === 'admin';
}

export function canDelete(role: ProjectRole | null): boolean {
	return role === 'owner';
}
