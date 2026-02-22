import { createDb } from '$lib/server/db/index.js';
import { user, project, file, userQuota } from '$lib/server/db/schema.js';
import { sql, eq, desc, count } from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';

const DEFAULT_LIMIT = 20;

export const load: PageServerLoad = async ({ platform, url }) => {
	if (!platform) {
		return { users: [], page: 1, totalPages: 1, total: 0, limit: DEFAULT_LIMIT };
	}

	const db = createDb(platform.env.DB);

	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
	const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10)));
	const offset = (page - 1) * limit;

	const [totalResult, pagedUsers] = await Promise.all([
		db.select({ count: count() }).from(user),
		db
			.select({
				id: user.id,
				name: user.name,
				username: user.username,
				email: user.email,
				image: user.image,
				role: user.role,
				emailVerified: user.emailVerified,
				createdAt: user.createdAt,
				// Subquery aggregates avoid N+1 by computing stats in a single SQL pass
				projectCount: sql<number>`(
					select count(*) from ${project}
					where ${project.userId} = ${user.id}
				)`,
				totalDownloads: sql<number>`coalesce((
					select sum(${file.downloadCount}) from ${file}
					where ${file.userId} = ${user.id}
				), 0)`,
				storageUsed: sql<number>`coalesce((
					select ${userQuota.storageUsedBytes} from ${userQuota}
					where ${userQuota.userId} = ${user.id}
				), 0)`,
				storageLimit: sql<number>`coalesce((
					select ${userQuota.storageLimitBytes} from ${userQuota}
					where ${userQuota.userId} = ${user.id}
				), 107374182400)`,
			registrationIp: user.registrationIp,
			ipAccountCount: sql<number>`coalesce((
					select count(*) from ${user} u2
					where u2.registration_ip is not null
					and u2.registration_ip = ${user.registrationIp}
				), 0)`
			})
			.from(user)
			.orderBy(desc(user.createdAt))
			.limit(limit)
			.offset(offset)
	]);

	const total = totalResult[0]?.count ?? 0;
	const totalPages = Math.ceil(total / limit);

	return { users: pagedUsers, page, totalPages, total, limit };
};
