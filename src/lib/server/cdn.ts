import { eq, and, sql } from 'drizzle-orm';
import { createDb } from './db/index.js';
import { user, project, version, file, downloadLog } from './db/schema.js';

function cdnError(message: string, status: number): Response {
	return new Response(message, {
		status,
		headers: { 'Cache-Control': 'no-store' }
	});
}

function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getFileCategory(mimeType: string | null, fileName: string): string {
	if (!mimeType) return 'file';
	if (mimeType.startsWith('image/')) return 'image';
	if (mimeType.includes('executable') || mimeType.includes('msdownload') || fileName.endsWith('.exe') || fileName.endsWith('.msi') || fileName.endsWith('.dmg') || fileName.endsWith('.appimage')) return 'installer';
	if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gzip') || mimeType.includes('7z') || mimeType.includes('rar') || mimeType.includes('bzip2') || mimeType.includes('xz')) return 'archive';
	if (mimeType.includes('pdf')) return 'document';
	if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('xml') || mimeType.includes('yaml') || mimeType.includes('javascript') || mimeType.includes('typescript')) return 'code';
	return 'file';
}

function getFileIcon(category: string): string {
	switch (category) {
		case 'installer':
			return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />';
		case 'archive':
			return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />';
		case 'image':
			return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />';
		case 'document':
			return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />';
		case 'code':
			return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />';
		default:
			return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />';
	}
}

