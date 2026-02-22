import { eq } from 'drizzle-orm';
import type { Database } from './db/index.js';
import { userQuota, project, projectMember } from './db/schema.js';

export async function ensureQuotaExists(db: Database, userId: string) {
	const existing = await db.query.userQuota.findFirst({
		where: eq(userQuota.userId, userId)
	});

	if (!existing) {
		await db.insert(userQuota).values({
			userId,
			storageLimitBytes: 107_374_182_400, // 100 GB
			storageUsedBytes: 0,
			updatedAt: new Date()
		});
	}
}

export async function getQuota(db: Database, userId: string) {
	await ensureQuotaExists(db, userId);
	const quota = await db.query.userQuota.findFirst({
		where: eq(userQuota.userId, userId)
	});
	return quota!;
}

export async function checkQuota(
	db: Database,
	userId: string,
	additionalBytes: number
): Promise<{ allowed: boolean; used: number; limit: number; remaining: number }> {
	const quota = await getQuota(db, userId);
	const remaining = quota.storageLimitBytes - quota.storageUsedBytes;

	return {
		allowed: additionalBytes <= remaining,
		used: quota.storageUsedBytes,
		limit: quota.storageLimitBytes,
		remaining
	};
}

export async function updateUsage(db: Database, userId: string, deltaBytes: number) {
	const quota = await getQuota(db, userId);
	const newUsed = Math.max(0, quota.storageUsedBytes + deltaBytes);

	await db
		.update(userQuota)
		.set({
			storageUsedBytes: newUsed,
			updatedAt: new Date()
		})
		.where(eq(userQuota.userId, userId));
}

/**
 * Get all user IDs affected by a project (owner + all members).
 */
export async function getProjectUserIds(db: Database, projectId: string): Promise<string[]> {
	const proj = await db.query.project.findFirst({
		where: eq(project.id, projectId)
	});

	if (!proj) return [];

	const members = await db.query.projectMember.findMany({
		where: eq(projectMember.projectId, projectId)
	});

	const userIds = new Set<string>();
	userIds.add(proj.userId); // owner
	for (const m of members) {
		userIds.add(m.userId);
	}

	return Array.from(userIds);
}

/**
 * Update storage usage for ALL users on a project (owner + members).
 * Used when files are uploaded to or deleted from a shared project.
 */
export async function updateProjectUsage(db: Database, projectId: string, deltaBytes: number) {
	const userIds = await getProjectUserIds(db, projectId);
	await Promise.all(userIds.map((uid) => updateUsage(db, uid, deltaBytes)));
}
