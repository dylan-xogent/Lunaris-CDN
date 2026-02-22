import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { createDb } from '$lib/server/db/index.js';
import { project, projectMember, projectInvitation, user } from '$lib/server/db/schema.js';
import { getAuthenticatedUser, jsonError, jsonSuccess } from '$lib/server/middleware.js';
import { sendEmail } from '$lib/server/email.js';
import { checkProjectAccess, canManageMembers, canView } from '$lib/server/project-access.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ params, request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	const authUser = await getAuthenticatedUser(request, platform);
	if (!authUser) return jsonError('Unauthorized', 401);

	const db = createDb(platform.env.DB);
	const access = await checkProjectAccess(db, params.slug, authUser.id);

	if (!canView(access.role)) return jsonError('Project not found', 404);

	const projectId = access.projectId!;

	// Get the project owner info
	const proj = await db.query.project.findFirst({
		where: eq(project.id, projectId)
	});

	if (!proj) return jsonError('Project not found', 404);

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
			const inviter = m.invitedBy
				? await db.query.user.findFirst({ where: eq(user.id, m.invitedBy) })
				: null;
			return {
				id: m.id,
				userId: m.userId,
				role: m.role,
				createdAt: m.createdAt,
				user: memberUser
					? { id: memberUser.id, name: memberUser.name, email: memberUser.email, username: memberUser.username, image: memberUser.image }
					: null,
				invitedBy: inviter ? { id: inviter.id, name: inviter.name } : null
			};
		})
	);

	// Get pending invitations
	const invitations = await db.query.projectInvitation.findMany({
		where: and(eq(projectInvitation.projectId, projectId), eq(projectInvitation.status, 'pending'))
	});

	const invitationsWithInviters = await Promise.all(
		invitations.map(async (inv) => {
			const inviter = await db.query.user.findFirst({ where: eq(user.id, inv.invitedBy) });
			return {
				id: inv.id,
				email: inv.email,
				role: inv.role,
				status: inv.status,
				expiresAt: inv.expiresAt,
				createdAt: inv.createdAt,
				invitedBy: inviter ? { id: inviter.id, name: inviter.name } : null
			};
		})
	);

	return jsonSuccess({
		owner: owner
			? { id: owner.id, name: owner.name, email: owner.email, username: owner.username, image: owner.image }
			: null,
		members: membersWithUsers,
		invitations: invitationsWithInviters,
		currentUserRole: access.role
	});
};

export const POST: RequestHandler = async ({ params, request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	const authUser = await getAuthenticatedUser(request, platform);
	if (!authUser) return jsonError('Unauthorized', 401);

	const db = createDb(platform.env.DB);
	const access = await checkProjectAccess(db, params.slug, authUser.id);

	if (!canManageMembers(access.role)) {
		if (!canView(access.role)) return jsonError('Project not found', 404);
		return jsonError('You do not have permission to invite members', 403);
	}

	const projectId = access.projectId!;

	let body: { email: string; role: string };
	try {
		body = await request.json();
	} catch {
		return jsonError('Invalid JSON body', 400);
	}

	const { email, role } = body;

	if (!email || typeof email !== 'string') {
		return jsonError('Email is required', 400);
	}

	const emailLower = email.toLowerCase().trim();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
		return jsonError('Invalid email address', 400);
	}

	const validRoles = ['viewer', 'editor', 'admin'];
	if (!role || !validRoles.includes(role)) {
		return jsonError('Role must be one of: viewer, editor, admin', 400);
	}

	// Check that owner is not inviting themselves
	if (emailLower === authUser.email?.toLowerCase()) {
		return jsonError('You cannot invite yourself', 400);
	}

	// Check if the target user is already the project owner
	const proj = await db.query.project.findFirst({
		where: eq(project.id, projectId)
	});
	if (!proj) return jsonError('Project not found', 404);

	const targetUser = await db.query.user.findFirst({
		where: eq(user.email, emailLower)
	});

	if (targetUser && targetUser.id === proj.userId) {
		return jsonError('That user is already the project owner', 400);
	}

	// Check if user is already a member
	if (targetUser) {
		const existingMember = await db.query.projectMember.findFirst({
			where: and(eq(projectMember.projectId, projectId), eq(projectMember.userId, targetUser.id))
		});
		if (existingMember) {
			return jsonError('That user is already a member of this project', 409);
		}
	}

	// Check for existing pending invitation
	const existingInvitation = await db.query.projectInvitation.findFirst({
		where: and(
			eq(projectInvitation.projectId, projectId),
			eq(projectInvitation.email, emailLower),
			eq(projectInvitation.status, 'pending')
		)
	});

	if (existingInvitation) {
		return jsonError('A pending invitation already exists for this email', 409);
	}

	// Create invitation with 7-day expiry
	const invitationId = nanoid();
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

	await db.insert(projectInvitation).values({
		id: invitationId,
		projectId,
		email: emailLower,
		role,
		invitedBy: authUser.id,
		status: 'pending',
		expiresAt,
		createdAt: new Date()
	});

	// Send invitation email
	const inviteUrl = `https://lunaris.win/invite/${invitationId}`;
	const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

	try {
		await sendEmail(platform.env.RESEND_API_KEY, {
			to: emailLower,
			subject: `You've been invited to collaborate on ${proj.name}`,
			html: `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0f; color: #e2e8f0; margin: 0; padding: 40px 20px;">
	<div style="max-width: 520px; margin: 0 auto; background: #111118; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 40px;">
		<div style="margin-bottom: 32px;">
			<span style="font-size: 22px; font-weight: 700; background: linear-gradient(135deg, #a78bfa, #60a5fa); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Lunaris CDN</span>
		</div>
		<h1 style="font-size: 20px; font-weight: 600; color: #f1f5f9; margin: 0 0 12px;">Project Invitation</h1>
		<p style="color: #94a3b8; margin: 0 0 24px; line-height: 1.6;">
			<strong style="color: #f1f5f9;">${authUser.name}</strong> has invited you to collaborate on
			<strong style="color: #f1f5f9;">${proj.name}</strong> as a <strong style="color: #a78bfa;">${roleLabel}</strong>.
		</p>
		<a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #2563eb); color: white; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; margin-bottom: 24px;">
			Accept Invitation
		</a>
		<p style="color: #64748b; font-size: 13px; margin: 0 0 8px;">
			This invitation expires on ${expiresAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
		</p>
		<p style="color: #64748b; font-size: 13px; margin: 0;">
			If you don't have an account yet, you'll be prompted to sign up when you click the link above.
		</p>
	</div>
</body>
</html>
`
		});
	} catch (err) {
		console.error('Failed to send invitation email:', err);
		// Still return success - invitation is created even if email fails
	}

	return jsonSuccess({ invitation: { id: invitationId, email: emailLower, role, expiresAt } }, 201);
};