function buildDownloadPage(opts: {
	fileName: string;
	filePath: string;
	sizeBytes: number;
	sha256: string;
	mimeType: string | null;
	downloadCount: number;
	versionTag: string;
	projectName: string;
	projectSlug: string;
	username: string;
	downloadUrl: string;
}): string {
	const category = getFileCategory(opts.mimeType, opts.fileName);
	const icon = getFileIcon(category);
	const ext = opts.fileName.split('.').pop()?.toUpperCase() || 'FILE';
	const isImage = category === 'image';

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escHtml(opts.fileName)} - ${escHtml(opts.projectName)} - Lunaris CDN</title>
<meta name="description" content="Download ${escHtml(opts.fileName)} (${formatBytes(opts.sizeBytes)}) from ${escHtml(opts.projectName)} on Lunaris CDN." />
<meta property="og:title" content="${escHtml(opts.fileName)} - Lunaris CDN" />
<meta property="og:description" content="${formatBytes(opts.sizeBytes)} · ${escHtml(opts.versionTag)} · ${escHtml(opts.projectName)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Lunaris CDN" />
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#09090b;color:#fafafa;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.5rem;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
.page{width:100%;max-width:520px;display:flex;flex-direction:column;align-items:center;gap:2rem}
.brand{display:flex;align-items:center;gap:0.625rem;font-size:0.9375rem;font-weight:500;color:#a1a1aa;letter-spacing:0.025em}
.brand img{width:28px;height:28px;border-radius:6px}
.card{width:100%;background:linear-gradient(145deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01));border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:2.5rem 2rem;text-align:center;position:relative;overflow:hidden}
.card::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:60%;height:1px;background:linear-gradient(90deg,transparent,rgba(139,92,246,0.3),transparent)}
.icon-wrap{width:72px;height:72px;margin:0 auto 1.25rem;border-radius:16px;background:linear-gradient(135deg,rgba(147,51,234,0.15),rgba(147,51,234,0.05));border:1px solid rgba(147,51,234,0.2);display:flex;align-items:center;justify-content:center}
.icon-wrap svg{width:32px;height:32px;color:#a855f7}
.preview-wrap{margin:0 auto 1.25rem;border-radius:12px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;background:rgba(0,0,0,0.3);max-width:100%;position:relative}
.preview-wrap img{display:block;max-width:100%;max-height:240px;object-fit:contain;margin:0 auto}
.preview-wrap .preview-loading{display:flex;align-items:center;justify-content:center;height:120px;color:#52525b;font-size:0.75rem}
.preview-wrap.loaded .preview-loading{display:none}
.preview-wrap .preview-img{opacity:0;transition:opacity 0.3s ease}
.preview-wrap.loaded .preview-img{opacity:1}
.ext-badge{display:inline-block;margin-bottom:0.75rem;padding:0.125rem 0.5rem;border-radius:6px;font-size:0.625rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;background:rgba(147,51,234,0.12);color:#c084fc;border:1px solid rgba(147,51,234,0.2)}
.file-name{font-size:1.25rem;font-weight:600;word-break:break-all;line-height:1.4}
.attribution{margin-top:0.5rem;font-size:0.8125rem;color:#52525b}
.attribution a{color:#71717a;transition:color 0.15s}
.attribution a:hover{color:#a1a1aa}
.meta{margin-top:0.75rem;display:flex;flex-wrap:wrap;justify-content:center;gap:0.375rem 1rem;font-size:0.8125rem;color:#71717a}
.meta span{display:flex;align-items:center;gap:0.25rem}
.dl-btn{display:inline-flex;align-items:center;gap:0.625rem;margin-top:1.75rem;padding:0.875rem 2.5rem;border-radius:12px;font-size:0.9375rem;font-weight:600;color:#fff;background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 25%,#8b5cf6 50%,#22d3ee 75%,#8b5cf6 100%);background-size:300% 300%;animation:btn-gradient 6s ease infinite;border:none;cursor:pointer;transition:box-shadow 0.3s ease,transform 0.15s ease;box-shadow:0 0 20px rgba(139,92,246,0.25),0 4px 12px rgba(0,0,0,0.3);text-decoration:none}
.dl-btn:hover{transform:translateY(-1px);box-shadow:0 0 30px -5px rgba(139,92,246,0.5),0 0 60px -10px rgba(34,211,238,0.2),0 6px 16px rgba(0,0,0,0.4)}
.dl-btn:active{transform:scale(0.98)}
.dl-btn svg{width:18px;height:18px}
@keyframes btn-gradient{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
.url-section{margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid rgba(255,255,255,0.06)}
.url-label{font-size:0.6875rem;text-transform:uppercase;letter-spacing:0.08em;color:#52525b;margin-bottom:0.5rem}
.url-box{display:flex;align-items:center;gap:0;border:1px solid rgba(255,255,255,0.08);border-radius:8px;overflow:hidden;background:rgba(0,0,0,0.3)}
.url-text{flex:1;padding:0.5rem 0.75rem;font-family:'SF Mono',SFMono-Regular,ui-monospace,monospace;font-size:0.6875rem;color:#a1a1aa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left}
.url-copy{flex-shrink:0;background:rgba(255,255,255,0.04);border:none;border-left:1px solid rgba(255,255,255,0.08);color:#71717a;cursor:pointer;padding:0.5rem 0.75rem;font-size:0.6875rem;transition:all 0.15s;display:flex;align-items:center;gap:0.375rem}
.url-copy:hover{color:#a1a1aa;background:rgba(255,255,255,0.06)}
.url-copy.copied{color:#22c55e}
.url-copy svg{width:14px;height:14px}
.hash-section{margin-top:1rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.06)}
.hash-label{font-size:0.6875rem;text-transform:uppercase;letter-spacing:0.08em;color:#52525b;margin-bottom:0.375rem}
.hash-row{display:flex;align-items:center;gap:0.5rem;justify-content:center}
.hash-value{font-family:'SF Mono',SFMono-Regular,ui-monospace,monospace;font-size:0.6875rem;color:#71717a;word-break:break-all;line-height:1.5}
.copy-btn{flex-shrink:0;background:none;border:1px solid rgba(255,255,255,0.08);border-radius:6px;color:#71717a;cursor:pointer;padding:0.25rem 0.5rem;font-size:0.6875rem;transition:all 0.15s}
.copy-btn:hover{color:#a1a1aa;border-color:rgba(255,255,255,0.15);background:rgba(255,255,255,0.03)}
.copy-btn.copied{color:#22c55e;border-color:rgba(34,197,94,0.3)}
.links{display:flex;flex-direction:column;align-items:center;gap:0.5rem}
.project-link{font-size:0.8125rem;color:#71717a;transition:color 0.15s}
.project-link:hover{color:#a1a1aa}
.footer{font-size:0.75rem;color:#3f3f46;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:0.375rem}
.footer a{color:#52525b;transition:color 0.15s}
.footer a:hover{color:#71717a}
.footer .sep{color:#27272a}
</style>
</head>
<body>
<div class="page">
	<a href="https://lunaris.win" class="brand">
		<img src="https://lunaris.win/logo.png" alt="Lunaris" />
		Lunaris CDN
	</a>

	<div class="card">
		${isImage ? `<div class="preview-wrap" id="preview-wrap">
			<div class="preview-loading">Loading preview...</div>
			<img class="preview-img" src="${escHtml(opts.downloadUrl)}" alt="${escHtml(opts.fileName)}" onload="document.getElementById('preview-wrap').classList.add('loaded')" onerror="this.parentElement.style.display='none';document.getElementById('icon-fallback').style.display='flex'" />
		</div>
		<div class="icon-wrap" id="icon-fallback" style="display:none">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">${icon}</svg>
		</div>` : `<div class="icon-wrap">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">${icon}</svg>
		</div>`}
		<div class="ext-badge">${escHtml(ext)}</div>
		<div class="file-name">${escHtml(opts.fileName)}</div>
		<div class="attribution">from <a href="https://lunaris.win/${escHtml(opts.username)}/${escHtml(opts.projectSlug)}">${escHtml(opts.projectName)}</a> by <a href="https://lunaris.win/${escHtml(opts.username)}">@${escHtml(opts.username)}</a></div>
		<div class="meta">
			<span>${formatBytes(opts.sizeBytes)}</span>
			<span>${escHtml(opts.versionTag)}</span>
			<span>${opts.downloadCount.toLocaleString()} download${opts.downloadCount !== 1 ? 's' : ''}</span>
		</div>

		<a href="${escHtml(opts.downloadUrl)}" class="dl-btn">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
			Download
		</a>

		<div class="url-section">
			<div class="url-label">Direct Link</div>
			<div class="url-box">
				<span class="url-text" id="cdn-url">https://cdn.lunaris.win/${escHtml(opts.username)}/${escHtml(opts.projectSlug)}/${escHtml(opts.filePath)}${opts.versionTag ? `?v=${escHtml(opts.versionTag)}` : ''}</span>
				<button class="url-copy" id="url-copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('cdn-url').textContent).then(()=>{var b=document.getElementById('url-copy-btn');b.innerHTML='<svg viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot;><path stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; d=&quot;M5 13l4 4L19 7&quot;/></svg> Copied!';b.classList.add('copied');setTimeout(()=>{b.innerHTML='<svg viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;currentColor&quot; stroke-width=&quot;2&quot;><path stroke-linecap=&quot;round&quot; stroke-linejoin=&quot;round&quot; d=&quot;M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z&quot;/></svg> Copy';b.classList.remove('copied')},2000)})">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
					Copy
				</button>
			</div>
		</div>

		<div class="hash-section">
			<div class="hash-label">SHA-256 Checksum</div>
			<div class="hash-row">
				<span class="hash-value" id="hash">${escHtml(opts.sha256)}</span>
				<button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('hash').textContent).then(()=>{this.textContent='Copied!';this.classList.add('copied');setTimeout(()=>{this.textContent='Copy';this.classList.remove('copied')},2000)})">Copy</button>
			</div>
		</div>
	</div>

	<div class="links">
		<a href="https://lunaris.win/${escHtml(opts.username)}/${escHtml(opts.projectSlug)}" class="project-link">
			View all files in ${escHtml(opts.projectName)} &rarr;
		</a>
	</div>

	<div class="footer">
		Powered by <a href="https://lunaris.win">Lunaris CDN</a> <span class="sep">&middot;</span> Free, open file hosting <span class="sep">&middot;</span> Hosted on <a href="https://cloudflare.com">Cloudflare</a>
	</div>
</div>
</body>
</html>`;
}

function escHtml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function handleCdnRequest(
	url: URL,
	platform: App.Platform,
	request: Request,
	getClientAddress: () => string
): Promise<Response> {
	// Parse path: /{username}/{projectSlug}/{...filePath}
	const parts = url.pathname.split('/').filter(Boolean);
	if (parts.length < 3) {
		return cdnError('Invalid CDN URL. Expected: /{username}/{project}/{filePath}', 400);
	}

	const [username, projectSlug, ...filePathParts] = parts;
	const filePath = decodeURIComponent(filePathParts.join('/'));

	const db = createDb(platform.env.DB);

	// Resolve user
	const profileUser = await db.query.user.findFirst({
		where: eq(user.username, username)
	});

	if (!profileUser) {
		return cdnError('User not found', 404);
	}

	// Resolve project
	const proj = await db.query.project.findFirst({
		where: and(
			eq(project.userId, profileUser.id),
			eq(project.slug, projectSlug),
			eq(project.isPublic, true)
		)
	});

	if (!proj) {
		return cdnError('Project not found', 404);
	}

	// Resolve version
	const versionTag = url.searchParams.get('v');
	let ver;

	if (versionTag) {
		ver = await db.query.version.findFirst({
			where: and(eq(version.projectId, proj.id), eq(version.tag, versionTag))
		});

		if (!ver) {
			return cdnError(`Version "${versionTag}" not found`, 404);
		}
	} else {
		ver = await db.query.version.findFirst({
			where: and(eq(version.projectId, proj.id), eq(version.isLatest, true))
		});

		if (!ver) {
			ver = await db.query.version.findFirst({
				where: eq(version.projectId, proj.id),
				orderBy: (v, { desc }) => [desc(v.createdAt)]
			});
		}

		if (!ver) {
			return cdnError('No versions available', 404);
		}
	}

	// Resolve file
	const fileRecord = await db.query.file.findFirst({
		where: and(eq(file.versionId, ver.id), eq(file.filePath, filePath))
	});

	if (!fileRecord) {
		return cdnError(`File "${filePath}" not found in version ${ver.tag}`, 404);
	}

	// Determine if this is a browser request wanting the download page
	const acceptHeader = request.headers.get('accept') || '';
	const wantsDirect = url.searchParams.has('download');
	const wantsHtml = acceptHeader.includes('text/html') && !wantsDirect;

	if (wantsHtml) {
		// Build the direct download URL
		let downloadUrl = `${url.origin}${url.pathname}?download`;
		if (versionTag) downloadUrl += `&v=${encodeURIComponent(versionTag)}`;

		const html = buildDownloadPage({
			fileName: fileRecord.fileName,
			filePath: fileRecord.filePath,
			sizeBytes: fileRecord.sizeBytes,
			sha256: fileRecord.sha256,
			mimeType: fileRecord.mimeType,
			downloadCount: fileRecord.downloadCount,
			versionTag: ver.tag,
			projectName: proj.name,
			projectSlug: proj.slug,
			username,
			downloadUrl
		});

		return new Response(html, {
			headers: {
				'Content-Type': 'text/html; charset=utf-8',
				'Cache-Control': 'no-cache',
				'Vary': 'Accept'
			}
		});
	}

	// Direct file download — verify R2 object exists
	const r2Object = await platform.env.R2.get(fileRecord.r2Key);

	if (!r2Object) {
		return cdnError('File not found in storage', 404);
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
				await db
					.update(file)
					.set({ downloadCount: sql`${file.downloadCount} + 1` })
					.where(eq(file.id, fileRecord.id));

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
			} catch {
				// Don't fail the download if tracking fails
			}
		})()
	);

	// Build response
	const headers = new Headers();
	headers.set('Content-Type', fileRecord.mimeType || 'application/octet-stream');
	headers.set('Content-Length', String(fileRecord.sizeBytes));
	headers.set('Content-Disposition', `attachment; filename="${fileRecord.fileName}"`);
	headers.set('Cache-Control', cacheControl);
	headers.set('ETag', `"${fileRecord.sha256}"`);
	headers.set('X-Checksum-SHA256', fileRecord.sha256);
	headers.set('Vary', 'Accept');

	return new Response(r2Object.body, { headers });
}
