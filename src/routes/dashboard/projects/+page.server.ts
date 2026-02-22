import { eq, sql, inArray } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { project, file, version, projectMember } from '$lib/server/db/schema.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ parent, platform }) => {
	const { user } = await parent();

	if (!platform) {
		return { projects: [] };
	}

	const db = createDb(platform.env.DB);

	// Get projects the user owns
	const ownedProjects = await db.query.project.findMany({
		where: eq(project.userId, user.id),
		orderBy: (p, { desc }) => [desc(p.createdAt)]
	});

	// Get projects the user is a member of (via invitations)
	const memberships = await db.query.projectMember.findMany({
		where: eq(projectMember.userId, user.id)
	});

	// Build a map of projectId -> member role
	const memberRoleMap = new Map<string, string>();
	for (const m of memberships) {
		memberRoleMap.set(m.projectId, m.role);
	}

	// Get member project IDs that the user doesn't own
	const ownedIds = new Set(ownedProjects.map((p) => p.id));
	const memberProjectIds = memberships
		.map((m) => m.projectId)
		.filter((id) => !ownedIds.has(id));

	// Fetch the member projects
	let memberProjects: typeof ownedProjects = [];
	if (memberProjectIds.length > 0) {
		memberProjects = await db.query.project.findMany({
			where: inArray(project.id, memberProjectIds),
			orderBy: (p, { desc }) => [desc(p.createdAt)]
		});
	}

	// Combine: owned first, then member projects
	const allProjects = [...ownedProjects, ...memberProjects];

	// Get file counts and total downloads per project
	const projectStats = await Promise.all(
		allProjects.map(async (proj) => {
			const fileStats = await db
				.select({
					count: sql<number>`count(*)`,
					downloads: sql<number>`coalesce(sum(${file.downloadCount}), 0)`,
					totalSize: sql<number>`coalesce(sum(${file.sizeBytes}), 0)`
				})
				.from(file)
				.where(eq(file.projectId, proj.id));

			const versionCount = await db
				.select({ count: sql<number>`count(*)` })
				.from(version)
				.where(eq(version.projectId, proj.id));

			const isOwner = proj.userId === user.id;

			return {
				...proj,
				fileCount: fileStats[0]?.count ?? 0,
				totalDownloads: fileStats[0]?.downloads ?? 0,
				totalSize: fileStats[0]?.totalSize ?? 0,
				versionCount: versionCount[0]?.count ?? 0,
				role: isOwner ? 'owner' : (memberRoleMap.get(proj.id) ?? 'viewer')
			};
		})
	);

	return { projects: projectStats };
};
