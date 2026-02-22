<script lang="ts">
	let activeTab = $state('projects');
	let copiedId = $state<string | null>(null);

	const tabs = [
		{ id: 'authentication', label: 'Authentication' },
		{ id: 'cdn', label: 'CDN URLs' },
		{ id: 'projects', label: 'Projects' },
		{ id: 'versions', label: 'Versions' },
		{ id: 'upload', label: 'Upload' },
		{ id: 'user', label: 'User' },
		{ id: 'quota', label: 'Quota' },
		{ id: 'admin', label: 'Admin' },
	];

	function copyCode(id: string, text: string) {
		navigator.clipboard.writeText(text).then(() => {
			copiedId = id;
			setTimeout(() => { copiedId = null; }, 2000);
		});
	}

	const methodColors: Record<string, string> = {
		GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
		POST: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
		PATCH: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
		DELETE: 'bg-red-500/15 text-red-400 border-red-500/20',
		PUT: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
	};
</script>

<svelte:head>
	<title>API Documentation - Lunaris CDN</title>
	<meta name="description" content="Full API reference for Lunaris CDN. Learn how to manage projects, upload files, and access CDN URLs programmatically." />
</svelte:head>

<!-- Background -->
<div class="pointer-events-none fixed inset-0 -z-10">
	<div class="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/6 blur-[120px]"></div>
	<div class="absolute top-1/3 -right-32 h-[300px] w-[300px] rounded-full bg-cyan/4 blur-[100px]"></div>
</div>

