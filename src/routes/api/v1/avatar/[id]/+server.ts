import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async (event) => {
	const userId = event.params.id;

	// Try common extensions
	const extensions = ['png', 'jpg', 'gif', 'webp'];
	for (const ext of extensions) {
		const obj = await event.platform!.env.R2.get(`avatars/${userId}.${ext}`);
		if (obj) {
			const headers = new Headers();
			headers.set('Content-Type', obj.httpMetadata?.contentType || `image/${ext === 'jpg' ? 'jpeg' : ext}`);
			headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
			headers.set('ETag', obj.httpEtag);
			return new Response(obj.body as ReadableStream, { headers });
		}
	}

	return new Response('Not found', { status: 404 });
};
