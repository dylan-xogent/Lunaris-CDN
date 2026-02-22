import { json } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { eq, count } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { project } from '$lib/server/db/schema.js';
import { getAuthenticatedUser, jsonError } from '$lib/server/middleware.js';
import { createProjectSchema, parseBody } from '$lib/server/validation.js';
import { parsePagination } from '$lib/server/utils.js';
import { slugify } from '$lib/utils.js';
import { dispatchWebhook } from '$lib/server/webhooks.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ request, platform, url }) => {
	if (!platform) return jsonError('Platform not available', 500);

	const user = await getAuthenticatedUser(request, platform);
	if (!user) return jsonError('Unauthorized', 401);

	const db = createDb(platform.env.DB);

	// Support optional pagination via ?page=&limit= query params.
	// When neither param is provided the response stays backward-compatible
	// (all projects returned, no pagination envelope).
	const pageParam = url.searchParams.get('page');
	const limitParam = url.searchParams.get('limit');
	const hasPagination = pageParam !== null || limitParam !== null;

	if (hasPagination) {
		const { page, limit, offset } = parsePagination(url.searchParams);

		const [totalResult, projects] = await Promise.all([
			db.select({ count: count() }).from(project).where(eq(project.userId, user.id)),
			db.query.project.findMany({
				where: eq(project.userId, user.id),
				orderBy: (p, { desc }) => [desc(p.createdAt)],
				limit,
				offset
			})
		]);

		const total = totalResult[0]?.count ?? 0;
		const totalPages = Math.ceil(total / limit);

		return json({
			data: projects,
			pagination: { page, limit, total, totalPages }
		});
	}

	// Legacy / non-paginated response — keeps backward compatibility
	const projects = await db.query.project.findMany({
		where: eq(project.userId, user.id),
		orderBy: (p, { desc }) => [desc(p.createdAt)]
	});

	return json({ projects });
};

export const POST: RequestHandler = async ({ request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	const user = await getAuthenticatedUser(request, platform);
	if (!user) return jsonError('Unauthorized', 401);

	const parsed = await parseBody(request, createProjectSchema);
	if ('error' in parsed) return parsed.error;
	const body = parsed.data;

	const db = createDb(platform.env.DB);
	const slug = slugify(body.name);
	if (!slug) {
		return jsonError('Project name must contain valid characters', 400);
	}

	// Check for duplicate slug
	const existing = await db.query.project.findFirst({
		where: (p, { and, eq: e }) => and(e(p.userId, user.id), e(p.slug, slug))
	});

	if (existing) {
		return jsonError('A project with this name already exists', 409);
	}

	const now = new Date();
	const newProject = {
		id: nanoid(),
		userId: user.id,
		name: body.name,
		slug,
		description: body.description || null,
		isPublic: body.isPublic,
		createdAt: now,
		updatedAt: now
	};

	await db.insert(project).values(newProject);

	// Dispatch project.created webhook event
	dispatchWebhook(
		db,
		user.id,
		'project.created',
		{
			projectId: newProject.id,
			name: newProject.name,
			slug: newProject.slug,
			description: newProject.description,
			isPublic: newProject.isPublic
		},
		platform.context
	);

	return json({ project: newProject }, { status: 201 });
};
