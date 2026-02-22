import type { Handle } from '@sveltejs/kit';
import { handleCdnRequest } from '$lib/server/cdn.js';
import { checkRateLimit } from '$lib/server/rate-limit.js';

export const handle: Handle = async ({ event, resolve }) => {
	const url = new URL(event.request.url);
	const isCdnHost = url.hostname === 'cdn.lunaris.win';

	// Handle CDN subdomain requests directly
	if (isCdnHost && event.platform) {
		const response = await handleCdnRequest(url, event.platform, event.request, event.getClientAddress);
		// Add CDN headers
		response.headers.set('Access-Control-Allow-Origin', '*');
		response.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
		response.headers.set('Access-Control-Allow-Headers', 'Range');
		response.headers.set('Access-Control-Expose-Headers', 'X-Checksum-SHA256, Content-Length');
		response.headers.set('X-Content-Type-Options', 'nosniff');
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
		return response;
	}

	// Strict rate limit for sign-up specifically (anti-abuse: 3 per hour per IP)
	if (event.request.method === 'POST' && url.pathname === '/api/auth/sign-up/email') {
		const ip = event.getClientAddress();
		const { allowed } = checkRateLimit(`signup:${ip}`, 3, 3_600_000);
		if (!allowed) {
			return new Response(JSON.stringify({ error: 'Too many registration attempts. Please try again later.' }), {
				status: 429,
				headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	// Rate limiting for auth POST requests (login, register, etc.)
	if (event.request.method === 'POST' && url.pathname.startsWith('/api/auth/')) {
		const ip = event.getClientAddress();
		const { allowed, remaining, resetAt } = checkRateLimit(`auth:${ip}`, 20, 60_000);
		if (!allowed) {
			const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
			return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
				status: 429,
				headers: {
					'Content-Type': 'application/json',
					'Retry-After': String(retryAfter),
					'X-RateLimit-Limit': '20',
					'X-RateLimit-Remaining': '0',
					'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000))
				}
			});
		}
		// Attach remaining info to the response after resolution (via header mutation below)
		void remaining; // used indirectly — logged for future extension
	}

	// Rate limiting for additional sensitive endpoints
	const rateLimitedRoutes: Array<{
		method: string;
		path: string;
		key: string;
		limit: number;
		window: number;
	}> = [
		{ method: 'POST', path: '/api/v1/upload/initiate', key: 'upload', limit: 30, window: 60_000 },
		{ method: 'POST', path: '/api/v1/quota-request', key: 'quota', limit: 5, window: 3_600_000 },
		{ method: 'POST', path: '/api/v1/user/avatar', key: 'avatar', limit: 10, window: 60_000 },
		{ method: 'DELETE', path: '/api/v1/user/delete', key: 'delete-account', limit: 3, window: 3_600_000 }
	];

	for (const route of rateLimitedRoutes) {
		if (event.request.method === route.method && url.pathname === route.path) {
			const ip = event.getClientAddress();
			const { allowed, remaining, resetAt } = checkRateLimit(`${route.key}:${ip}`, route.limit, route.window);
			if (!allowed) {
				const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
				return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
					status: 429,
					headers: {
						'Content-Type': 'application/json',
						'Retry-After': String(retryAfter),
						'X-RateLimit-Limit': String(route.limit),
						'X-RateLimit-Remaining': '0',
						'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000))
					}
				});
			}
			void remaining;
			break;
		}
	}

	const response = await resolve(event);

	const isCdn = url.pathname.startsWith('/cdn/');

	// Security headers (applied to all responses)
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	response.headers.set(
		'Strict-Transport-Security',
		'max-age=31536000; includeSubDomains; preload'
	);

	// CDN routes get CORS headers
	if (isCdn) {
		response.headers.set('Access-Control-Allow-Origin', '*');
		response.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
		response.headers.set('Access-Control-Allow-Headers', 'Range');
		response.headers.set('Access-Control-Expose-Headers', 'X-Checksum-SHA256, Content-Length');
	}

	// CSP — allow inline styles for Svelte, self for scripts, Google Fonts for fonts
	if (!isCdn) {
		response.headers.set(
			'Content-Security-Policy',
			[
				"default-src 'self'",
				"script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
				"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
				"font-src 'self' https://fonts.gstatic.com",
				"img-src 'self' data: https:",
				"connect-src 'self' https://lunaris.win https://cdn.lunaris.win",
				"frame-ancestors 'none'"
			].join('; ')
		);
	}

	return response;
};
