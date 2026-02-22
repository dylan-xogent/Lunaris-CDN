// ─── Unsubscribe token helpers ──────────────────────────────────────────────
//
// Token format: base64url( userId ":" type ":" hmacHex )
// where hmacHex = HMAC-SHA256( userId + ":" + type, BETTER_AUTH_SECRET )
//
// "type" is one of: 'quota' | 'marketing'

export type UnsubscribeType = 'quota' | 'marketing';

const VALID_TYPES: UnsubscribeType[] = ['quota', 'marketing'];

async function hmac(secret: string, message: string): Promise<string> {
	const enc = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		enc.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
	return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function generateUnsubscribeToken(
	userId: string,
	type: UnsubscribeType,
	secret: string
): Promise<string> {
	const mac = await hmac(secret, `${userId}:${type}`);
	const raw = `${userId}:${type}:${mac}`;
	// base64url-encode so the token is safe in query strings
	return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function verifyUnsubscribeToken(
	token: string,
	secret: string
): Promise<{ valid: true; userId: string; type: UnsubscribeType } | { valid: false }> {
	try {
		// Restore base64 padding and standard chars
		const padded = token.replace(/-/g, '+').replace(/_/g, '/');
		const raw = atob(padded);
		const parts = raw.split(':');
		// userId may not contain ':', but type and mac won't either — safe split on first two ':'
		// format: userId:type:hmacHex  (hmac is 64 hex chars, no ':')
		if (parts.length < 3) return { valid: false };

		const mac = parts[parts.length - 1];
		const type = parts[parts.length - 2] as UnsubscribeType;
		const userId = parts.slice(0, parts.length - 2).join(':');

		if (!VALID_TYPES.includes(type)) return { valid: false };

		const expected = await hmac(secret, `${userId}:${type}`);

		// Constant-time comparison
		if (expected.length !== mac.length) return { valid: false };
		let diff = 0;
		for (let i = 0; i < expected.length; i++) {
			diff |= expected.charCodeAt(i) ^ mac.charCodeAt(i);
		}
		if (diff !== 0) return { valid: false };

		return { valid: true, userId, type };
	} catch {
		return { valid: false };
	}
}
