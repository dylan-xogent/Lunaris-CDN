import { eq, and } from 'drizzle-orm';
import { webhook, webhookDelivery } from './db/schema.js';
import type { Database } from './db/index.js';

export type WebhookEvent =
	| 'file.uploaded'
	| 'file.downloaded'
	| 'version.created'
	| 'project.created'
	| 'project.deleted'
	| 'ping';

export interface WebhookPayload {
	event: WebhookEvent;
	timestamp: string;
	data: Record<string, unknown>;
}

/**
 * Webhook targets must be public https URLs. Blocks localhost, private and
 * link-local ranges so webhooks can't be used to probe internal services.
 */
export function validateWebhookUrl(raw: string): string | null {
	let u: URL;
	try {
		u = new URL(raw);
	} catch {
		return 'Invalid URL format';
	}
	if (u.protocol !== 'https:') return 'Webhook URL must use https';
	if (u.username || u.password) return 'Webhook URL must not contain credentials';

	const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, '');
	if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.internal') || h.endsWith('.local')) {
		return 'Webhook URL must point to a public host';
	}
	if (h.includes(':')) {
		// Any IPv6 literal: only allow if clearly not loopback/ULA/link-local/mapped
		if (h === '::' || h === '::1' || /^(fc|fd|fe[89ab])/.test(h) || h.startsWith('::ffff:')) {
			return 'Webhook URL must point to a public host';
		}
	}
	const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
	if (m) {
		const a = Number(m[1]);
		const b = Number(m[2]);
		if (
			a === 0 || a === 10 || a === 127 || a >= 224 ||
			(a === 169 && b === 254) ||
			(a === 172 && b >= 16 && b <= 31) ||
			(a === 192 && b === 168) ||
			(a === 100 && b >= 64 && b <= 127)
		) {
			return 'Webhook URL must point to a public host';
		}
	} else if (/^\d+$/.test(h) || /^0x[0-9a-f]+$/i.test(h)) {
		return 'Webhook URL must point to a public host';
	}
	return null;
}

async function signPayload(secret: string, body: string): Promise<string> {
	const encoder = new TextEncoder();
	const keyData = encoder.encode(secret);
	const messageData = encoder.encode(body);

	const cryptoKey = await crypto.subtle.importKey(
		'raw',
		keyData,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);

	const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
	const hashArray = Array.from(new Uint8Array(signature));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	return `sha256=${hashHex}`;
}

function isDiscordWebhook(url: string): boolean {
	try {
		const parsed = new URL(url);
		return (
			(parsed.hostname === 'discord.com' || parsed.hostname === 'discordapp.com') &&
			parsed.pathname.startsWith('/api/webhooks/')
		);
	} catch {
		return false;
	}
}

function toDiscordPayload(event: WebhookEvent, payload: WebhookPayload): string {
	const eventLabels: Record<string, string> = {
		ping: 'Test Ping',
		'file.uploaded': 'File Uploaded',
		'file.downloaded': 'File Downloaded',
		'version.created': 'Version Created',
		'project.created': 'Project Created',
		'project.deleted': 'Project Deleted'
	};

	const fields = Object.entries(payload.data)
		.filter(([, v]) => v !== undefined && v !== null)
		.map(([k, v]) => ({ name: k, value: String(v), inline: true }));

	return JSON.stringify({
		embeds: [
			{
				title: eventLabels[event] || event,
				description: `Webhook event \`${event}\` from Lunaris CDN`,
				color: event === 'ping' ? 0x7c3aed : 0x3b82f6,
				fields,
				timestamp: payload.timestamp,
				footer: { text: 'Lunaris CDN Webhooks' }
			}
		]
	});
}

