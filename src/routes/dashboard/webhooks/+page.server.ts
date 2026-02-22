import { eq } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { webhook, webhookDelivery } from '$lib/server/db/schema.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ parent, platform }) => {
	const { user } = await parent();

	if (!platform) throw new Error('Platform not available');

	const db = createDb(platform.env.DB);

	const webhooks = await db.query.webhook.findMany({
		where: eq(webhook.userId, user.id),
		orderBy: (w, { desc }) => [desc(w.createdAt)]
	});

	// Load recent deliveries for each webhook (last 20 per webhook)
	const deliveriesMap: Record<string, typeof webhookDelivery.$inferSelect[]> = {};

	for (const wh of webhooks) {
		const deliveries = await db.query.webhookDelivery.findMany({
			where: eq(webhookDelivery.webhookId, wh.id),
			orderBy: (d, { desc }) => [desc(d.createdAt)],
			limit: 20
		});
		deliveriesMap[wh.id] = deliveries;
	}

	return {
		webhooks: webhooks.map((wh) => ({
			...wh,
			events: JSON.parse(wh.events || '[]') as string[]
		})),
		deliveriesMap
	};
};
