import type { RequestHandler } from './$types.js';
import { verifyUnsubscribeToken } from '$lib/server/unsubscribe.js';

// ─── Shared HTML page renderer ──────────────────────────────────────────────

function htmlPage(title: string, heading: string, body: string, isError = false): Response {
	const accentColor = isError ? '#dc2626' : '#6d28d9';
	const html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>${title} &mdash; Lunaris CDN</title>
	<style>
		*, *::before, *::after { box-sizing: border-box; }
		body {
			margin: 0;
			padding: 0;
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
			background: #f9fafb;
			font-family: sans-serif;
			color: #111827;
		}
		.card {
			max-width: 440px;
			width: 100%;
			margin: 24px;
			background: #fff;
			border-radius: 10px;
			box-shadow: 0 1px 4px rgba(0,0,0,0.08);
			overflow: hidden;
		}
		.card-header {
			background: ${accentColor};
			padding: 24px 28px;
		}
		.card-header span {
			color: #fff;
			font-size: 18px;
			font-weight: 700;
			letter-spacing: -0.2px;
		}
		.card-body {
			padding: 28px;
		}
		h1 {
			margin: 0 0 12px;
			font-size: 20px;
			font-weight: 700;
		}
		p {
			margin: 0 0 16px;
			color: #374151;
			line-height: 1.6;
			font-size: 15px;
		}
		p:last-child { margin-bottom: 0; }
		a { color: ${accentColor}; }
		.footer {
			margin-top: 24px;
			padding-top: 16px;
			border-top: 1px solid #e5e7eb;
			font-size: 13px;
			color: #9ca3af;
		}
	</style>
</head>
<body>
	<div class="card">
		<div class="card-header"><span>Lunaris CDN</span></div>
		<div class="card-body">
			<h1>${heading}</h1>
			${body}
			<div class="footer">
				<a href="https://lunaris.win">Return to Lunaris CDN</a>
			</div>
		</div>
	</div>
</body>
</html>`;

	return new Response(html, {
		status: isError ? 400 : 200,
		headers: { 'Content-Type': 'text/html; charset=utf-8' }
	});
}

// ─── GET handler ────────────────────────────────────────────────────────────

export const GET: RequestHandler = async ({ url, platform }) => {
	if (!platform) {
		return htmlPage(
			'Error',
			'Something went wrong',
			'<p>Platform unavailable. Please try again later.</p>',
			true
		);
	}

	const token = url.searchParams.get('token');
	if (!token) {
		return htmlPage(
			'Invalid Link',
			'Invalid unsubscribe link',
			'<p>This unsubscribe link is missing a token. Please use the link from your email.</p>',
			true
		);
	}

	const result = await verifyUnsubscribeToken(token, platform.env.BETTER_AUTH_SECRET);

	if (!result.valid) {
		return htmlPage(
			'Invalid Link',
			'Invalid or expired link',
			'<p>This unsubscribe link is invalid or has expired. Please use the link from your original email.</p>',
			true
		);
	}

	// Persist the preference in KV (key: `email-unsub:{userId}:{type}` = '1')
	// KV is optional — if unavailable we still show the confirmation page.
	try {
		const kv = (platform.env as unknown as Record<string, KVNamespace | undefined>)['KV'] ?? null;
		if (kv) {
			await kv.put(`email-unsub:${result.userId}:${result.type}`, '1');
		}
	} catch {
		// Non-fatal
	}

	const typeLabel = result.type === 'quota' ? 'storage quota alerts' : 'marketing emails';
	const body = `
		<p>You have successfully unsubscribed from <strong>${typeLabel}</strong> for your Lunaris CDN account.</p>
		<p>You may still receive transactional emails such as email verification, password resets, and account security notices.</p>
		<p>If you unsubscribed by mistake, you can re-enable notifications from your <a href="https://lunaris.win/dashboard/settings">account settings</a>.</p>`;

	return htmlPage('Unsubscribed', "You've been unsubscribed", body);
};
