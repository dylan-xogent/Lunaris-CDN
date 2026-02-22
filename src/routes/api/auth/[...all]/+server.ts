import { createAuth } from '$lib/server/auth.js';
import type { RequestHandler } from './$types.js';

const handleAuthRequest: RequestHandler = async ({ request, platform, getClientAddress }) => {
	if (!platform) {
		return new Response('Platform not available', { status: 500 });
	}

	const clientIp = getClientAddress();
	const auth = createAuth(platform.env.DB, platform.env, clientIp);
	return auth.handler(request);
};

export const GET = handleAuthRequest;
export const POST = handleAuthRequest;
