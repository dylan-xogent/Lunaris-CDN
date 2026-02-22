import { json } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { eq, and, count } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { project, version } from '$lib/server/db/schema.js';
import { getAuthenticatedUser, jsonError } from '$lib/server/middleware.js';
import { createVersionSchema, parseBody } from '$lib/server/validation.js';
import { parsePagination } from '$lib/server/utils.js';
import { dispatchWebhook } from '$lib/server/webhooks.js';
import { checkProjectAccess, canView, canEdit } from '$lib/server/project-access.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ params, request, platform, url }) => {
	if (!platform) return jsonError('Platform not available', 500);

	const user = await getAuthenticatedUser(request, platform);
	if (!user) return jsonError('Unauthorized', 401);

	const db = createDb(platform.env.DB);
	const access = await checkProjectAccess(db, params.slug, user.id);

	if (!canView(access.role)) return jsonError('Project not found', 404);

	const proj = await db.query.project.findFirst({
		where: eq(project.id, access.projectId!)
	});

	if (!proj) return jsonError('Project not found', 404);

	// Support optional pagination via ?page=&limit= query params.
	// When neither param is provided the response stays backward-compatible.
	const pageParam = url.searchParams.get('page');
	const limitParam = url.searchParams.get('limit');
	const hasPagination = pageParam !== null || limitParam !== null;

	if (hasPagination) {
		const { page, limit, offset } = parsePagination(url.searchParams);

		const [totalResult, versions] = await Promise.all([
			db
				.select({ count: count() })
				.from(version)
				.where(eq(version.projectId, proj.id)),
			db.query.version.findMany({
				where: eq(version.projectId, proj.id),
				orderBy: (v, { desc }) => [desc(v.createdAt)],
				limit,
				offset
			})
		]);

		const total = totalResult[0]?.count ?? 0;
		const totalPages = Math.ceil(total / limit);

		return json({
			data: versions,
			pagination: { page, limit, total, totalPages }
		});
	}

	// Legacy / non-paginated response — keeps backward compatibility
	const versions = await db.query.version.findMany({
		where: eq(version.projectId, proj.id),
		orderBy: (v, { desc }) => [desc(v.createdAt)]
	});

	return json({ versions });
};

export const POST: RequestHandler = async ({ params, request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	const user = await getAuthenticatedUser(request, platform);
	if (!user) return jsonError('Unauthorized', 401);

	const parsed = await parseBody(request, createVersionSchema);
	if ('error' in parsed) return parsed.error;
	const { tag } = parsed.data;

	const db = createDb(platform.env.DB);
	const access = await checkProjectAccess(db, params.slug, user.id);

	if (!canView(access.role)) return jsonError('Project not found', 404);
	if (!canEdit(access.role)) return jsonError('You do not have permission to create versions', 403);

	const proj = await db.query.project.findFirst({
		where: eq(project.id, access.projectId!)
	});

	if (!proj) return jsonError('Project not found', 404);

	// Check for duplicate tag
	const existing = await db.query.version.findFirst({
		where: and(eq(version.projectId, proj.id), eq(version.tag, tag))
	});

	if (existing) {
		return jsonError('This version tag already exists', 409);
	}

	// Check if this is the first version (auto-set as latest).
	// Use a count query instead of fetching all versions to avoid loading
	// potentially large result sets.
	const [versionCountResult] = await db
		.select({ count: count() })
		.from(version)
		.where(eq(version.projectId, proj.id));

	const isFirst = (versionCountResult?.count ?? 0) === 0;

	const newVersion = {
		id: nanoid(),
		projectId: proj.id,
		tag,
		isLatest: isFirst,
		createdAt: new Date()
	};

	await db.insert(version).values(newVersion);

	// Dispatch version.created webhook event
	dispatchWebhook(
		db,
		user.id,
		'version.created',
		{
			versionId: newVersion.id,
			tag: newVersion.tag,
			projectId: proj.id,
			projectSlug: proj.slug,
			isLatest: newVersion.isLatest
		},
		platform.context
	);

	return json({ version: newVersion }, { status: 201 });
};
