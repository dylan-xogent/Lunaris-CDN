// ─── Quota notification helper ──────────────────────────────────────────────
//
// Checks the user's current storage usage and sends a warning email when they
// cross the 80% or 95% thresholds.
//
// To avoid spamming, we only send one email per threshold crossing. We track
// this using the KV store (key: `quota-notified:{userId}`) that holds the
// highest threshold already notified, as a plain string ('80' | '95').
// If the platform has no KV binding we fall back to a no-op so the upload
// still succeeds.

import { eq } from 'drizzle-orm';
import type { Database } from './db/index.js';
import { user, userQuota } from './db/schema.js';
import { sendEmail } from './email.js';
import { quotaWarningEmail } from './email-templates.js';
import { generateUnsubscribeToken } from './unsubscribe.js';

const THRESHOLD_80 = 80;
const THRESHOLD_95 = 95;

type Env = App.Platform['env'];

/**
 * Derives the current threshold bucket that should have been notified.
 * Returns 0 if no notification is warranted.
 */
function requiredThreshold(usedPct: number): 0 | 80 | 95 {
	if (usedPct >= THRESHOLD_95) return 95;
	if (usedPct >= THRESHOLD_80) return 80;
	return 0;
}

/**
 * Reads the last-notified threshold from KV.
 * Returns 0 if the key is absent or KV is unavailable.
 */
async function getLastNotified(env: Env, userId: string): Promise<0 | 80 | 95> {
	try {
		// KV binding name may differ per project; use optional chaining defensively
		const kv = (env as unknown as Record<string, KVNamespace | undefined>)['KV'] ?? null;
		if (!kv) return 0;
		const val = await kv.get(`quota-notified:${userId}`);
		if (val === '95') return 95;
		if (val === '80') return 80;
		return 0;
	} catch {
		return 0;
	}
}

/**
 * Stores the newly-notified threshold in KV (TTL: 90 days).
 */
async function setLastNotified(env: Env, userId: string, threshold: 80 | 95): Promise<void> {
	try {
		const kv = (env as unknown as Record<string, KVNamespace | undefined>)['KV'] ?? null;
		if (!kv) return;
		await kv.put(`quota-notified:${userId}`, String(threshold), {
			expirationTtl: 60 * 60 * 24 * 90 // 90 days
		});
	} catch {
		// Non-fatal
	}
}

/**
 * Call this after a successful upload to check quota thresholds and send a
 * warning email if needed. Always non-blocking — errors are swallowed.
 */
export async function checkAndNotifyQuota(
	db: Database,
	env: Env,
	userId: string
): Promise<void> {
	try {
		// Fetch quota
		const quota = await db.query.userQuota.findFirst({
			where: eq(userQuota.userId, userId)
		});
		if (!quota) return;

		const { storageUsedBytes, storageLimitBytes } = quota;
		if (storageLimitBytes <= 0) return;

		const usedPct = Math.floor((storageUsedBytes / storageLimitBytes) * 100);
		const needed = requiredThreshold(usedPct);
		if (needed === 0) return;

		const lastNotified = await getLastNotified(env, userId);
		// Only send if we've moved into a higher (or first) threshold
		if (lastNotified >= needed) return;

		// Fetch user details for the email
		const dbUser = await db.query.user.findFirst({
			where: eq(user.id, userId)
		});
		if (!dbUser) return;

		const token = await generateUnsubscribeToken(userId, 'quota', env.BETTER_AUTH_SECRET);
		const { subject, html } = quotaWarningEmail(
			dbUser.name,
			usedPct,
			storageUsedBytes,
			storageLimitBytes,
			token
		);

		await sendEmail(env.RESEND_API_KEY, { to: dbUser.email, subject, html });

		// Persist the new threshold so we don't re-send
		await setLastNotified(env, userId, needed);
	} catch {
		// Never let quota check errors surface to the caller
	}
}

/**
 * Resets the quota notification state for a user (e.g. after quota is
 * increased or storage is freed). Safe to call fire-and-forget.
 */
export async function resetQuotaNotification(env: Env, userId: string): Promise<void> {
	try {
		const kv = (env as unknown as Record<string, KVNamespace | undefined>)['KV'] ?? null;
		if (!kv) return;
		await kv.delete(`quota-notified:${userId}`);
	} catch {
		// Non-fatal
	}
}