<div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">

	<!-- Hero -->
	<div class="mb-12 text-center">
		<div class="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-1.5 text-sm text-muted-foreground">
			<svg class="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
			</svg>
			REST API v1
		</div>
		<h1 class="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">API Documentation</h1>
		<p class="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
			Everything you need to automate uploads, manage projects, and integrate Lunaris CDN into your workflow.
		</p>
		<div class="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 font-mono text-sm text-muted-foreground">
			Base URL:
			<span class="text-foreground">https://lunaris.win/api/v1</span>
		</div>
	</div>

	<div class="flex flex-col gap-8 lg:flex-row lg:gap-10">

		<!-- Sidebar navigation -->
		<aside class="shrink-0 lg:w-52">
			<nav class="sticky top-6 space-y-1">
				{#each tabs as tab}
					<button
						onclick={() => activeTab = tab.id}
						class="w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-all {activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground'}"
					>
						{tab.label}
					</button>
				{/each}
			</nav>
		</aside>

		<!-- Main content -->
		<main class="min-w-0 flex-1 space-y-6">

			<!-- ══════════════════════════════════════════ -->
			<!-- AUTHENTICATION                             -->
			<!-- ══════════════════════════════════════════ -->
			{#if activeTab === 'authentication'}
			<div class="space-y-6">
				<div>
					<h2 class="text-2xl font-bold tracking-tight">Authentication</h2>
					<p class="mt-2 text-muted-foreground">All API endpoints require authentication. Lunaris CDN supports two methods.</p>
				</div>

				<!-- API Key Auth -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
					<div class="flex items-start gap-3">
						<div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
							<svg class="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
							</svg>
						</div>
						<div class="flex-1 min-w-0">
							<h3 class="font-semibold">API Key (Bearer Token)</h3>
							<p class="mt-1 text-sm text-muted-foreground">Recommended for CI/CD pipelines and programmatic access. Generate API keys from your dashboard.</p>
							<div class="mt-3 rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Header</p>
								<pre class="font-mono text-sm text-foreground/90">Authorization: Bearer YOUR_API_KEY</pre>
							</div>
							<a href="/dashboard/api-keys" class="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors">
								Manage API keys
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
								</svg>
							</a>
						</div>
					</div>
				</div>

				<!-- Session Auth -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
					<div class="flex items-start gap-3">
						<div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan/20 bg-cyan/10">
							<svg class="h-4 w-4 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
							</svg>
						</div>
						<div>
							<h3 class="font-semibold">Session Cookie</h3>
							<p class="mt-1 text-sm text-muted-foreground">Automatically used when making requests from the browser while logged in. No additional headers needed — the session cookie is sent automatically.</p>
						</div>
					</div>
				</div>

				<!-- Error format -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
					<h3 class="font-semibold">Error Responses</h3>
					<p class="mt-1 text-sm text-muted-foreground">All errors return JSON with an <code class="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-xs">error</code> field and an appropriate HTTP status code.</p>
					<div class="mt-3 rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
						<pre class="font-mono text-sm text-foreground/90">{`{ "error": "Unauthorized" }          // 401
{ "error": "Project not found" }     // 404
{ "error": "Validation message" }    // 400`}</pre>
					</div>
				</div>

				<!-- Quick example -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
					<h3 class="font-semibold">Quick Example</h3>
					<p class="mt-1 mb-3 text-sm text-muted-foreground">List all your projects using an API key:</p>
					<div class="relative rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
						<button
							onclick={() => copyCode('auth-example', `curl https://lunaris.win/api/v1/projects \\\n  -H "Authorization: Bearer YOUR_API_KEY"`)}
							class="absolute right-3 top-3 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-xs text-muted-foreground transition-all hover:bg-white/[0.06] hover:text-foreground {copiedId === 'auth-example' ? 'text-emerald-400' : ''}"
						>
							{copiedId === 'auth-example' ? 'Copied!' : 'Copy'}
						</button>
						<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`curl https://lunaris.win/api/v1/projects \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</pre>
					</div>
				</div>
			</div>
			{/if}

			<!-- ══════════════════════════════════════════ -->
			<!-- CDN URLs                                   -->
			<!-- ══════════════════════════════════════════ -->
			{#if activeTab === 'cdn'}
			<div class="space-y-6">
				<div>
					<h2 class="text-2xl font-bold tracking-tight">CDN URL Patterns</h2>
					<p class="mt-2 text-muted-foreground">Files are served from <code class="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-xs">cdn.lunaris.win</code>. Only files in <strong>public</strong> projects are accessible.</p>
				</div>

				<!-- URL patterns -->
				<div class="space-y-4">
					<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
						<h3 class="font-semibold">Specific Version</h3>
						<p class="mt-1 text-sm text-muted-foreground">Access a file at a pinned version tag. Responses are cached with immutable headers (<code class="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-xs">max-age=31536000, immutable</code>).</p>
						<div class="mt-3 rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
							<pre class="font-mono text-sm text-foreground/90"><span class="text-muted-foreground">GET</span> https://cdn.lunaris.win/<span class="text-primary">{'{username}'}</span>/<span class="text-cyan">{'{project}'}</span>/<span class="text-foreground">{'{filepath}'}</span><span class="text-amber-400">?v={'{version}'}</span></pre>
						</div>
						<div class="mt-3 rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
							<p class="mb-1 text-xs text-muted-foreground/60">Example</p>
							<pre class="font-mono text-sm text-foreground/90">https://cdn.lunaris.win/acme/my-app/installer.exe?v=2.1.0</pre>
						</div>
					</div>

					<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
						<h3 class="font-semibold">Latest Version</h3>
						<p class="mt-1 text-sm text-muted-foreground">Omit the <code class="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-xs">?v=</code> parameter to resolve the version marked as latest. Cached for 5 minutes (<code class="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-xs">max-age=300</code>).</p>
						<div class="mt-3 rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
							<pre class="font-mono text-sm text-foreground/90"><span class="text-muted-foreground">GET</span> https://cdn.lunaris.win/<span class="text-primary">{'{username}'}</span>/<span class="text-cyan">{'{project}'}</span>/<span class="text-foreground">{'{filepath}'}</span></pre>
						</div>
						<div class="mt-3 rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
							<p class="mb-1 text-xs text-muted-foreground/60">Example</p>
							<pre class="font-mono text-sm text-foreground/90">https://cdn.lunaris.win/acme/my-app/installer.exe</pre>
						</div>
					</div>

					<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
						<h3 class="font-semibold">Force Direct Download</h3>
						<p class="mt-1 text-sm text-muted-foreground">By default, browser requests (with <code class="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-xs">Accept: text/html</code>) receive a styled download page. Add <code class="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-xs">?download</code> to always stream the raw file bytes.</p>
						<div class="mt-3 rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
							<pre class="font-mono text-sm text-foreground/90">https://cdn.lunaris.win/acme/my-app/installer.exe<span class="text-amber-400">?download</span>
https://cdn.lunaris.win/acme/my-app/installer.exe<span class="text-amber-400">?download&v=2.1.0</span></pre>
						</div>
					</div>
				</div>

				<!-- Response headers -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
					<h3 class="font-semibold">Response Headers</h3>
					<p class="mt-1 mb-3 text-sm text-muted-foreground">Every file response includes integrity and caching headers.</p>
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-muted-foreground/60">
									<th class="pb-2 pr-6 font-medium">Header</th>
									<th class="pb-2 font-medium">Value</th>
								</tr>
							</thead>
							<tbody class="font-mono">
								<tr class="border-b border-white/[0.04]">
									<td class="py-2.5 pr-6 text-cyan/80">X-Checksum-SHA256</td>
									<td class="py-2.5 text-foreground/70">SHA-256 hex digest of the file</td>
								</tr>
								<tr class="border-b border-white/[0.04]">
									<td class="py-2.5 pr-6 text-cyan/80">ETag</td>
									<td class="py-2.5 text-foreground/70">"&lt;sha256&gt;"</td>
								</tr>
								<tr class="border-b border-white/[0.04]">
									<td class="py-2.5 pr-6 text-cyan/80">Content-Disposition</td>
									<td class="py-2.5 text-foreground/70">attachment; filename="&lt;name&gt;"</td>
								</tr>
								<tr>
									<td class="py-2.5 pr-6 text-cyan/80">Cache-Control</td>
									<td class="py-2.5 text-foreground/70">immutable (versioned) / max-age=300 (latest)</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				<!-- JS example -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
					<h3 class="mb-3 font-semibold">JavaScript Example</h3>
					<div class="relative rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
						<button
							onclick={() => copyCode('cdn-js', `// Download a specific version and verify checksum
const res = await fetch(
\t'https://cdn.lunaris.win/acme/my-app/installer.exe?v=2.1.0&download'
);
const sha256 = res.headers.get('X-Checksum-SHA256');
const buffer = await res.arrayBuffer();
console.log('SHA-256:', sha256);`)}
							class="absolute right-3 top-3 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-xs text-muted-foreground transition-all hover:bg-white/[0.06] hover:text-foreground {copiedId === 'cdn-js' ? 'text-emerald-400' : ''}"
						>
							{copiedId === 'cdn-js' ? 'Copied!' : 'Copy'}
						</button>
						<pre class="overflow-x-auto font-mono text-sm text-foreground/90"><span class="text-muted-foreground/60">// Download a specific version and verify checksum</span>
<span class="text-blue-400">const</span> res = <span class="text-blue-400">await</span> <span class="text-cyan">fetch</span>(
	<span class="text-amber-400">'https://cdn.lunaris.win/acme/my-app/installer.exe?v=2.1.0&download'</span>
);
<span class="text-blue-400">const</span> sha256 = res.headers.<span class="text-cyan">get</span>(<span class="text-amber-400">'X-Checksum-SHA256'</span>);
<span class="text-blue-400">const</span> buffer = <span class="text-blue-400">await</span> res.<span class="text-cyan">arrayBuffer</span>();
console.<span class="text-cyan">log</span>(<span class="text-amber-400">'SHA-256:'</span>, sha256);</pre>
					</div>
				</div>
			</div>
			{/if}

			<!-- ══════════════════════════════════════════ -->
			<!-- PROJECTS                                   -->
			<!-- ══════════════════════════════════════════ -->
			{#if activeTab === 'projects'}
			<div class="space-y-6">
				<div>
					<h2 class="text-2xl font-bold tracking-tight">Projects</h2>
					<p class="mt-2 text-muted-foreground">Projects are containers for versioned files. Each project has a unique slug derived from its name.</p>
				</div>

				<!-- GET /projects -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['GET']}">GET</span>
						<code class="font-mono text-sm text-foreground/90">/projects</code>
						<span class="ml-auto text-sm text-muted-foreground">List all projects</span>
					</div>
					<div class="p-5 space-y-4">
						<p class="text-sm text-muted-foreground">Returns all projects owned by the authenticated user, ordered by creation date (newest first).</p>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Response 200</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`{
  "projects": [
    {
      "id": "abc123",
      "name": "My App",
      "slug": "my-app",
      "description": "Windows installer",
      "isPublic": true,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}`}</pre>
							</div>
						</div>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">cURL</p>
							<div class="relative rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<button onclick={() => copyCode('get-projects', `curl https://lunaris.win/api/v1/projects \\\n  -H "Authorization: Bearer YOUR_API_KEY"`)} class="absolute right-3 top-3 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-xs text-muted-foreground transition-all hover:bg-white/[0.06] hover:text-foreground {copiedId === 'get-projects' ? 'text-emerald-400' : ''}">{copiedId === 'get-projects' ? 'Copied!' : 'Copy'}</button>
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`curl https://lunaris.win/api/v1/projects \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</pre>
							</div>
						</div>
					</div>
				</div>

				<!-- POST /projects -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['POST']}">POST</span>
						<code class="font-mono text-sm text-foreground/90">/projects</code>
						<span class="ml-auto text-sm text-muted-foreground">Create a project</span>
					</div>
					<div class="p-5 space-y-4">
						<p class="text-sm text-muted-foreground">Creates a new project. The slug is automatically generated from the name.</p>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Request Body</p>
							<div class="overflow-x-auto">
								<table class="w-full text-sm">
									<thead>
										<tr class="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-muted-foreground/60">
											<th class="pb-2 pr-4 font-medium">Field</th>
											<th class="pb-2 pr-4 font-medium">Type</th>
											<th class="pb-2 pr-4 font-medium">Required</th>
											<th class="pb-2 font-medium">Description</th>
										</tr>
									</thead>
									<tbody class="font-mono">
										<tr class="border-b border-white/[0.04]">
											<td class="py-2.5 pr-4 text-cyan/80">name</td>
											<td class="py-2.5 pr-4 text-muted-foreground">string</td>
											<td class="py-2.5 pr-4 text-emerald-400">yes</td>
											<td class="py-2.5 font-sans text-muted-foreground">1–100 characters</td>
										</tr>
										<tr class="border-b border-white/[0.04]">
											<td class="py-2.5 pr-4 text-cyan/80">description</td>
											<td class="py-2.5 pr-4 text-muted-foreground">string</td>
											<td class="py-2.5 pr-4 text-muted-foreground">no</td>
											<td class="py-2.5 font-sans text-muted-foreground">Up to 500 characters</td>
										</tr>
										<tr>
											<td class="py-2.5 pr-4 text-cyan/80">isPublic</td>
											<td class="py-2.5 pr-4 text-muted-foreground">boolean</td>
											<td class="py-2.5 pr-4 text-muted-foreground">no</td>
											<td class="py-2.5 font-sans text-muted-foreground">Default: true</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Response 201</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`{ "project": { "id": "abc123", "slug": "my-app", ... } }`}</pre>
							</div>
						</div>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">cURL</p>
							<div class="relative rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<button onclick={() => copyCode('post-projects', `curl -X POST https://lunaris.win/api/v1/projects \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"My App","description":"Windows installer","isPublic":true}'`)} class="absolute right-3 top-3 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-xs text-muted-foreground transition-all hover:bg-white/[0.06] hover:text-foreground {copiedId === 'post-projects' ? 'text-emerald-400' : ''}">{copiedId === 'post-projects' ? 'Copied!' : 'Copy'}</button>
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`curl -X POST https://lunaris.win/api/v1/projects \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"My App","description":"Windows installer","isPublic":true}'`}</pre>
							</div>
						</div>
					</div>
				</div>

				<!-- GET /projects/[slug] -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['GET']}">GET</span>
						<code class="font-mono text-sm text-foreground/90">/projects/<span class="text-primary">{'{slug}'}</span></code>
						<span class="ml-auto text-sm text-muted-foreground">Get project + versions</span>
					</div>
					<div class="p-5 space-y-4">
						<p class="text-sm text-muted-foreground">Returns project details along with all versions.</p>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Response 200</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`{
  "project": { "id": "abc123", "slug": "my-app", ... },
  "versions": [
    { "id": "v1", "tag": "2.1.0", "isLatest": true, "createdAt": "..." }
  ]
}`}</pre>
							</div>
						</div>
					</div>
				</div>

				<!-- PATCH /projects/[slug] -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['PATCH']}">PATCH</span>
						<code class="font-mono text-sm text-foreground/90">/projects/<span class="text-primary">{'{slug}'}</span></code>
						<span class="ml-auto text-sm text-muted-foreground">Update a project</span>
					</div>
					<div class="p-5 space-y-4">
						<p class="text-sm text-muted-foreground">All fields are optional. Only provided fields are updated.</p>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Request Body (all optional)</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`{
  "name": "New Name",
  "description": "Updated description",
  "isPublic": false
}`}</pre>
							</div>
						</div>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Response 200</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`{ "project": { "id": "abc123", "slug": "new-name", ... } }`}</pre>
							</div>
						</div>
					</div>
				</div>

				<!-- DELETE /projects/[slug] -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['DELETE']}">DELETE</span>
						<code class="font-mono text-sm text-foreground/90">/projects/<span class="text-primary">{'{slug}'}</span></code>
						<span class="ml-auto text-sm text-muted-foreground">Delete a project</span>
					</div>
					<div class="p-5 space-y-4">
						<p class="text-sm text-muted-foreground">Permanently deletes the project and all its versions, files, and stored objects. Storage quota is reclaimed.</p>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Response 200</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`{ "success": true }`}</pre>
							</div>
						</div>
					</div>
				</div>

				<!-- JS example -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
					<h3 class="mb-3 font-semibold">JavaScript Example</h3>
					<div class="relative rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
						<button onclick={() => copyCode('proj-js', `const BASE = 'https://lunaris.win/api/v1';\nconst KEY  = 'YOUR_API_KEY';\n\n// Create a project\nconst { project } = await fetch(\`\${BASE}/projects\`, {\n\tmethod: 'POST',\n\theaders: {\n\t\t'Authorization': \`Bearer \${KEY}\`,\n\t\t'Content-Type': 'application/json',\n\t},\n\tbody: JSON.stringify({ name: 'My App', isPublic: true }),\n}).then(r => r.json());\n\nconsole.log(project.slug); // "my-app"`)} class="absolute right-3 top-3 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-xs text-muted-foreground transition-all hover:bg-white/[0.06] hover:text-foreground {copiedId === 'proj-js' ? 'text-emerald-400' : ''}">{copiedId === 'proj-js' ? 'Copied!' : 'Copy'}</button>
						<pre class="overflow-x-auto font-mono text-sm text-foreground/90"><span class="text-blue-400">const</span> BASE = <span class="text-amber-400">'https://lunaris.win/api/v1'</span>;
