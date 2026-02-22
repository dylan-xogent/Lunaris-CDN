import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { project, projectMember, projectInvitation, user } from '$lib/server/db/schema.js';
import { checkProjectAccess, canView } from '$lib/server/project-access.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ params, parent, platform }) => {
	const { user: currentUser } = await parent();

	if (!platform) throw error(500, 'Platform not available');

	const db = createDb(platform.env.DB);
	const access = await checkProjectAccess(db, params.slug, currentUser.id);

	if (!canView(access.role)) throw error(404, 'Project not found');

	const projectId = access.projectId!;

	const proj = await db.query.project.findFirst({
		where: eq(project.id, projectId)
	});

	if (!proj) throw error(404, 'Project not found');

	const owner = await db.query.user.findFirst({
		where: eq(user.id, proj.userId)
	});

	// Get all members with user info
	const members = await db.query.projectMember.findMany({
		where: eq(projectMember.projectId, projectId)
	});

	const membersWithUsers = await Promise.all(
		members.map(async (m) => {
			const memberUser = await db.query.user.findFirst({
				where: eq(user.id, m.userId)
			});
			return {
				id: m.id,
				userId: m.userId,
				role: m.role,
				createdAt: m.createdAt,
				name: memberUser?.name ?? 'Unknown',
				email: memberUser?.email ?? '',
				username: memberUser?.username ?? '',
				image: memberUser?.image ?? null
			};
		})
	);

	// Get all invitations (pending and recent)
	const invitations = await db.query.projectInvitation.findMany({
		where: eq(projectInvitation.projectId, projectId),
		orderBy: (inv, { desc }) => [desc(inv.createdAt)]
	});

	const invitationsWithInviters = await Promise.all(
		invitations.map(async (inv) => {
			const inviter = await db.query.user.findFirst({
				where: eq(user.id, inv.invitedBy)
			});
			return {
				id: inv.id,
				email: inv.email,
				role: inv.role,
				status: inv.status,
				expiresAt: inv.expiresAt,
				createdAt: inv.createdAt,
				inviterName: inviter?.name ?? 'Unknown'
			};
		})
	);

	return {
		project: proj,
		currentUserRole: access.role,
		owner: owner
			? { id: owner.id, name: owner.name, email: owner.email, username: owner.username, image: owner.image }
			: null,
		members: membersWithUsers,
		invitations: invitationsWithInviters
	};
};
