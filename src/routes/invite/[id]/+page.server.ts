import { error, redirect } from '@sveltejs/kit';
import { eq, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createDb } from '$lib/server/db/index.js';
import { createAuth } from '$lib/server/auth.js';
import { projectInvitation, projectMember, project, user, file } from '$lib/server/db/schema.js';
import { updateUsage } from '$lib/server/quota.js';
import type { PageServerLoad, Actions } from './$types.js';

async function getSessionUser(request: Request, platform: App.Platform) {
	const auth = createAuth(platform.env.DB, platform.env);
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session?.user) return null;

	const db = createDb(platform.env.DB);
	const dbUser = await db.query.user.findFirst({
		where: eq(user.id, session.user.id)
	});

	return dbUser
		? { id: dbUser.id, name: dbUser.name, email: dbUser.email, username: dbUser.username }
		: { id: session.user.id, name: session.user.name, email: session.user.email, username: '' };
}

export const load: PageServerLoad = async ({ params, platform, request }) => {
	if (!platform) throw error(500, 'Platform not available');

	const currentUser = await getSessionUser(request, platform);
	const db = createDb(platform.env.DB);

	const invitation = await db.query.projectInvitation.findFirst({
		where: eq(projectInvitation.id, params.id)
	});

	if (!invitation) {
		throw error(404, 'Invitation not found');
	}

	const now = new Date();

	if (invitation.status !== 'pending') {
		return {
			invitation: null,
			project: null,
			inviter: null,
			currentUser,
			errorType: invitation.status === 'accepted' ? 'already_accepted' : 'already_declined'
		};
	}

	if (invitation.expiresAt < now) {
		return {
			invitation: null,
			project: null,
			inviter: null,
			currentUser,
			errorType: 'expired'
		};
	}

	const proj = await db.query.project.findFirst({
		where: eq(project.id, invitation.projectId)
	});

	const inviter = await db.query.user.findFirst({
		where: eq(user.id, invitation.invitedBy)
	});

	return {
		invitation: {
			id: invitation.id,
			email: invitation.email,
			role: invitation.role,
			expiresAt: invitation.expiresAt,
			createdAt: invitation.createdAt
		},
		project: proj ? { id: proj.id, name: proj.name, slug: proj.slug, description: proj.description } : null,
		inviter: inviter ? { id: inviter.id, name: inviter.name, username: inviter.username } : null,
		currentUser,
		errorType: null
	};
};

export const actions: Actions = {
	accept: async ({ params, request, platform }) => {
		if (!platform) throw error(500, 'Platform not available');

		const currentUser = await getSessionUser(request, platform);
		if (!currentUser) throw redirect(302, `/auth/login?redirect=/invite/${params.id}`);

		const db = createDb(platform.env.DB);

		const invitation = await db.query.projectInvitation.findFirst({
			where: eq(projectInvitation.id, params.id)
		});

		if (!invitation) throw error(404, 'Invitation not found');
		if (invitation.status !== 'pending') throw error(400, 'This invitation is no longer valid');
		if (invitation.expiresAt < new Date()) throw error(400, 'This invitation has expired');

		// Verify email matches
		if (invitation.email.toLowerCase() !== currentUser.email?.toLowerCase()) {
			throw error(403, 'This invitation was sent to a different email address');
		}

		// Check that the user is not already a member
		const existing = await db.query.projectMember.findFirst({
			where: and(
				eq(projectMember.projectId, invitation.projectId),
				eq(projectMember.userId, currentUser.id)
			)
		});

		if (!existing) {
			// Create member record
			await db.insert(projectMember).values({
				id: nanoid(),
				projectId: invitation.projectId,
				userId: currentUser.id,
				role: invitation.role,
				invitedBy: invitation.invitedBy,
				createdAt: new Date()
			});

			// Add the project's existing file storage to the new member's quota
			const sizeResult = await db
				.select({ total: sql<number>`coalesce(sum(${file.sizeBytes}), 0)` })
				.from(file)
				.where(eq(file.projectId, invitation.projectId));

			const projectSize = sizeResult[0]?.total ?? 0;
			if (projectSize > 0) {
				await updateUsage(db, currentUser.id, projectSize);
			}
		}

		// Mark invitation as accepted
		await db
			.update(projectInvitation)
			.set({ status: 'accepted' })
			.where(eq(projectInvitation.id, params.id));

		// Get project slug to redirect
		const proj = await db.query.project.findFirst({
			where: eq(project.id, invitation.projectId)
		});

		if (proj) {
			throw redirect(302, `/dashboard/projects/${proj.slug}`);
		}

		throw redirect(302, '/dashboard/projects');
	},

	decline: async ({ params, request, platform }) => {
		if (!platform) throw error(500, 'Platform not available');

		const currentUser = await getSessionUser(request, platform);
		if (!currentUser) throw redirect(302, `/auth/login?redirect=/invite/${params.id}`);

		const db = createDb(platform.env.DB);

		const invitation = await db.query.projectInvitation.findFirst({
			where: eq(projectInvitation.id, params.id)
		});

		if (!invitation) throw error(404, 'Invitation not found');
		if (invitation.status !== 'pending') throw error(400, 'This invitation is no longer valid');

		// Verify email matches
		if (invitation.email.toLowerCase() !== currentUser.email?.toLowerCase()) {
			throw error(403, 'This invitation was sent to a different email address');
		}

		await db
			.update(projectInvitation)
			.set({ status: 'rejected' })
			.where(eq(projectInvitation.id, params.id));

		return { declined: true };
	}
};