<span class="text-blue-400">const</span> KEY  = <span class="text-amber-400">'YOUR_API_KEY'</span>;

<span class="text-muted-foreground/60">// Create a project</span>
<span class="text-blue-400">const</span> {"{"} project {"}"} = <span class="text-blue-400">await</span> <span class="text-cyan">fetch</span>(<span class="text-amber-400">`${"${BASE}"}/projects`</span>, {"{"}
	method: <span class="text-amber-400">'POST'</span>,
	headers: {"{"}
		<span class="text-amber-400">'Authorization'</span>: <span class="text-amber-400">`Bearer ${"${KEY}"}`</span>,
		<span class="text-amber-400">'Content-Type'</span>: <span class="text-amber-400">'application/json'</span>,
	{"}"},
	body: JSON.<span class="text-cyan">stringify</span>({"{"} name: <span class="text-amber-400">'My App'</span>, isPublic: <span class="text-blue-400">true</span> {"}"}),
{"}"}).<span class="text-cyan">then</span>(r => r.<span class="text-cyan">json</span>());

console.<span class="text-cyan">log</span>(project.slug); <span class="text-muted-foreground/60">// "my-app"</span></pre>
					</div>
				</div>
			</div>
			{/if}

			<!-- ══════════════════════════════════════════ -->
			<!-- VERSIONS                                   -->
			<!-- ══════════════════════════════════════════ -->
			{#if activeTab === 'versions'}
			<div class="space-y-6">
				<div>
					<h2 class="text-2xl font-bold tracking-tight">Versions</h2>
					<p class="mt-2 text-muted-foreground">Every project has one or more versions identified by a tag (e.g. <code class="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-xs">2.1.0</code>). One version is marked as the "latest" and resolves when no version is specified in CDN URLs.</p>
				</div>

				<!-- GET /projects/[slug]/versions -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['GET']}">GET</span>
						<code class="font-mono text-sm text-foreground/90">/projects/<span class="text-primary">{'{slug}'}</span>/versions</code>
						<span class="ml-auto text-sm text-muted-foreground">List versions</span>
					</div>
					<div class="p-5 space-y-4">
						<p class="text-sm text-muted-foreground">Returns all versions for a project, ordered by creation date (newest first).</p>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Response 200</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`{
  "versions": [
    { "id": "v1", "tag": "2.1.0", "isLatest": true, "createdAt": "..." },
    { "id": "v0", "tag": "2.0.0", "isLatest": false, "createdAt": "..." }
  ]
}`}</pre>
							</div>
						</div>
					</div>
				</div>

				<!-- POST /projects/[slug]/versions -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['POST']}">POST</span>
						<code class="font-mono text-sm text-foreground/90">/projects/<span class="text-primary">{'{slug}'}</span>/versions</code>
						<span class="ml-auto text-sm text-muted-foreground">Create a version</span>
					</div>
					<div class="p-5 space-y-4">
						<p class="text-sm text-muted-foreground">Creates a new version. The first version created for a project is automatically set as latest. Tags must start with a letter or number and may contain letters, numbers, dots, hyphens, and underscores.</p>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Request Body</p>
							<div class="overflow-x-auto">
								<table class="w-full text-sm">
									<thead>
										<tr class="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-muted-foreground/60">
											<th class="pb-2 pr-4 font-medium">Field</th>
											<th class="pb-2 pr-4 font-medium">Type</th>
											<th class="pb-2 pr-4 font-medium">Required</th>
											<th class="pb-2 font-medium">Constraints</th>
										</tr>
									</thead>
									<tbody class="font-mono">
										<tr>
											<td class="py-2.5 pr-4 text-cyan/80">tag</td>
											<td class="py-2.5 pr-4 text-muted-foreground">string</td>
											<td class="py-2.5 pr-4 text-emerald-400">yes</td>
											<td class="py-2.5 font-sans text-muted-foreground">1–64 chars, pattern <code class="font-mono text-xs">/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/</code></td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Response 201</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`{ "version": { "id": "v1", "tag": "2.1.0", "isLatest": true, "createdAt": "..." } }`}</pre>
							</div>
						</div>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">cURL</p>
							<div class="relative rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<button onclick={() => copyCode('post-ver', `curl -X POST https://lunaris.win/api/v1/projects/my-app/versions \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"tag":"2.1.0"}'`)} class="absolute right-3 top-3 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-xs text-muted-foreground transition-all hover:bg-white/[0.06] hover:text-foreground {copiedId === 'post-ver' ? 'text-emerald-400' : ''}">{copiedId === 'post-ver' ? 'Copied!' : 'Copy'}</button>
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`curl -X POST https://lunaris.win/api/v1/projects/my-app/versions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"tag":"2.1.0"}'`}</pre>
							</div>
						</div>
					</div>
				</div>

				<!-- GET /projects/[slug]/versions/[tag] -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['GET']}">GET</span>
						<code class="font-mono text-sm text-foreground/90">/projects/<span class="text-primary">{'{slug}'}</span>/versions/<span class="text-cyan">{'{tag}'}</span></code>
						<span class="ml-auto text-sm text-muted-foreground">Get version + files</span>
					</div>
					<div class="p-5 space-y-4">
						<p class="text-sm text-muted-foreground">Returns version details and all files within it, ordered alphabetically by filename.</p>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Response 200</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`{
  "version": { "id": "v1", "tag": "2.1.0", "isLatest": true },
  "files": [
    {
      "id": "f1",
      "fileName": "installer.exe",
      "filePath": "installer.exe",
      "sizeBytes": 298262528,
      "sha256": "a1b2c3...",
      "mimeType": "application/vnd.microsoft.portable-executable",
      "downloadCount": 142,
      "createdAt": "..."
    }
  ]
}`}</pre>
							</div>
						</div>
					</div>
				</div>

				<!-- POST set-latest -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['POST']}">POST</span>
						<code class="font-mono text-sm text-foreground/90">/projects/<span class="text-primary">{'{slug}'}</span>/versions/<span class="text-cyan">{'{tag}'}</span>/set-latest</code>
						<span class="ml-auto text-sm text-muted-foreground">Promote to latest</span>
					</div>
					<div class="p-5 space-y-4">
						<p class="text-sm text-muted-foreground">Marks this version as the latest, clearing the latest flag from all other versions in the project. No request body required.</p>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Response 200</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`{ "success": true }`}</pre>
							</div>
						</div>
					</div>
				</div>

				<!-- DELETE /projects/[slug]/versions/[tag] -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['DELETE']}">DELETE</span>
						<code class="font-mono text-sm text-foreground/90">/projects/<span class="text-primary">{'{slug}'}</span>/versions/<span class="text-cyan">{'{tag}'}</span></code>
						<span class="ml-auto text-sm text-muted-foreground">Delete a version</span>
					</div>
					<div class="p-5 space-y-4">
						<p class="text-sm text-muted-foreground">Deletes the version and all its files from storage. Storage quota is reclaimed. If the deleted version was marked as latest, the most recently created remaining version is automatically promoted.</p>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Response 200</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`{ "success": true }`}</pre>
							</div>
						</div>
					</div>
				</div>
			</div>
			{/if}

			<!-- ══════════════════════════════════════════ -->
			<!-- UPLOAD                                     -->
			<!-- ══════════════════════════════════════════ -->
			{#if activeTab === 'upload'}
			<div class="space-y-6">
				<div>
					<h2 class="text-2xl font-bold tracking-tight">Upload</h2>
					<p class="mt-2 text-muted-foreground">Lunaris CDN uses a three-step multipart upload process backed by Cloudflare R2. Files up to <strong>5 GB</strong> are supported. Parts are <strong>50 MB</strong> each (minimum 5 MB for the last part).</p>
				</div>

				<!-- Flow diagram -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
					<h3 class="mb-4 font-semibold">Upload Flow</h3>
					<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
						<div class="flex flex-1 flex-col items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 text-center">
							<span class="text-xs font-semibold uppercase tracking-wider text-blue-400">Step 1</span>
							<span class="font-mono text-xs text-foreground/80">POST /upload/initiate</span>
							<span class="text-xs text-muted-foreground">Get session ID + part info</span>
						</div>
						<svg class="hidden h-4 w-4 shrink-0 text-muted-foreground/40 sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
						<div class="flex flex-1 flex-col items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/5 p-4 text-center">
							<span class="text-xs font-semibold uppercase tracking-wider text-orange-400">Step 2</span>
							<span class="font-mono text-xs text-foreground/80">PUT /upload/part</span>
							<span class="text-xs text-muted-foreground">Upload each part</span>
						</div>
						<svg class="hidden h-4 w-4 shrink-0 text-muted-foreground/40 sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
						<div class="flex flex-1 flex-col items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
							<span class="text-xs font-semibold uppercase tracking-wider text-emerald-400">Step 3</span>
							<span class="font-mono text-xs text-foreground/80">POST /upload/complete</span>
							<span class="text-xs text-muted-foreground">Finalize + create file record</span>
						</div>
					</div>
				</div>

				<!-- Step 1: Initiate -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['POST']}">POST</span>
						<code class="font-mono text-sm text-foreground/90">/upload/initiate</code>
						<span class="ml-auto text-sm text-muted-foreground">Step 1 — Initiate upload</span>
					</div>
					<div class="p-5 space-y-4">
						<p class="text-sm text-muted-foreground">Registers a multipart upload session. Validates storage quota and returns the session ID with part configuration. Sessions expire after 24 hours.</p>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Request Body</p>
							<div class="overflow-x-auto">
								<table class="w-full text-sm">
									<thead>
										<tr class="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-muted-foreground/60">
											<th class="pb-2 pr-4 font-medium">Field</th>
											<th class="pb-2 pr-4 font-medium">Type</th>
											<th class="pb-2 pr-4 font-medium">Required</th>
											<th class="pb-2 font-medium">Description</th>
										</tr>
									</thead>
									<tbody class="font-mono">
										<tr class="border-b border-white/[0.04]">
											<td class="py-2.5 pr-4 text-cyan/80">projectSlug</td>
											<td class="py-2.5 pr-4 text-muted-foreground">string</td>
											<td class="py-2.5 pr-4 text-emerald-400">yes</td>
											<td class="py-2.5 font-sans text-muted-foreground">Target project slug</td>
										</tr>
										<tr class="border-b border-white/[0.04]">
											<td class="py-2.5 pr-4 text-cyan/80">versionTag</td>
											<td class="py-2.5 pr-4 text-muted-foreground">string</td>
											<td class="py-2.5 pr-4 text-emerald-400">yes</td>
											<td class="py-2.5 font-sans text-muted-foreground">Target version tag</td>
										</tr>
										<tr class="border-b border-white/[0.04]">
											<td class="py-2.5 pr-4 text-cyan/80">fileName</td>
											<td class="py-2.5 pr-4 text-muted-foreground">string</td>
											<td class="py-2.5 pr-4 text-emerald-400">yes</td>
											<td class="py-2.5 font-sans text-muted-foreground">Original filename (1–255 chars)</td>
										</tr>
										<tr class="border-b border-white/[0.04]">
											<td class="py-2.5 pr-4 text-cyan/80">filePath</td>
											<td class="py-2.5 pr-4 text-muted-foreground">string</td>
											<td class="py-2.5 pr-4 text-muted-foreground">no</td>
											<td class="py-2.5 font-sans text-muted-foreground">Path within version (defaults to fileName)</td>
										</tr>
										<tr>
											<td class="py-2.5 pr-4 text-cyan/80">totalSize</td>
											<td class="py-2.5 pr-4 text-muted-foreground">number</td>
											<td class="py-2.5 pr-4 text-emerald-400">yes</td>
											<td class="py-2.5 font-sans text-muted-foreground">File size in bytes (max 5 GB)</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Response 201</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`{
  "uploadSessionId": "session_abc123",
  "partSize": 52428800,
  "totalParts": 6,
  "expiresAt": "2024-01-16T10:00:00.000Z"
}`}</pre>
							</div>
						</div>
					</div>
				</div>

				<!-- Step 2: Part -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['PUT']}">PUT</span>
						<code class="font-mono text-sm text-foreground/90">/upload/part</code>
						<span class="ml-auto text-sm text-muted-foreground">Step 2 — Upload part</span>
					</div>
					<div class="p-5 space-y-4">
						<p class="text-sm text-muted-foreground">Uploads a single binary part. The request body is the raw bytes of the chunk. Parts can be uploaded in any order but must not be re-uploaded.</p>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Required Headers</p>
							<div class="overflow-x-auto">
								<table class="w-full text-sm">
									<thead>
										<tr class="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-muted-foreground/60">
											<th class="pb-2 pr-4 font-medium">Header</th>
											<th class="pb-2 font-medium">Value</th>
										</tr>
									</thead>
									<tbody class="font-mono">
										<tr class="border-b border-white/[0.04]">
											<td class="py-2.5 pr-4 text-cyan/80">x-upload-session-id</td>
											<td class="py-2.5 text-muted-foreground">Session ID from initiate</td>
										</tr>
										<tr>
											<td class="py-2.5 pr-4 text-cyan/80">x-part-number</td>
											<td class="py-2.5 text-muted-foreground">Integer, starting at 1</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Response 200</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`{
  "partNumber": 1,
  "etag": "abc123def456",
  "uploadedCount": 1,
  "totalParts": 6
}`}</pre>
							</div>
						</div>
					</div>
				</div>

				<!-- Step 3: Complete -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['POST']}">POST</span>
						<code class="font-mono text-sm text-foreground/90">/upload/complete</code>
						<span class="ml-auto text-sm text-muted-foreground">Step 3 — Complete upload</span>
					</div>
					<div class="p-5 space-y-4">
						<p class="text-sm text-muted-foreground">Finalizes the multipart upload, assembles the object in R2, creates the file record, and updates storage quota. All parts must be uploaded before calling this.</p>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Request Body</p>
							<div class="overflow-x-auto">
								<table class="w-full text-sm">
									<thead>
										<tr class="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-muted-foreground/60">
											<th class="pb-2 pr-4 font-medium">Field</th>
											<th class="pb-2 pr-4 font-medium">Type</th>
											<th class="pb-2 pr-4 font-medium">Required</th>
											<th class="pb-2 font-medium">Description</th>
										</tr>
									</thead>
									<tbody class="font-mono">
										<tr class="border-b border-white/[0.04]">
											<td class="py-2.5 pr-4 text-cyan/80">uploadSessionId</td>
											<td class="py-2.5 pr-4 text-muted-foreground">string</td>
											<td class="py-2.5 pr-4 text-emerald-400">yes</td>
											<td class="py-2.5 font-sans text-muted-foreground">Session ID from initiate</td>
										</tr>
										<tr>
											<td class="py-2.5 pr-4 text-cyan/80">sha256</td>
											<td class="py-2.5 pr-4 text-muted-foreground">string</td>
											<td class="py-2.5 pr-4 text-emerald-400">yes</td>
											<td class="py-2.5 font-sans text-muted-foreground">64-char hex SHA-256 of the complete file</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Response 200</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`{
  "file": {
    "id": "f1",
    "fileName": "installer.exe",
    "filePath": "installer.exe",
    "sizeBytes": 298262528,
    "sha256": "a1b2c3...",
    "mimeType": "application/vnd.microsoft.portable-executable"
  }
}`}</pre>
							</div>
						</div>
					</div>
				</div>

				<!-- Full JS upload example -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
					<h3 class="mb-1 font-semibold">Complete JavaScript Upload Example</h3>
					<p class="mb-3 text-sm text-muted-foreground">Full end-to-end upload with SHA-256 checksum generation:</p>
					<div class="relative rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
						<button onclick={() => copyCode('upload-js', `async function uploadFile(file, projectSlug, versionTag, apiKey) {
\tconst BASE = 'https://lunaris.win/api/v1';
\tconst headers = { 'Authorization': \`Bearer \${apiKey}\` };

\t// Step 1: Initiate
\tconst { uploadSessionId, partSize, totalParts } = await fetch(\`\${BASE}/upload/initiate\`, {
\t\tmethod: 'POST',
\t\theaders: { ...headers, 'Content-Type': 'application/json' },
\t\tbody: JSON.stringify({
\t\t\tprojectSlug,
\t\t\tversionTag,
\t\t\tfileName: file.name,
\t\t\ttotalSize: file.size,
\t\t}),
\t}).then(r => r.json());

\t// Step 2: Upload parts
\tfor (let i = 0; i < totalParts; i++) {
\t\tconst start = i * partSize;
\t\tconst chunk = file.slice(start, start + partSize);
\t\tawait fetch(\`\${BASE}/upload/part\`, {
\t\t\tmethod: 'PUT',
\t\t\theaders: {
\t\t\t\t...headers,
\t\t\t\t'x-upload-session-id': uploadSessionId,
\t\t\t\t'x-part-number': String(i + 1),
\t\t\t},
\t\t\tbody: chunk,
\t\t});
\t}

\t// Compute SHA-256
\tconst buffer = await file.arrayBuffer();
\tconst hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
\tconst sha256 = Array.from(new Uint8Array(hashBuffer))
\t\t.map(b => b.toString(16).padStart(2, '0')).join('');

\t// Step 3: Complete
\tconst { file: result } = await fetch(\`\${BASE}/upload/complete\`, {
\t\tmethod: 'POST',
\t\theaders: { ...headers, 'Content-Type': 'application/json' },
\t\tbody: JSON.stringify({ uploadSessionId, sha256 }),
\t}).then(r => r.json());

\treturn result;
}`)} class="absolute right-3 top-3 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-xs text-muted-foreground transition-all hover:bg-white/[0.06] hover:text-foreground {copiedId === 'upload-js' ? 'text-emerald-400' : ''}">{copiedId === 'upload-js' ? 'Copied!' : 'Copy'}</button>
						<pre class="overflow-x-auto font-mono text-sm text-foreground/90"><span class="text-blue-400">async function</span> <span class="text-cyan">uploadFile</span>(file, projectSlug, versionTag, apiKey) {"{"}
	<span class="text-blue-400">const</span> BASE = <span class="text-amber-400">'https://lunaris.win/api/v1'</span>;
	<span class="text-blue-400">const</span> headers = {"{"} <span class="text-amber-400">'Authorization'</span>: <span class="text-amber-400">`Bearer ${"${apiKey}"}`</span> {"}"};

	<span class="text-muted-foreground/60">// Step 1: Initiate</span>
	<span class="text-blue-400">const</span> {"{"} uploadSessionId, partSize, totalParts {"}"} = <span class="text-blue-400">await</span> <span class="text-cyan">fetch</span>(<span class="text-amber-400">`${"${BASE}"}/upload/initiate`</span>, {"{"}
		method: <span class="text-amber-400">'POST'</span>,
		headers: {"{"} ...headers, <span class="text-amber-400">'Content-Type'</span>: <span class="text-amber-400">'application/json'</span> {"}"},
		body: JSON.<span class="text-cyan">stringify</span>({"{"} projectSlug, versionTag, fileName: file.name, totalSize: file.size {"}"}),
	{"}"}).<span class="text-cyan">then</span>(r => r.<span class="text-cyan">json</span>());

	<span class="text-muted-foreground/60">// Step 2: Upload parts</span>
	<span class="text-blue-400">for</span> (<span class="text-blue-400">let</span> i = <span class="text-amber-400">0</span>; i {"<"} totalParts; i++) {"{"}
		<span class="text-blue-400">const</span> start = i * partSize;
		<span class="text-blue-400">const</span> chunk = file.<span class="text-cyan">slice</span>(start, start + partSize);
		<span class="text-blue-400">await</span> <span class="text-cyan">fetch</span>(<span class="text-amber-400">`${"${BASE}"}/upload/part`</span>, {"{"}
			method: <span class="text-amber-400">'PUT'</span>,
			headers: {"{"} ...headers, <span class="text-amber-400">'x-upload-session-id'</span>: uploadSessionId, <span class="text-amber-400">'x-part-number'</span>: <span class="text-cyan">String</span>(i + <span class="text-amber-400">1</span>) {"}"},
			body: chunk,
		{"}"});
	{"}"}

	<span class="text-muted-foreground/60">// Compute SHA-256</span>
	<span class="text-blue-400">const</span> hashBuffer = <span class="text-blue-400">await</span> crypto.subtle.<span class="text-cyan">digest</span>(<span class="text-amber-400">'SHA-256'</span>, <span class="text-blue-400">await</span> file.<span class="text-cyan">arrayBuffer</span>());
	<span class="text-blue-400">const</span> sha256 = Array.<span class="text-cyan">from</span>(<span class="text-blue-400">new</span> <span class="text-cyan">Uint8Array</span>(hashBuffer))
		.<span class="text-cyan">map</span>(b => b.<span class="text-cyan">toString</span>(<span class="text-amber-400">16</span>).<span class="text-cyan">padStart</span>(<span class="text-amber-400">2</span>, <span class="text-amber-400">'0'</span>)).<span class="text-cyan">join</span>(<span class="text-amber-400">''</span>);

	<span class="text-muted-foreground/60">// Step 3: Complete</span>
	<span class="text-blue-400">const</span> {"{"} file: result {"}"} = <span class="text-blue-400">await</span> <span class="text-cyan">fetch</span>(<span class="text-amber-400">`${"${BASE}"}/upload/complete`</span>, {"{"}
		method: <span class="text-amber-400">'POST'</span>,
		headers: {"{"} ...headers, <span class="text-amber-400">'Content-Type'</span>: <span class="text-amber-400">'application/json'</span> {"}"},
		body: JSON.<span class="text-cyan">stringify</span>({"{"} uploadSessionId, sha256 {"}"}),
	{"}"}).<span class="text-cyan">then</span>(r => r.<span class="text-cyan">json</span>());

	<span class="text-blue-400">return</span> result;
{"}"}</pre>
					</div>
				</div>
			</div>
			{/if}

			<!-- ══════════════════════════════════════════ -->
			<!-- USER                                       -->
			<!-- ══════════════════════════════════════════ -->
			{#if activeTab === 'user'}
			<div class="space-y-6">
				<div>
					<h2 class="text-2xl font-bold tracking-tight">User</h2>
					<p class="mt-2 text-muted-foreground">Endpoints for managing the authenticated user's profile settings.</p>
				</div>

				<!-- POST /user/username -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['POST']}">POST</span>
						<code class="font-mono text-sm text-foreground/90">/user/username</code>
						<span class="ml-auto text-sm text-muted-foreground">Set username</span>
					</div>
					<div class="p-5 space-y-4">
						<p class="text-sm text-muted-foreground">Sets or updates the authenticated user's username. Usernames must be 2–39 characters, lowercase letters, numbers, and hyphens only. Must not start or end with a hyphen.</p>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Request Body</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`{ "username": "my-username" }`}</pre>
							</div>
						</div>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Response 200</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`{ "success": true, "username": "my-username" }`}</pre>
							</div>
						</div>
					</div>
				</div>

				<!-- POST /user/avatar -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['POST']}">POST</span>
						<code class="font-mono text-sm text-foreground/90">/user/avatar</code>
						<span class="ml-auto text-sm text-muted-foreground">Upload avatar</span>
					</div>
					<div class="p-5 space-y-4">
						<p class="text-sm text-muted-foreground">Uploads a profile avatar. Accepts <code class="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-xs">multipart/form-data</code> with a field named <code class="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-xs">avatar</code>. Supported types: PNG, JPEG, GIF, WebP. Maximum size: 5 MB.</p>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Request (multipart/form-data)</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`avatar: <file> (PNG/JPEG/GIF/WebP, max 5MB)`}</pre>
							</div>
						</div>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Response 200</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`{ "success": true, "imageUrl": "/api/v1/avatar/{userId}" }`}</pre>
							</div>
						</div>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">cURL</p>
							<div class="relative rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<button onclick={() => copyCode('avatar-curl', `curl -X POST https://lunaris.win/api/v1/user/avatar \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -F "avatar=@/path/to/avatar.png"`)} class="absolute right-3 top-3 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-xs text-muted-foreground transition-all hover:bg-white/[0.06] hover:text-foreground {copiedId === 'avatar-curl' ? 'text-emerald-400' : ''}">{copiedId === 'avatar-curl' ? 'Copied!' : 'Copy'}</button>
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`curl -X POST https://lunaris.win/api/v1/user/avatar \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "avatar=@/path/to/avatar.png"`}</pre>
							</div>
						</div>
					</div>
				</div>

				<!-- DELETE /user/avatar -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['DELETE']}">DELETE</span>
						<code class="font-mono text-sm text-foreground/90">/user/avatar</code>
						<span class="ml-auto text-sm text-muted-foreground">Remove avatar</span>
					</div>
					<div class="p-5 space-y-4">
						<p class="text-sm text-muted-foreground">Deletes the authenticated user's avatar from storage and clears it from their profile.</p>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Response 200</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`{ "success": true }`}</pre>
							</div>
						</div>
					</div>
				</div>

				<!-- GET /avatar/[id] -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['GET']}">GET</span>
						<code class="font-mono text-sm text-foreground/90">/avatar/<span class="text-primary">{'{userId}'}</span></code>
						<span class="ml-auto text-sm text-muted-foreground">Fetch avatar image</span>
					</div>
					<div class="p-5">
						<p class="text-sm text-muted-foreground">Streams the avatar image for a given user ID. No authentication required. Cached for 1 hour (CDN: 24 hours). Returns 404 if no avatar is set.</p>
					</div>
				</div>
			</div>
			{/if}

			<!-- ══════════════════════════════════════════ -->
			<!-- QUOTA                                      -->
			<!-- ══════════════════════════════════════════ -->
			{#if activeTab === 'quota'}
			<div class="space-y-6">
				<div>
					<h2 class="text-2xl font-bold tracking-tight">Quota</h2>
					<p class="mt-2 text-muted-foreground">Every account starts with <strong>100 GB</strong> of free storage. Request more if you need it.</p>
				</div>

				<!-- POST /quota-request -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['POST']}">POST</span>
						<code class="font-mono text-sm text-foreground/90">/quota-request</code>
						<span class="ml-auto text-sm text-muted-foreground">Request quota increase</span>
					</div>
					<div class="p-5 space-y-4">
						<p class="text-sm text-muted-foreground">Submits a storage quota increase request to the Lunaris team for review. Requests are manually reviewed and approved or denied with an optional note.</p>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Request Body</p>
							<div class="overflow-x-auto">
								<table class="w-full text-sm">
									<thead>
										<tr class="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-muted-foreground/60">
											<th class="pb-2 pr-4 font-medium">Field</th>
											<th class="pb-2 pr-4 font-medium">Type</th>
											<th class="pb-2 pr-4 font-medium">Required</th>
											<th class="pb-2 font-medium">Constraints</th>
										</tr>
									</thead>
									<tbody class="font-mono">
										<tr class="border-b border-white/[0.04]">
											<td class="py-2.5 pr-4 text-cyan/80">requestedGB</td>
											<td class="py-2.5 pr-4 text-muted-foreground">integer</td>
											<td class="py-2.5 pr-4 text-emerald-400">yes</td>
											<td class="py-2.5 font-sans text-muted-foreground">1–10,000 GB</td>
										</tr>
										<tr>
											<td class="py-2.5 pr-4 text-cyan/80">reason</td>
											<td class="py-2.5 pr-4 text-muted-foreground">string</td>
											<td class="py-2.5 pr-4 text-emerald-400">yes</td>
											<td class="py-2.5 font-sans text-muted-foreground">1–1,000 characters</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Response 201</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`{ "success": true }`}</pre>
							</div>
						</div>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">cURL</p>
							<div class="relative rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<button onclick={() => copyCode('quota-curl', `curl -X POST https://lunaris.win/api/v1/quota-request \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"requestedGB":500,"reason":"Distributing large game assets for my open-source project."}'`)} class="absolute right-3 top-3 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-xs text-muted-foreground transition-all hover:bg-white/[0.06] hover:text-foreground {copiedId === 'quota-curl' ? 'text-emerald-400' : ''}">{copiedId === 'quota-curl' ? 'Copied!' : 'Copy'}</button>
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`curl -X POST https://lunaris.win/api/v1/quota-request \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"requestedGB":500,"reason":"Distributing large game assets."}'`}</pre>
							</div>
						</div>
					</div>
				</div>

				<!-- Upload limits info -->
				<div class="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
					<div class="flex gap-3">
						<svg class="mt-0.5 h-5 w-5 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
						</svg>
						<div>
							<p class="font-semibold text-amber-400">Upload limits</p>
							<ul class="mt-2 space-y-1 text-sm text-muted-foreground">
								<li>Maximum file size: <span class="text-foreground">5 GB per file</span></li>
								<li>Default storage per account: <span class="text-foreground">100 GB</span></li>
								<li>Upload session expiry: <span class="text-foreground">24 hours</span></li>
								<li>Uploads return HTTP 413 when quota is exceeded</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
			{/if}

			<!-- ══════════════════════════════════════════ -->
			<!-- ADMIN                                      -->
			<!-- ══════════════════════════════════════════ -->
			{#if activeTab === 'admin'}
			<div class="space-y-6">
				<div>
					<h2 class="text-2xl font-bold tracking-tight">Admin Endpoints</h2>
					<p class="mt-2 text-muted-foreground">These endpoints require the authenticated user to have the <code class="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-xs">admin</code> role. All return <strong>403 Forbidden</strong> for non-admin users.</p>
				</div>

				<!-- Warning banner -->
				<div class="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
					<div class="flex gap-3">
						<svg class="mt-0.5 h-5 w-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
						</svg>
						<p class="text-sm text-muted-foreground">Admin endpoints perform destructive operations. These are intended for platform administrators only and are not available to regular users.</p>
					</div>
				</div>

				<!-- PATCH /admin/users/[id] -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['PATCH']}">PATCH</span>
						<code class="font-mono text-sm text-foreground/90">/admin/users/<span class="text-primary">{'{id}'}</span></code>
						<span class="ml-auto text-sm text-muted-foreground">Update user</span>
					</div>
					<div class="p-5 space-y-4">
						<p class="text-sm text-muted-foreground">Updates a user's profile fields and/or storage limit. All fields are optional.</p>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Request Body (all optional)</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`{
  "name": "Display Name",
  "username": "new-username",
  "email": "user@example.com",
  "role": "admin",
  "storageLimitGB": 500
}`}</pre>
							</div>
						</div>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Response 200</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`{ "success": true }`}</pre>
							</div>
						</div>
					</div>
				</div>

				<!-- DELETE /admin/users/[id] -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['DELETE']}">DELETE</span>
						<code class="font-mono text-sm text-foreground/90">/admin/users/<span class="text-primary">{'{id}'}</span></code>
						<span class="ml-auto text-sm text-muted-foreground">Delete user</span>
					</div>
					<div class="p-5">
						<p class="text-sm text-muted-foreground">Permanently deletes a user account, all their projects, versions, files (from R2), upload sessions, and auth sessions. Cascades fully.</p>
					</div>
				</div>

				<!-- PATCH /admin/projects/[id] -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['PATCH']}">PATCH</span>
						<code class="font-mono text-sm text-foreground/90">/admin/projects/<span class="text-primary">{'{id}'}</span></code>
						<span class="ml-auto text-sm text-muted-foreground">Toggle project visibility</span>
					</div>
					<div class="p-5 space-y-4">
						<p class="text-sm text-muted-foreground">Sets a project's public/private visibility. Uses the project's internal UUID, not the slug.</p>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Request Body</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`{ "isPublic": false }`}</pre>
							</div>
						</div>
					</div>
				</div>

				<!-- DELETE /admin/projects/[id] -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['DELETE']}">DELETE</span>
						<code class="font-mono text-sm text-foreground/90">/admin/projects/<span class="text-primary">{'{id}'}</span></code>
						<span class="ml-auto text-sm text-muted-foreground">Delete project</span>
					</div>
					<div class="p-5">
						<p class="text-sm text-muted-foreground">Permanently deletes a project, all its versions, files (from R2), and upload sessions. Reclaims storage quota for the project's owner.</p>
					</div>
				</div>

				<!-- PATCH /admin/quotas/[id] -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['PATCH']}">PATCH</span>
						<code class="font-mono text-sm text-foreground/90">/admin/quotas/<span class="text-primary">{'{id}'}</span></code>
						<span class="ml-auto text-sm text-muted-foreground">Resolve quota request</span>
					</div>
					<div class="p-5 space-y-4">
						<p class="text-sm text-muted-foreground">Approves or denies a storage quota increase request. On approval, the user's storage limit is immediately updated to the requested amount.</p>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Request Body</p>
							<div class="overflow-x-auto">
								<table class="w-full text-sm">
									<thead>
										<tr class="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-muted-foreground/60">
											<th class="pb-2 pr-4 font-medium">Field</th>
											<th class="pb-2 pr-4 font-medium">Type</th>
											<th class="pb-2 pr-4 font-medium">Required</th>
											<th class="pb-2 font-medium">Values</th>
										</tr>
									</thead>
									<tbody class="font-mono">
										<tr class="border-b border-white/[0.04]">
											<td class="py-2.5 pr-4 text-cyan/80">action</td>
											<td class="py-2.5 pr-4 text-muted-foreground">string</td>
											<td class="py-2.5 pr-4 text-emerald-400">yes</td>
											<td class="py-2.5 font-sans text-muted-foreground"><code class="font-mono text-xs">"approve"</code> or <code class="font-mono text-xs">"deny"</code></td>
										</tr>
										<tr>
											<td class="py-2.5 pr-4 text-cyan/80">adminNote</td>
											<td class="py-2.5 pr-4 text-muted-foreground">string</td>
											<td class="py-2.5 pr-4 text-muted-foreground">no</td>
											<td class="py-2.5 font-sans text-muted-foreground">Optional note attached to the resolution</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
						<div>
							<p class="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Response 200</p>
							<div class="rounded-lg border border-white/[0.06] bg-[#08080c] p-4">
								<pre class="overflow-x-auto font-mono text-sm text-foreground/90">{`{ "success": true }`}</pre>
							</div>
						</div>
					</div>
				</div>

				<!-- DELETE /admin/files/[id] -->
				<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
					<div class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
						<span class="rounded border px-2 py-0.5 font-mono text-xs font-semibold {methodColors['DELETE']}">DELETE</span>
						<code class="font-mono text-sm text-foreground/90">/admin/files/<span class="text-primary">{'{id}'}</span></code>
						<span class="ml-auto text-sm text-muted-foreground">Delete file</span>
					</div>
					<div class="p-5">
						<p class="text-sm text-muted-foreground">Deletes a single file from R2 storage and the database. Reclaims the file's size from the owner's quota. Uses the file's internal UUID.</p>
					</div>
				</div>
			</div>
			{/if}

		</main>
	</div>

	<!-- Footer CTA -->
	<div class="mt-16 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
		<h3 class="text-xl font-semibold">Ready to start building?</h3>
		<p class="mt-2 text-muted-foreground">Generate an API key from your dashboard and start automating your releases.</p>
		<div class="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
			<a href="/dashboard/api-keys" class="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white">
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
				</svg>
				Generate API Key
			</a>
			<a href="/dashboard" class="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-6 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-white/[0.04] hover:text-foreground">
				Go to Dashboard
			</a>
		</div>
	</div>

</div>
