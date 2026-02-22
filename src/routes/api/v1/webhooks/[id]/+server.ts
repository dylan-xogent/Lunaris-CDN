import { eq, and, desc } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { webhook, webhookDelivery } from '$lib/server/db/schema.js';
import { getAuthenticatedUser, jsonError, jsonSuccess } from '$lib/server/middleware.js';
import { sendTestPing, WEBHOOK_EVENTS } from '$lib/server/webhooks.js';
import type { RequestHandler } from './$types.js';

const VALID_EVENTS = WEBHOOK_EVENTS.map((e) => e.value);

export const GET: RequestHandler = async ({ params, request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	const user = await getAuthenticatedUser(request, platform);
	if (!user) return jsonError('Unauthorized', 401);

	const db = createDb(platform.env.DB);

	const wh = await db.query.webhook.findFirst({
		where: and(eq(webhook.id, params.id), eq(webhook.userId, user.id))
	});

	if (!wh) return jsonError('Webhook not found', 404);

	const deliveries = await db.query.webhookDelivery.findMany({
		where: eq(webhookDelivery.webhookId, wh.id),
		orderBy: (d, { desc: d_ }) => [d_(d.createdAt)],
		limit: 20
	});

	return jsonSuccess({
		webhook: {
			...wh,
			events: JSON.parse(wh.events || '[]'),
			secret: undefined
		},
		deliveries
	});
};

export const PATCH: RequestHandler = async ({ params, request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	const user = await getAuthenticatedUser(request, platform);
	if (!user) return jsonError('Unauthorized', 401);

	const db = createDb(platform.env.DB);

	const wh = await db.query.webhook.findFirst({
		where: and(eq(webhook.id, params.id), eq(webhook.userId, user.id))
	});

	if (!wh) return jsonError('Webhook not found', 404);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return jsonError('Invalid JSON body', 400);
	}

	const data = body as Record<string, unknown>;
	const updates: Partial<typeof wh> & { updatedAt: Date } = { updatedAt: new Date() };

	if (typeof data.url === 'string') {
		const url = data.url.trim();
		try {
			const parsed = new URL(url);
			if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
				return jsonError('URL must use http or https protocol', 400);
			}
		} catch {
			return jsonError('Invalid URL format', 400);
		}
		updates.url = url;
	}

	if (Array.isArray(data.events)) {
		const events = data.events as string[];
		const invalidEvents = events.filter((e) => !VALID_EVENTS.includes(e as never));
		if (invalidEvents.length > 0) {
			return jsonError(`Invalid event types: ${invalidEvents.join(', ')}`, 400);
		}
		if (events.length === 0) {
			return jsonError('At least one event type is required', 400);
		}
		updates.events = JSON.stringify(events);
	}

	if (typeof data.enabled === 'boolean') {
		updates.enabled = data.enabled;
	}

	await db.update(webhook).set(updates).where(eq(webhook.id, wh.id));

	const updated = await db.query.webhook.findFirst({
		where: eq(webhook.id, wh.id)
	});

	return jsonSuccess({
		webhook: {
			...updated,
			events: JSON.parse(updated?.events || '[]'),
			secret: undefined
		}
	});
};

export const DELETE: RequestHandler = async ({ params, request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	const user = await getAuthenticatedUser(request, platform);
	if (!user) return jsonError('Unauthorized', 401);

	const db = createDb(platform.env.DB);

	const wh = await db.query.webhook.findFirst({
		where: and(eq(webhook.id, params.id), eq(webhook.userId, user.id))
	});

	if (!wh) return jsonError('Webhook not found', 404);

	// Deliveries are cascade deleted via FK
	await db.delete(webhook).where(eq(webhook.id, wh.id));

	return jsonSuccess({ success: true });
};

export const POST: RequestHandler = async ({ params, request, platform }) => {
	if (!platform) return jsonError('Platform not available', 500);

	const user = await getAuthenticatedUser(request, platform);
	if (!user) return jsonError('Unauthorized', 401);

	const db = createDb(platform.env.DB);

	try {
		const result = await sendTestPing(db, params.id, user.id);
		return jsonSuccess({ ...result });
	} catch (err) {
		return jsonError(err instanceof Error ? err.message : 'Failed to send test ping', 404);
	}
};
