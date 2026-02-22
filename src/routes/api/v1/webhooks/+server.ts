import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { webhook } from '$lib/server/db/schema.js';
import { getAuthenticatedUser, jsonError, jsonSuccess } from '$lib/server/middleware.js';
import { generateWebhookSecret, WEBHOOK_EVENTS } from '$lib/server/webhooks.js';
import type { RequestHandler } from './$types.js';

const VALID_EVENTS = WEBHOOK_EVENTS.map((e) => e.value);

export const GET: RequestHandler = async ({ request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	const user = await getAuthenticatedUser(request, platform);
	if (!user) return jsonError('Unauthorized', 401);

	const db = createDb(platform.env.DB);

	const webhooks = await db.query.webhook.findMany({
		where: eq(webhook.userId, user.id),
		orderBy: (w, { desc }) => [desc(w.createdAt)]
	});

	return jsonSuccess({
		webhooks: webhooks.map((wh) => ({
			...wh,
			events: JSON.parse(wh.events || '[]'),
			secret: undefined
		}))
	});
};

export const POST: RequestHandler = async ({ request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	const user = await getAuthenticatedUser(request, platform);
	if (!user) return jsonError('Unauthorized', 401);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return jsonError('Invalid JSON body', 400);
	}

	const data = body as Record<string, unknown>;

	const url = typeof data.url === 'string' ? data.url.trim() : '';
	if (!url) return jsonError('URL is required', 400);

	try {
		const parsed = new URL(url);
		if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
			return jsonError('URL must use http or https protocol', 400);
		}
	} catch {
		return jsonError('Invalid URL format', 400);
	}

	const events: string[] = Array.isArray(data.events) ? (data.events as string[]) : [];
	if (events.length === 0) return jsonError('At least one event type is required', 400);

	const invalidEvents = events.filter((e) => !VALID_EVENTS.includes(e as never));
	if (invalidEvents.length > 0) {
		return jsonError(`Invalid event types: ${invalidEvents.join(', ')}`, 400);
	}

	const projectId = typeof data.projectId === 'string' ? data.projectId : null;

	const db = createDb(platform.env.DB);
	const now = new Date();
	const newWebhook = {
		id: nanoid(),
		userId: user.id,
		projectId,
		url,
		secret: generateWebhookSecret(),
		events: JSON.stringify(events),
		enabled: true,
		createdAt: now,
		updatedAt: now
	};

	await db.insert(webhook).values(newWebhook);

	return jsonSuccess(
		{
			webhook: {
				...newWebhook,
				events
			}
		},
		201
	);
};