async function deliverWebhook(
	db: Database,
	wh: { id: string; url: string; secret: string },
	event: WebhookEvent,
	payload: WebhookPayload
): Promise<void> {
	if (validateWebhookUrl(wh.url)) return;
	const isDiscord = isDiscordWebhook(wh.url);
	const body = isDiscord ? toDiscordPayload(event, payload) : JSON.stringify(payload);
	const signature = await signPayload(wh.secret, body);

	let statusCode: number | null = null;
	let response: string | null = null;
	let success = false;

	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (!isDiscord) {
		headers['X-Webhook-Event'] = event;
		headers['X-Webhook-ID'] = wh.id;
		headers['X-Webhook-Signature'] = signature;
	}

	try {
		const res = await fetch(wh.url, {
			method: 'POST',
			headers,
			body,
			redirect: 'manual',
			signal: AbortSignal.timeout(10_000)
		});

		statusCode = res.status;
		const text = await res.text();
		response = text.slice(0, 2048);
		success = res.ok;
	} catch (err) {
		response = err instanceof Error ? err.message : 'Unknown error';
		success = false;
	}

	await db.insert(webhookDelivery).values({
		webhookId: wh.id,
		event,
		payload: body,
		statusCode,
		response,
		success,
		attemptCount: 1,
		createdAt: new Date()
	});
}

export async function dispatchWebhook(
	db: Database,
	userId: string,
	event: WebhookEvent,
	data: Record<string, unknown>,
	ctx?: { waitUntil: (promise: Promise<unknown>) => void }
): Promise<void> {
	const webhooks = await db.query.webhook.findMany({
		where: and(eq(webhook.userId, userId), eq(webhook.enabled, true))
	});

	const matching = webhooks.filter((wh) => {
		const events: string[] = JSON.parse(wh.events || '[]');
		return events.includes(event) || events.includes('*');
	});

	if (matching.length === 0) return;

	const payload: WebhookPayload = {
		event,
		timestamp: new Date().toISOString(),
		data
	};

	const deliveries = matching.map((wh) => deliverWebhook(db, wh, event, payload));
	const allDeliveries = Promise.all(deliveries);

	if (ctx?.waitUntil) {
		ctx.waitUntil(allDeliveries);
	} else {
		await allDeliveries;
	}
}

export async function sendTestPing(
	db: Database,
	webhookId: string,
	userId: string
): Promise<{ success: boolean; statusCode: number | null; response: string | null }> {
	const wh = await db.query.webhook.findFirst({
		where: and(eq(webhook.id, webhookId), eq(webhook.userId, userId))
	});

	if (!wh) throw new Error('Webhook not found');

	const payload: WebhookPayload = {
		event: 'ping',
		timestamp: new Date().toISOString(),
		data: {
			message: 'Test ping from Lunaris CDN',
			webhookId: wh.id
		}
	};

	const isDiscord = isDiscordWebhook(wh.url);
	const body = isDiscord ? toDiscordPayload('ping', payload) : JSON.stringify(payload);
	const signature = await signPayload(wh.secret, body);

	let statusCode: number | null = null;
	let response: string | null = null;
	let success = false;

	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (!isDiscord) {
		headers['X-Webhook-Event'] = 'ping';
		headers['X-Webhook-ID'] = wh.id;
		headers['X-Webhook-Signature'] = signature;
	}

	try {
		const res = await fetch(wh.url, {
			method: 'POST',
			headers,
			body,
			signal: AbortSignal.timeout(10_000)
		});

		statusCode = res.status;
		const text = await res.text();
		response = text.slice(0, 2048);
		success = res.ok;
	} catch (err) {
		response = err instanceof Error ? err.message : 'Unknown error';
		success = false;
	}

	await db.insert(webhookDelivery).values({
		webhookId: wh.id,
		event: 'ping',
		payload: body,
		statusCode,
		response,
		success,
		attemptCount: 1,
		createdAt: new Date()
	});

	return { success, statusCode, response };
}

export function generateWebhookSecret(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return Array.from(array)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export const WEBHOOK_EVENTS: { value: WebhookEvent; label: string; description: string }[] = [
	{ value: 'file.uploaded', label: 'File Uploaded', description: 'Triggered when a file is successfully uploaded' },
	{ value: 'file.downloaded', label: 'File Downloaded', description: 'Triggered when a file is downloaded' },
	{ value: 'version.created', label: 'Version Created', description: 'Triggered when a new version is created' },
	{ value: 'project.created', label: 'Project Created', description: 'Triggered when a new project is created' },
	{ value: 'project.deleted', label: 'Project Deleted', description: 'Triggered when a project is deleted' }
];
