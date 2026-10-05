import { eq, and, sql } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { user, project, version, file, downloadLog } from '$lib/server/db/schema.js';
import { dispatchWebhook } from '$lib/server/webhooks.js';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ params, url, platform, request, getClientAddress }) => {
	if (!platform) {
		return new Response('Service unavailable', { status: 503 });
	}

	const db = createDb(platform.env.DB);

	// Resolve user
	const profileUser = await db.query.user.findFirst({
		where: eq(user.username, params.username)
	});

	if (!profileUser) {
		return new Response('User not found', { status: 404 });
	}

	// Resolve project
	const proj = await db.query.project.findFirst({
		where: and(
			eq(project.userId, profileUser.id),
			eq(project.slug, params.projectSlug),
			eq(project.isPublic, true)
		)
	});

	if (!proj) {
		return new Response('Project not found', { status: 404 });
	}

	// Resolve version
	const versionTag = url.searchParams.get('v');
	let ver;

	if (versionTag) {
		ver = await db.query.version.findFirst({
			where: and(eq(version.projectId, proj.id), eq(version.tag, versionTag))
		});

		if (!ver) {
			return new Response(`Version "${versionTag}" not found`, { status: 404 });
		}
	} else {
		// Use latest version
		ver = await db.query.version.findFirst({
			where: and(eq(version.projectId, proj.id), eq(version.isLatest, true))
		});

		if (!ver) {
			// Fallback to most recent
			ver = await db.query.version.findFirst({
				where: eq(version.projectId, proj.id),
				orderBy: (v, { desc }) => [desc(v.createdAt)]
			});
		}

		if (!ver) {
			return new Response('No versions available', { status: 404 });
		}
	}

	// Resolve file
	const filePath = params.filePath;
	const fileRecord = await db.query.file.findFirst({
		where: and(eq(file.versionId, ver.id), eq(file.filePath, filePath))
	});

	if (!fileRecord) {
		return new Response(`File "${filePath}" not found in version ${ver.tag}`, { status: 404 });
	}

	// Fetch from R2
	const r2Object = await platform.env.R2.get(fileRecord.r2Key);

	if (!r2Object) {
		return new Response('File not found in storage', { status: 404 });
	}

	// Cache headers
	const isVersioned = !!versionTag;
	const cacheControl = isVersioned
		? 'public, max-age=31536000, immutable'
		: 'public, max-age=300';

	// Track download asynchronously
	platform.context.waitUntil(
		(async () => {
			try {
				// Increment counter
				await db
					.update(file)
					.set({ downloadCount: sql`${file.downloadCount} + 1` })
					.where(eq(file.id, fileRecord.id));

				// Log download
				let ipHash: string | null = null;
				try {
					const ip = getClientAddress();
					const encoder = new TextEncoder();
					const data = encoder.encode(ip + ':lunaris-salt');
					const hashBuffer = await crypto.subtle.digest('SHA-256', data);
					ipHash = Array.from(new Uint8Array(hashBuffer).slice(0, 8))
						.map((b) => b.toString(16).padStart(2, '0'))
						.join('');
				} catch {
					// Client address may not be available
				}

				await db.insert(downloadLog).values({
					fileId: fileRecord.id,
					ipHash,
					userAgent: request.headers.get('user-agent'),
					referer: request.headers.get('referer'),
					createdAt: new Date()
				});

				// Dispatch file.downloaded webhook event for the file owner
				await dispatchWebhook(
					db,
					profileUser.id,
					'file.downloaded',
					{
						fileId: fileRecord.id,
						fileName: fileRecord.fileName,
						filePath: fileRecord.filePath,
						projectId: proj.id,
						projectSlug: proj.slug,
						versionTag: ver.tag,
						sizeBytes: fileRecord.sizeBytes
					}
				);
			} catch {
				// Don't fail the download if tracking fails
			}
		})()
	);

	// Build response
	const headers = new Headers();
	headers.set('Content-Type', fileRecord.mimeType || 'application/octet-stream');
	headers.set('Content-Length', String(fileRecord.sizeBytes));
	const safeName = fileRecord.fileName.replace(/[^\w.\- ]+/g, '_');
	headers.set(
		'Content-Disposition',
		`attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(fileRecord.fileName)}`
	);
	headers.set('X-Content-Type-Options', 'nosniff');
	headers.set('Cache-Control', cacheControl);
	headers.set('ETag', `"${fileRecord.sha256}"`);
	headers.set('X-Checksum-SHA256', fileRecord.sha256);
	headers.set('Access-Control-Allow-Origin', '*');
	headers.set('Access-Control-Expose-Headers', 'X-Checksum-SHA256');

	return new Response(r2Object.body, { headers });
};
