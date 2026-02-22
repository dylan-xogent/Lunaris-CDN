import { eq } from 'drizzle-orm';
import { getAuthenticatedUser, jsonError, jsonSuccess } from '$lib/server/middleware.js';
import { createDb } from '$lib/server/db/index.js';
import { user } from '$lib/server/db/schema.js';
import type { RequestHandler } from './$types.js';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

function extFromMime(mime: string): string {
	switch (mime) {
		case 'image/png':
			return 'png';
		case 'image/jpeg':
			return 'jpg';
		case 'image/gif':
			return 'gif';
		case 'image/webp':
			return 'webp';
		default:
			return 'png';
	}
}

export const POST: RequestHandler = async (event) => {
	const authUser = await getAuthenticatedUser(event.request, event.platform!);
	if (!authUser) return jsonError('Unauthorized', 401);

	const formData = await event.request.formData();
	const file = formData.get('avatar');

	if (!file || !(file instanceof File)) {
		return jsonError('No avatar file provided', 400);
	}

	if (!ALLOWED_TYPES.includes(file.type)) {
		return jsonError('Invalid file type. Allowed: PNG, JPEG, GIF, WebP', 400);
	}

	if (file.size > MAX_SIZE) {
		return jsonError('File too large. Maximum size is 5MB', 400);
	}

	const ext = extFromMime(file.type);
	const r2Key = `avatars/${authUser.id}.${ext}`;

	// Delete old avatar if it exists (might have different extension)
	const existing = await event.platform!.env.R2.list({ prefix: `avatars/${authUser.id}.` });
	for (const obj of existing.objects) {
		if (obj.key !== r2Key) {
			await event.platform!.env.R2.delete(obj.key);
		}
	}

	// Upload to R2
	const arrayBuffer = await file.arrayBuffer();
	await event.platform!.env.R2.put(r2Key, arrayBuffer, {
		httpMetadata: { contentType: file.type }
	});

	// Update user.image in DB
	const imageUrl = `/api/v1/avatar/${authUser.id}`;
	const db = createDb(event.platform!.env.DB);
	await db.update(user).set({ image: imageUrl, updatedAt: new Date() }).where(eq(user.id, authUser.id));

	return jsonSuccess({ success: true, imageUrl });
};

export const DELETE: RequestHandler = async (event) => {
	const authUser = await getAuthenticatedUser(event.request, event.platform!);
	if (!authUser) return jsonError('Unauthorized', 401);

	// Delete all avatar files for this user from R2
	const existing = await event.platform!.env.R2.list({ prefix: `avatars/${authUser.id}.` });
	for (const obj of existing.objects) {
		await event.platform!.env.R2.delete(obj.key);
	}

	// Clear user.image in DB
	const db = createDb(event.platform!.env.DB);
	await db.update(user).set({ image: null, updatedAt: new Date() }).where(eq(user.id, authUser.id));

	return jsonSuccess({ success: true });
};
