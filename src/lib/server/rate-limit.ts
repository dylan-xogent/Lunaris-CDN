interface RateLimitEntry {
	count: number;
	windowStart: number;
}

// In-memory store: persists within a single Cloudflare Worker isolate lifetime
// Provides burst protection; not persistent across isolate restarts
const store = new Map<string, RateLimitEntry>();

/**
 * Check whether a key has exceeded its rate limit.
 *
 * @param key       Unique identifier for the requester (e.g. IP address)
 * @param limit     Maximum number of requests allowed within windowMs
 * @param windowMs  Rolling window size in milliseconds
 */
export function checkRateLimit(
	key: string,
	limit: number,
	windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
	const now = Date.now();
	const entry = store.get(key);

	if (!entry || now - entry.windowStart >= windowMs) {
		// No existing entry or window has expired — start a fresh window
		store.set(key, { count: 1, windowStart: now });
		return {
			allowed: true,
			remaining: limit - 1,
			resetAt: now + windowMs
		};
	}

	const resetAt = entry.windowStart + windowMs;

	if (entry.count >= limit) {
		return {
			allowed: false,
			remaining: 0,
			resetAt
		};
	}

	entry.count += 1;
	return {
		allowed: true,
		remaining: limit - entry.count,
		resetAt
	};
}
