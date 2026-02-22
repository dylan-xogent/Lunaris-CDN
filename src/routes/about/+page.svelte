<svelte:head>
	<title>About - Lunaris CDN</title>
	<meta name="description" content="Learn about Lunaris CDN — a free, donation-funded CDN for developers. File hosting, versioned releases, API access, and global delivery via Cloudflare." />
	<link rel="canonical" href="https://lunaris.win/about" />
</svelte:head>

<div class="relative min-h-screen">
	<!-- Background -->
	<div class="pointer-events-none absolute inset-0 grid-bg"></div>
	<div class="pointer-events-none absolute top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]"></div>
	<div class="pointer-events-none absolute top-1/3 -right-32 h-[300px] w-[300px] rounded-full bg-cyan/4 blur-[100px]"></div>

	<div class="relative mx-auto max-w-4xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">

		<!-- Header -->
		<div class="mb-16 text-center">
			<div class="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-1.5 text-sm text-muted-foreground">
				<span class="relative flex h-2 w-2">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-75"></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-emerald"></span>
				</span>
				Free forever
			</div>
			<h1 class="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
				About Lunaris CDN
			</h1>
			<p class="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
				A free, community-funded content delivery network built by developers, for developers.
				No paywalls, no egress fees, no strings attached.
			</p>
		</div>

		<!-- What is Lunaris CDN -->
		<div class="mb-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm sm:p-10">
			<div class="mb-5 inline-flex rounded-xl border border-primary/20 bg-primary/10 p-3">
				<svg class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
				</svg>
			</div>
			<h2 class="text-2xl font-bold tracking-tight">What is Lunaris CDN?</h2>
			<div class="mt-4 space-y-4 text-muted-foreground leading-relaxed">
				<p>
					Lunaris CDN is a <strong class="text-foreground font-medium">free, donation-funded file hosting and content delivery
					platform</strong> built specifically for developers. It gives you a clean, permanent CDN URL for every file you
					upload — whether that's a Windows installer, a Linux package, a compiled binary, or a documentation archive.
				</p>
				<p>
					Every file is delivered through <strong class="text-foreground font-medium">Cloudflare's global network of 300+
					edge locations</strong>, putting your content milliseconds away from your users regardless of where they are in
					the world. Files are stored on Cloudflare R2 object storage with built-in redundancy, and every upload is
					automatically checksummed with SHA256 so your users can verify what they download.
				</p>
				<p>
					Unlike commercial CDNs that charge for egress or lock you into expensive tiers, Lunaris CDN is sustained entirely
					through community donations. There are no vendor lock-in traps, no surprise bills, and no data harvesting.
					If you find the Service useful, consider <a href="https://github.com/sponsors" class="text-primary hover:underline">supporting its development</a>.
				</p>
			</div>
		</div>

		<!-- Features grid -->
		<div class="mb-10">
			<h2 class="mb-6 text-2xl font-bold tracking-tight">Features</h2>
			<div class="grid gap-4 sm:grid-cols-2">

				<div class="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.02]">
					<div class="mb-3 inline-flex rounded-xl border border-primary/20 bg-primary/10 p-2.5">
						<svg class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
						</svg>
					</div>
					<h3 class="font-semibold">File Hosting</h3>
					<p class="mt-2 text-sm text-muted-foreground leading-relaxed">
						Upload files up to 5GB each with 100GB of default total storage. Chunked multipart uploads ensure
						reliability even for large binaries. Drag-and-drop via the dashboard or automate with the API.
					</p>
				</div>

				<div class="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.02]">
					<div class="mb-3 inline-flex rounded-xl border border-amber-400/20 bg-amber-400/10 p-2.5">
						<svg class="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
						</svg>
					</div>
					<h3 class="font-semibold">Versioned Releases</h3>
					<p class="mt-2 text-sm text-muted-foreground leading-relaxed">
						Tag files with semantic version strings. Point users to a specific version with
						<code class="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-xs">?v=2.1.0</code> or always serve
						the latest. Immutable cache headers ensure versioned URLs never serve stale content.
					</p>
				</div>

				<div class="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.02]">
					<div class="mb-3 inline-flex rounded-xl border border-cyan/20 bg-cyan/10 p-2.5">
						<svg class="h-5 w-5 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
						</svg>
					</div>
					<h3 class="font-semibold">API Access</h3>
					<p class="mt-2 text-sm text-muted-foreground leading-relaxed">
						Generate scoped API keys from the dashboard and automate uploads from GitHub Actions, GitLab CI,
						or any CI/CD pipeline. RESTful endpoints with Bearer authentication make integration simple.
					</p>
				</div>

				<div class="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.02]">
					<div class="mb-3 inline-flex rounded-xl border border-emerald/20 bg-emerald/10 p-2.5">
						<svg class="h-5 w-5 text-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
						</svg>
					</div>
					<h3 class="font-semibold">Custom CDN URLs</h3>
					<p class="mt-2 text-sm text-muted-foreground leading-relaxed">
						Every file gets a clean, shareable URL under
						<code class="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-xs">cdn.lunaris.win/you/project/file</code>.
						Drop it in your README, docs, or release notes and it just works — forever.
					</p>
				</div>

			</div>
		</div>

		<!-- FAQ section -->
		<div class="mb-10">
			<h2 class="mb-6 text-2xl font-bold tracking-tight">Frequently Asked Questions</h2>
			<div class="space-y-4">

				<!-- Q1 -->
				<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
					<h3 class="font-semibold text-foreground">How is Lunaris CDN free?</h3>
					<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
						Lunaris CDN is funded entirely by voluntary donations from the developer community. The infrastructure
						is built on Cloudflare's generous free and paid tiers combined with R2's cost-effective storage pricing.
						The goal is to keep the service permanently free for individual developers and small open-source projects.
						If Lunaris CDN saves you money or time, consider supporting its operation — even a small donation helps
						keep the lights on and storage costs covered.
					</p>
				</div>

				<!-- Q2 -->
				<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
					<h3 class="font-semibold text-foreground">What are the storage limits?</h3>
					<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
						Each account starts with <strong class="text-foreground">100GB of total storage</strong> and a maximum
						individual file size of <strong class="text-foreground">5GB</strong>. There are no limits on the number
						of downloads or bandwidth consumed — you will never receive an egress bill. If you're running a larger
						open-source project and need more than 100GB, you can request a storage increase by getting in touch.
						Requests are reviewed on a case-by-case basis and granted based on available capacity.
					</p>
				</div>

				<!-- Q3 -->
				<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
					<h3 class="font-semibold text-foreground">How fast is it?</h3>
					<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
						Files are served through <strong class="text-foreground">Cloudflare's global edge network</strong>, which
						spans over 300 locations worldwide. Once a file is cached at an edge node, Time to First Byte (TTFB) is
						typically under 50ms for users near an edge location. Versioned files are cached with immutable headers,
						meaning repeat downloads skip the origin entirely. The speed you get is effectively the same as what
						enterprises pay Cloudflare millions for — you're just sharing it with the community.
					</p>
				</div>

				<!-- Q4 -->
				<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
					<h3 class="font-semibold text-foreground">Is my data safe?</h3>
					<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
						Files are stored on <strong class="text-foreground">Cloudflare R2</strong>, which provides automatic
						redundancy and durability designed for production workloads. Every file is automatically checksummed with
						SHA256 at upload time, so you and your users can verify download integrity. While we take storage
						seriously, note that as a free service there is no formal SLA or uptime guarantee — we recommend maintaining
						your own backup copy of critical files. All uploaded files are publicly accessible to anyone with the URL,
						so do not upload private or sensitive content.
					</p>
				</div>

				<!-- Q5 -->
				<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
					<h3 class="font-semibold text-foreground">Who can use Lunaris CDN?</h3>
					<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
						Lunaris CDN is designed for individual developers, small teams, and open-source projects that need a
						reliable way to distribute software files. It is particularly suited for hosting installers, compiled
						binaries, packages, documentation bundles, and other developer-facing assets. Use is governed by our
						<a href="/tos" class="text-primary hover:underline">Terms of Service</a> — the short version is: keep
						it legal, keep it developer-focused, and don't abuse the shared infrastructure.
					</p>
				</div>

				<!-- Q6 -->
				<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
					<h3 class="font-semibold text-foreground">Can I use the API in CI/CD?</h3>
					<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
						Yes. Generate an API key from your dashboard and use it to upload files directly from any CI/CD system —
						GitHub Actions, GitLab CI, CircleCI, Jenkins, or a simple <code class="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-xs">curl</code> command in a shell script.
						The API uses standard Bearer token authentication and multipart form uploads. Scoped keys let you grant
						upload-only access without exposing your full account credentials.
					</p>
				</div>

			</div>
		</div>

		<!-- Built on -->
		<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm">
			<h2 class="mb-2 text-xl font-bold tracking-tight">Built on trusted infrastructure</h2>
			<p class="mb-6 text-sm text-muted-foreground">
				Lunaris CDN is built entirely on Cloudflare's platform, chosen for its reliability, global reach, and
				developer-friendly pricing model.
			</p>
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<div class="flex flex-col items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-4 text-center">
					<span class="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest">Storage</span>
					<span class="text-sm font-semibold">Cloudflare R2</span>
				</div>
				<div class="flex flex-col items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-4 text-center">
					<span class="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest">CDN</span>
					<span class="text-sm font-semibold">Cloudflare Edge</span>
				</div>
				<div class="flex flex-col items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-4 text-center">
					<span class="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest">Database</span>
					<span class="text-sm font-semibold">Cloudflare D1</span>
				</div>
				<div class="flex flex-col items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-4 text-center">
					<span class="text-xs font-medium text-muted-foreground/60 uppercase tracking-widest">Runtime</span>
					<span class="text-sm font-semibold">CF Pages</span>
				</div>
			</div>
		</div>

		<!-- CTA -->
		<div class="mt-12 text-center">
			<p class="mb-6 text-muted-foreground">Ready to start hosting?</p>
			<div class="flex flex-col items-center justify-center gap-3 sm:flex-row">
				<a href="/auth/register" class="btn-gradient group inline-flex items-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-semibold text-white">
					Create a free account
					<svg class="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
					</svg>
				</a>
				<a href="/tos" class="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-8 py-3.5 text-sm font-medium text-muted-foreground transition-all hover:bg-white/[0.04] hover:text-foreground hover:border-white/[0.12]">
					Read Terms of Service
				</a>
			</div>
		</div>

	</div>
</div>
