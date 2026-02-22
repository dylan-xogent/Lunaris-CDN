import { json } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { createDb } from '$lib/server/db/index.js';
import { quotaRequest } from '$lib/server/db/schema.js';
import { getAuthenticatedUser, jsonError } from '$lib/server/middleware.js';
import { quotaRequestSchema, parseBody } from '$lib/server/validation.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async ({ request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	const user = await getAuthenticatedUser(request, platform);
	if (!user) return jsonError('Unauthorized', 401);

	const parsed = await parseBody(request, quotaRequestSchema);
	if ('error' in parsed) return parsed.error;
	const body = parsed.data;

	const db = createDb(platform.env.DB);
	const requestedBytes = body.requestedGB * 1024 * 1024 * 1024;

	await db.insert(quotaRequest).values({
		id: nanoid(),
		userId: user.id,
		requestedBytes,
		reason: body.reason,
		status: 'pending',
		createdAt: new Date()
	});

	return json({ success: true }, { status: 201 });
};
