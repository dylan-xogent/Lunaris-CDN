<script lang="ts">
	import { reveal, countUp } from '$lib/reveal.js';

	interface Props {
		data: { user: { id: string } | null };
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Lunaris CDN - Free Developer CDN</title>
	<meta name="description" content="Host your installers, packages, and documentation for free. Clean download URLs, version management, and zero cost — forever." />
	<meta property="og:title" content="Lunaris CDN - Free Developer CDN" />
	<meta property="og:description" content="Upload your installers, packages, and documentation. Get clean, fast download URLs. 100GB free storage, zero egress fees, forever." />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://lunaris.win" />
	<meta property="og:site_name" content="Lunaris CDN" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Lunaris CDN - Free Developer CDN" />
	<meta name="twitter:description" content="Host and distribute your developer files for free. Zero cost, forever." />
	<link rel="canonical" href="https://lunaris.win" />
</svelte:head>

<!-- ============================================ -->
<!-- HERO                                         -->
<!-- ============================================ -->
<section class="relative min-h-screen overflow-x-clip overflow-y-visible">
	<!-- Constellation SVG background -->
	<div class="pointer-events-none absolute inset-0">
		<svg class="h-full w-full opacity-[0.15]" viewBox="0 0 1200 800" fill="none">
			<!-- Nodes -->
			<circle cx="150" cy="120" r="2" fill="#8b5cf6" class="animate-pulse-slow" />
			<circle cx="350" cy="200" r="1.5" fill="#22d3ee" class="animate-pulse-slow" style="animation-delay: 0.5s" />
			<circle cx="550" cy="80" r="2" fill="#8b5cf6" class="animate-pulse-slow" style="animation-delay: 1s" />
			<circle cx="750" cy="180" r="1.5" fill="#22d3ee" class="animate-pulse-slow" style="animation-delay: 1.5s" />
			<circle cx="950" cy="100" r="2" fill="#8b5cf6" class="animate-pulse-slow" style="animation-delay: 2s" />
			<circle cx="1050" cy="250" r="1.5" fill="#22d3ee" class="animate-pulse-slow" style="animation-delay: 0.8s" />
			<circle cx="250" cy="350" r="1.5" fill="#8b5cf6" class="animate-pulse-slow" style="animation-delay: 1.2s" />
			<circle cx="650" cy="320" r="2" fill="#22d3ee" class="animate-pulse-slow" style="animation-delay: 0.3s" />
			<circle cx="850" cy="380" r="1.5" fill="#8b5cf6" class="animate-pulse-slow" style="animation-delay: 1.8s" />
			<circle cx="450" cy="450" r="2" fill="#22d3ee" class="animate-pulse-slow" style="animation-delay: 0.7s" />
			<circle cx="100" cy="500" r="1.5" fill="#8b5cf6" class="animate-pulse-slow" style="animation-delay: 2.2s" />
			<circle cx="1100" cy="450" r="2" fill="#8b5cf6" class="animate-pulse-slow" style="animation-delay: 1.4s" />
			<!-- Connecting lines -->
			<line x1="150" y1="120" x2="350" y2="200" stroke="#8b5cf6" stroke-width="0.5" opacity="0.3" />
			<line x1="350" y1="200" x2="550" y2="80" stroke="#22d3ee" stroke-width="0.5" opacity="0.2" />
			<line x1="550" y1="80" x2="750" y2="180" stroke="#8b5cf6" stroke-width="0.5" opacity="0.3" />
			<line x1="750" y1="180" x2="950" y2="100" stroke="#22d3ee" stroke-width="0.5" opacity="0.2" />
			<line x1="950" y1="100" x2="1050" y2="250" stroke="#8b5cf6" stroke-width="0.5" opacity="0.3" />
			<line x1="250" y1="350" x2="450" y2="450" stroke="#22d3ee" stroke-width="0.5" opacity="0.2" />
			<line x1="350" y1="200" x2="250" y2="350" stroke="#8b5cf6" stroke-width="0.5" opacity="0.2" />
			<line x1="650" y1="320" x2="850" y2="380" stroke="#22d3ee" stroke-width="0.5" opacity="0.3" />
			<line x1="550" y1="80" x2="650" y2="320" stroke="#8b5cf6" stroke-width="0.5" opacity="0.15" />
			<line x1="750" y1="180" x2="650" y2="320" stroke="#22d3ee" stroke-width="0.5" opacity="0.2" />
			<line x1="1050" y1="250" x2="1100" y2="450" stroke="#8b5cf6" stroke-width="0.5" opacity="0.2" />
			<line x1="850" y1="380" x2="1100" y2="450" stroke="#22d3ee" stroke-width="0.5" opacity="0.15" />
		</svg>
	</div>

	<!-- Gradient orbs -->
	<div class="pointer-events-none absolute -top-32 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/8 blur-[120px]"></div>
	<div class="pointer-events-none absolute top-1/4 -left-32 h-[400px] w-[400px] rounded-full bg-cyan/5 blur-[100px]"></div>
	<div class="pointer-events-none absolute top-1/3 -right-32 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[100px]"></div>

	<div class="relative mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6 sm:pt-32 lg:px-8">
		<!-- Badge -->
		<div class="mb-10 flex justify-center" use:reveal>
			<div class="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-1.5 text-sm backdrop-blur-sm">
				<span class="relative flex h-2 w-2">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-75"></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-emerald"></span>
				</span>
				<span class="text-muted-foreground">Free forever</span>
				<span class="text-white/[0.15]">|</span>
				<span class="text-muted-foreground">Zero egress fees</span>
			</div>
		</div>

		<!-- Headline -->
		<div use:reveal class="overflow-visible">
			<h1 class="mx-auto max-w-5xl px-4 text-center text-5xl font-bold leading-[1.05] tracking-tight sm:px-6 sm:text-7xl lg:text-8xl">
				Host and deliver your
				<br class="hidden sm:block" />
				files, <span class="font-display italic gradient-text" style="padding: 0.05em 0.15em 0.05em 0.2em;">globally</span>.
			</h1>
		</div>

		<div use:reveal>
			<p class="mx-auto mt-8 max-w-2xl text-center text-lg leading-relaxed text-muted-foreground sm:text-xl">
				Upload installers, packages, and documentation. Get clean CDN URLs
				your users can trust. <span class="text-foreground/80">100GB free</span>, no strings attached.
			</p>
		</div>

		<!-- CTA buttons -->
		<div class="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4" use:reveal>
			{#if data.user}
				<a href="/dashboard" class="btn-gradient group inline-flex items-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-semibold text-white">
					Go to Dashboard
					<svg class="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
					</svg>
				</a>
			{:else}
				<a href="/auth/register" class="btn-gradient group inline-flex items-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-semibold text-white">
					Start hosting for free
					<svg class="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
					</svg>
				</a>
				<a href="/auth/login" class="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-8 py-3.5 text-sm font-medium text-muted-foreground transition-all hover:bg-white/[0.04] hover:text-foreground hover:border-white/[0.12]">
					Sign in
				</a>
			{/if}
		</div>

		<!-- Terminal mockup with perspective tilt -->
		<div class="perspective-container mx-auto mt-24 max-w-2xl" use:reveal>
			<div class="perspective-tilt animate-float relative">
				<!-- Glow behind terminal -->
				<div class="absolute -inset-6 rounded-3xl bg-primary/6 blur-3xl animate-glow-pulse"></div>

				<div class="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0f]/90 shadow-2xl backdrop-blur-xl">
					<!-- Title bar with colored dots -->
					<div class="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3.5">
						<div class="flex gap-2">
							<div class="h-3 w-3 rounded-full bg-[#ff5f57]"></div>
							<div class="h-3 w-3 rounded-full bg-[#febc2e]"></div>
							<div class="h-3 w-3 rounded-full bg-[#28c840]"></div>
						</div>
						<div class="mx-auto rounded-md bg-white/[0.04] px-12 py-1 text-xs text-muted-foreground/60">
							Terminal
						</div>
					</div>

					<!-- Terminal content -->
					<div class="p-6 font-mono text-sm leading-loose">
						<div class="flex items-start gap-2">
							<span class="text-emerald select-none">$</span>
							<span class="text-muted-foreground">curl -O </span>
							<span class="text-foreground">cdn.lunaris.win/<span class="text-primary">acme</span>/<span class="text-cyan">my-app</span>/installer.exe</span>
						</div>
						<div class="mt-1 pl-4 text-xs text-muted-foreground/50">
							<span class="text-emerald/60">100%</span> |██████████████████████| 284.5 MB &nbsp; 52.3 MB/s
						</div>
						<div class="mt-4 flex items-start gap-2">
							<span class="text-emerald select-none">$</span>
							<span class="text-muted-foreground">curl -O </span>
							<span class="text-foreground">cdn.lunaris.win/<span class="text-primary">acme</span>/<span class="text-cyan">my-lib</span>/docs.zip<span class="text-amber-400">?v=2.1.0</span></span>
						</div>
						<div class="mt-1 pl-4 text-xs text-muted-foreground/50">
							<span class="text-emerald/60">100%</span> |██████████████████████| 1.2 GB &nbsp; 48.7 MB/s
						</div>
						<div class="mt-5 border-t border-white/[0.04] pt-4">
							<div class="flex items-start gap-2 text-muted-foreground">
								<span class="text-emerald select-none">$</span>
								<span>sha256sum installer.exe</span>
							</div>
							<div class="mt-1.5 pl-4 text-xs text-muted-foreground/50">
								<span class="text-emerald/60">a1b2c3d4e5f6...</span> installer.exe
								<span class="ml-2 text-emerald font-semibold">OK</span>
							</div>
						</div>
						<span class="mt-3 inline-block h-4 w-1.5 translate-y-0.5 bg-primary/60 animate-blink"></span>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ============================================ -->
<!-- STATS BAR                                    -->
<!-- ============================================ -->
<section class="relative border-y border-white/[0.04]">
	<div class="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-transparent to-cyan/[0.02]"></div>
	<div class="relative mx-auto grid max-w-7xl grid-cols-2 gap-px bg-white/[0.02] sm:grid-cols-4">
		<div class="bg-background px-6 py-10 text-center sm:py-12" use:reveal>
			<div class="text-4xl font-bold tracking-tight sm:text-5xl">
				<span use:countUp={{ target: 300, suffix: '+' }}>0+</span>
			</div>
			<div class="mt-2 text-sm text-muted-foreground">Edge Locations</div>
		</div>
		<div class="bg-background px-6 py-10 text-center sm:py-12" use:reveal>
			<div class="text-4xl font-bold tracking-tight sm:text-5xl">
				<span use:countUp={{ target: 100, suffix: 'GB' }}>0GB</span>
			</div>
			<div class="mt-2 text-sm text-muted-foreground">Free Storage</div>
		</div>
		<div class="bg-background px-6 py-10 text-center sm:py-12" use:reveal>
			<div class="text-4xl font-bold tracking-tight text-emerald sm:text-5xl">
				<span use:countUp={{ target: 0, prefix: '$' }}>$0</span>
			</div>
			<div class="mt-2 text-sm text-muted-foreground">Egress Fees</div>
		</div>
		<div class="bg-background px-6 py-10 text-center sm:py-12" use:reveal>
			<div class="text-4xl font-bold tracking-tight sm:text-5xl">
				<span use:countUp={{ target: 5, suffix: 'GB' }}>0GB</span>
			</div>
			<div class="mt-2 text-sm text-muted-foreground">Max File Size</div>
		</div>
	</div>
</section>

<!-- ============================================ -->
<!-- FEATURE 1: UPLOAD (visual left, text right)  -->
<!-- ============================================ -->
<section class="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-36 lg:px-8">
	<!-- Section label -->
	<div class="mb-20 text-center" use:reveal>
		<p class="text-sm font-medium uppercase tracking-widest text-primary">Features</p>
		<h2 class="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
			Everything you need to<br class="hidden sm:block" />
			<span class="font-display italic text-muted-foreground">distribute your software</span>
		</h2>
	</div>

	<!-- Upload feature: visual left, text right -->
	<div class="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
		<!-- Visual: drag-and-drop mockup -->
		<div class="relative" use:reveal>
			<div class="absolute -inset-4 rounded-3xl bg-primary/[0.03] blur-2xl"></div>
			<div class="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
				<!-- Drag zone -->
				<div class="mb-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/[0.08] bg-white/[0.01] px-6 py-10 transition-colors hover:border-primary/30 hover:bg-primary/[0.02]">
					<div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
						<svg class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
						</svg>
					</div>
					<p class="text-sm font-medium">Drop files here</p>
					<p class="mt-1 text-xs text-muted-foreground">or click to browse &middot; up to 5GB</p>
				</div>

				<!-- File list -->
				<div class="space-y-2">
					<div class="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3">
						<div class="flex items-center gap-3">
							<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
							</div>
							<div>
								<p class="text-sm font-medium">installer-v3.2.0.exe</p>
								<p class="text-xs text-muted-foreground">284.5 MB</p>
							</div>
						</div>
						<span class="rounded-full bg-emerald/10 px-2.5 py-0.5 text-xs font-medium text-emerald">Complete</span>
					</div>
					<div class="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-3">
						<div class="flex items-center gap-3">
							<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
							</div>
							<div>
								<p class="text-sm font-medium">docs-bundle.tar.gz</p>
								<p class="text-xs text-muted-foreground">1.2 GB</p>
							</div>
						</div>
						<div class="flex items-center gap-3">
							<div class="h-1.5 w-28 overflow-hidden rounded-full bg-white/[0.06]">
								<div class="h-full w-3/4 rounded-full bg-gradient-to-r from-primary to-cyan transition-all"></div>
							</div>
							<span class="text-xs tabular-nums text-muted-foreground">75%</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Text -->
		<div use:reveal>
			<div class="mb-5 inline-flex rounded-xl border border-primary/20 bg-primary/10 p-3">
				<svg class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
				</svg>
			</div>
			<h3 class="text-3xl font-bold tracking-tight sm:text-4xl">Upload anything,<br />up to 5GB</h3>
			<p class="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
				Drag and drop files up to 5GB each with 100GB of total storage. Installers, packages, documentation, binaries — chunked multipart uploads with automatic SHA256 checksums keep everything fast and verified.
			</p>
			<ul class="mt-6 space-y-3">
				<li class="flex items-center gap-3 text-sm text-muted-foreground">
					<svg class="h-4 w-4 shrink-0 text-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
					Chunked uploads for reliability
				</li>
				<li class="flex items-center gap-3 text-sm text-muted-foreground">
					<svg class="h-4 w-4 shrink-0 text-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
					Automatic SHA256 integrity verification
				</li>
				<li class="flex items-center gap-3 text-sm text-muted-foreground">
					<svg class="h-4 w-4 shrink-0 text-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
					Real-time progress with cancel support
				</li>
			</ul>
		</div>
	</div>
</section>

<!-- ============================================ -->
<!-- FEATURE 2: CDN (text left, globe right)      -->
<!-- ============================================ -->
<section class="relative border-t border-white/[0.04]">
	<div class="absolute inset-0 bg-gradient-to-b from-cyan/[0.01] to-transparent"></div>
	<div class="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-36 lg:px-8">
		<div class="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
			<!-- Text -->
			<div use:reveal>
				<div class="mb-5 inline-flex rounded-xl border border-cyan/20 bg-cyan/10 p-3">
					<svg class="h-6 w-6 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
					</svg>
				</div>
				<h3 class="text-3xl font-bold tracking-tight sm:text-4xl">Global edge<br />network</h3>
				<p class="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
					Powered by Cloudflare's 300+ locations worldwide. Your files are cached at the edge, milliseconds from your users — no matter where they are.
				</p>
				<ul class="mt-6 space-y-3">
					<li class="flex items-center gap-3 text-sm text-muted-foreground">
						<svg class="h-4 w-4 shrink-0 text-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
						Zero egress fees, always
					</li>
					<li class="flex items-center gap-3 text-sm text-muted-foreground">
						<svg class="h-4 w-4 shrink-0 text-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
						Immutable cache for versioned files
					</li>
					<li class="flex items-center gap-3 text-sm text-muted-foreground">
						<svg class="h-4 w-4 shrink-0 text-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
						Sub-50ms TTFB globally
					</li>
				</ul>
			</div>

			<!-- Visual: animated globe -->
			<div class="relative flex items-center justify-center" use:reveal>
				<!-- Ambient glow -->
				<div class="absolute h-96 w-96 rounded-full bg-cyan/[0.05] blur-[80px] animate-glow-pulse"></div>

				<div class="relative h-80 w-80 sm:h-96 sm:w-96">
					<!-- SVG globe wireframe -->
					<svg class="absolute inset-0 h-full w-full" viewBox="0 0 400 400" fill="none">
						<!-- Outer circle -->
						<circle cx="200" cy="200" r="180" stroke="rgba(34,211,238,0.15)" stroke-width="1" />
						<circle cx="200" cy="200" r="140" stroke="rgba(139,92,246,0.1)" stroke-width="0.75" />
						<circle cx="200" cy="200" r="100" stroke="rgba(34,211,238,0.08)" stroke-width="0.5" />

						<!-- Latitude lines (ellipses) -->
						<ellipse cx="200" cy="200" rx="180" ry="60" stroke="rgba(139,92,246,0.08)" stroke-width="0.5" />
						<ellipse cx="200" cy="200" rx="180" ry="120" stroke="rgba(34,211,238,0.06)" stroke-width="0.5" />
						<ellipse cx="200" cy="140" rx="150" ry="40" stroke="rgba(139,92,246,0.06)" stroke-width="0.5" />
						<ellipse cx="200" cy="260" rx="150" ry="40" stroke="rgba(34,211,238,0.06)" stroke-width="0.5" />

						<!-- Longitude lines (ellipses rotated) -->
						<ellipse cx="200" cy="200" rx="60" ry="180" stroke="rgba(34,211,238,0.08)" stroke-width="0.5" />
						<ellipse cx="200" cy="200" rx="120" ry="180" stroke="rgba(139,92,246,0.06)" stroke-width="0.5" />

						<!-- Equator -->
						<line x1="20" y1="200" x2="380" y2="200" stroke="rgba(34,211,238,0.1)" stroke-width="0.5" />
						<!-- Prime meridian -->
						<line x1="200" y1="20" x2="200" y2="380" stroke="rgba(139,92,246,0.1)" stroke-width="0.5" />
					</svg>

					<!-- Center glow dot -->
					<div class="absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan shadow-[0_0_30px_8px_rgba(34,211,238,0.3)]"></div>

					<!-- Orbiting dot -->
					<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
						<div class="animate-orbit">
							<div class="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_16px_4px_rgba(139,92,246,0.4)]"></div>
						</div>
					</div>

					<!-- Edge location nodes with pulse rings -->
					<div class="absolute top-[12%] left-[28%]">
						<div class="h-2 w-2 rounded-full bg-cyan shadow-[0_0_8px_rgba(34,211,238,0.5)]"></div>
						<div class="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-cyan/40"></div>
					</div>
					<div class="absolute top-[25%] right-[12%]">
						<div class="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div>
						<div class="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-primary/40" style="animation-delay: 1s"></div>
					</div>
					<div class="absolute bottom-[22%] left-[15%]">
						<div class="h-2 w-2 rounded-full bg-cyan shadow-[0_0_8px_rgba(34,211,238,0.5)]"></div>
						<div class="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-cyan/40" style="animation-delay: 2s"></div>
					</div>
					<div class="absolute bottom-[18%] right-[20%]">
						<div class="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div>
						<div class="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-primary/40" style="animation-delay: 0.5s"></div>
					</div>
					<div class="absolute top-[42%] left-[6%]">
						<div class="h-2 w-2 rounded-full bg-cyan shadow-[0_0_8px_rgba(34,211,238,0.5)]"></div>
						<div class="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-cyan/40" style="animation-delay: 1.5s"></div>
					</div>
					<div class="absolute top-[18%] right-[32%]">
						<div class="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div>
						<div class="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-primary/40" style="animation-delay: 2.5s"></div>
					</div>
					<div class="absolute bottom-[35%] right-[8%]">
						<div class="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_rgba(34,211,238,0.4)]"></div>
					</div>
					<div class="absolute top-[55%] left-[22%]">
						<div class="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(139,92,246,0.4)]"></div>
					</div>

					<!-- Connection lines between nodes (SVG overlay) -->
					<svg class="absolute inset-0 h-full w-full" viewBox="0 0 400 400" fill="none">
						<line x1="112" y1="48" x2="200" y2="200" stroke="rgba(34,211,238,0.08)" stroke-width="0.5" stroke-dasharray="4 4" />
						<line x1="352" y1="100" x2="200" y2="200" stroke="rgba(139,92,246,0.08)" stroke-width="0.5" stroke-dasharray="4 4" />
						<line x1="60" y1="312" x2="200" y2="200" stroke="rgba(34,211,238,0.08)" stroke-width="0.5" stroke-dasharray="4 4" />
						<line x1="320" y1="328" x2="200" y2="200" stroke="rgba(139,92,246,0.08)" stroke-width="0.5" stroke-dasharray="4 4" />
						<line x1="24" y1="168" x2="200" y2="200" stroke="rgba(34,211,238,0.06)" stroke-width="0.5" stroke-dasharray="4 4" />
						<line x1="272" y1="72" x2="200" y2="200" stroke="rgba(139,92,246,0.06)" stroke-width="0.5" stroke-dasharray="4 4" />
					</svg>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ============================================ -->
<!-- FEATURE 3: API (code left, text right)       -->
<!-- ============================================ -->
<section class="relative border-t border-white/[0.04]">
	<div class="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-36 lg:px-8">
		<div class="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
			<!-- Visual: code snippet -->
			<div class="relative" use:reveal>
				<div class="absolute -inset-4 rounded-3xl bg-primary/[0.03] blur-2xl"></div>
				<div class="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#08080c]">
					<div class="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3">
						<div class="flex gap-2">
							<div class="h-3 w-3 rounded-full bg-[#ff5f57]"></div>
							<div class="h-3 w-3 rounded-full bg-[#febc2e]"></div>
							<div class="h-3 w-3 rounded-full bg-[#28c840]"></div>
						</div>
						<span class="ml-3 text-xs text-muted-foreground/60">deploy.yml</span>
					</div>
					<pre class="overflow-x-auto p-6 font-mono text-[13px] leading-relaxed"><span class="text-muted-foreground/40"># GitHub Actions — upload on release</span>
<span class="text-cyan">name</span>: <span class="text-amber-400">Deploy to Lunaris CDN</span>
<span class="text-cyan">on</span>:
  <span class="text-cyan">release</span>:
    <span class="text-cyan">types</span>: [<span class="text-amber-400">published</span>]

<span class="text-cyan">jobs</span>:
  <span class="text-cyan">upload</span>:
    <span class="text-cyan">runs-on</span>: <span class="text-amber-400">ubuntu-latest</span>
    <span class="text-cyan">steps</span>:
      - <span class="text-cyan">run</span>: |
          <span class="text-foreground/70">curl</span> <span class="text-muted-foreground/60">-X POST \</span>
            <span class="text-muted-foreground/60">-H</span> <span class="text-amber-400">"Authorization: Bearer $&#123;&#123; secrets.LUNARIS_KEY &#125;&#125;"</span> <span class="text-muted-foreground/60">\</span>
            <span class="text-muted-foreground/60">-F</span> <span class="text-amber-400">"file=@dist/app.exe"</span> <span class="text-muted-foreground/60">\</span>
            <span class="text-foreground/80">lunaris.win/api/v1/upload</span></pre>
				</div>
			</div>

			<!-- Text -->
			<div use:reveal>
				<div class="mb-5 inline-flex rounded-xl border border-primary/20 bg-primary/10 p-3">
					<svg class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
					</svg>
				</div>
				<h3 class="text-3xl font-bold tracking-tight sm:text-4xl">API-first,<br />CI/CD ready</h3>
				<p class="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
					Generate API keys and automate uploads from GitHub Actions, GitLab CI, or any pipeline. Ship releases the moment your build passes.
				</p>
				<ul class="mt-6 space-y-3">
					<li class="flex items-center gap-3 text-sm text-muted-foreground">
						<svg class="h-4 w-4 shrink-0 text-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
						RESTful API with Bearer auth
					</li>
					<li class="flex items-center gap-3 text-sm text-muted-foreground">
						<svg class="h-4 w-4 shrink-0 text-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
						Scoped API keys with rate limiting
					</li>
					<li class="flex items-center gap-3 text-sm text-muted-foreground">
						<svg class="h-4 w-4 shrink-0 text-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
						Works with any CI/CD platform
					</li>
				</ul>
			</div>
		</div>
	</div>
</section>

<!-- ============================================ -->
<!-- MINI FEATURE GRID                            -->
<!-- ============================================ -->
<section class="relative border-t border-white/[0.04]">
	<div class="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<!-- Version management -->
			<div class="group rounded-2xl border border-white/[0.04] bg-white/[0.01] p-7 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.02]" use:reveal>
				<div class="mb-4 inline-flex rounded-xl border border-amber-400/20 bg-amber-400/10 p-2.5">
					<svg class="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
					</svg>
				</div>
				<h3 class="text-lg font-semibold">Version management</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					Tag releases with semantic versions. Use <code class="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-xs">?v=2.1.0</code> or let users always get the latest.
				</p>
			</div>

			<!-- SHA256 -->
			<div class="group rounded-2xl border border-white/[0.04] bg-white/[0.01] p-7 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.02]" use:reveal>
				<div class="mb-4 inline-flex rounded-xl border border-emerald/20 bg-emerald/10 p-2.5">
					<svg class="h-5 w-5 text-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
					</svg>
				</div>
				<h3 class="text-lg font-semibold">Integrity verified</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					Every file gets an automatic SHA256 checksum. Your users can verify downloads haven't been tampered with.
				</p>
			</div>

			<!-- Free forever -->
			<div class="group rounded-2xl border border-white/[0.04] bg-white/[0.01] p-7 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.02]" use:reveal>
				<div class="mb-4 inline-flex rounded-xl border border-primary/20 bg-primary/10 p-2.5">
					<svg class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
					</svg>
				</div>
				<h3 class="text-lg font-semibold">Free, forever</h3>
				<p class="mt-2 text-sm text-muted-foreground">
					No credit card. No usage caps on downloads. Community-funded infrastructure that stays free for every developer.
				</p>
			</div>
		</div>
	</div>
</section>

<!-- ============================================ -->
<!-- HOW IT WORKS                                 -->
<!-- ============================================ -->
<section class="relative border-t border-white/[0.04]">
	<div class="absolute inset-0 bg-gradient-to-b from-primary/[0.01] to-transparent"></div>
	<div class="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
		<div class="mx-auto mb-16 max-w-2xl text-center" use:reveal>
			<p class="text-sm font-medium uppercase tracking-widest text-primary">Simple workflow</p>
			<h2 class="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
				Three steps to <span class="font-display italic text-muted-foreground">go live</span>
			</h2>
		</div>

		<div class="relative mx-auto max-w-3xl">
			<!-- Connecting line -->
			<div class="absolute left-8 top-10 hidden h-[calc(100%-80px)] w-px bg-gradient-to-b from-primary/30 via-primary/10 to-transparent sm:block"></div>

			<!-- Step 1 -->
			<div class="relative flex gap-6 pb-14" use:reveal>
				<div class="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-2xl font-bold text-primary">
					1
				</div>
				<div class="pt-2">
					<h3 class="text-xl font-semibold">Create a project</h3>
					<p class="mt-2 text-lg text-muted-foreground">
						Sign up with GitHub, Google, or email. Create a project and give it a version tag — it takes seconds.
					</p>
				</div>
			</div>

			<!-- Step 2 -->
			<div class="relative flex gap-6 pb-14" use:reveal>
				<div class="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-2xl font-bold text-primary">
					2
				</div>
				<div class="pt-2">
					<h3 class="text-xl font-semibold">Upload your files</h3>
					<p class="mt-2 text-lg text-muted-foreground">
						Drag and drop in the dashboard, or push from CI with your API key. Files up to 5GB, checksums generated automatically.
					</p>
				</div>
			</div>

			<!-- Step 3 -->
			<div class="relative flex gap-6" use:reveal>
				<div class="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-emerald/20 bg-emerald/10 text-2xl font-bold text-emerald">
					3
				</div>
				<div class="pt-2">
					<h3 class="text-xl font-semibold">Share the link</h3>
					<p class="mt-2 text-lg text-muted-foreground">
						Get a clean URL like <code class="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs">cdn.lunaris.win/you/app/file.exe</code> and share it in your README, docs, or release notes.
					</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ============================================ -->
<!-- BUILT ON (Social Proof)                      -->
<!-- ============================================ -->
<section class="relative border-t border-white/[0.04]">
	<div class="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
		<div class="text-center" use:reveal>
			<p class="text-sm font-medium uppercase tracking-widest text-muted-foreground/60">Built on trusted infrastructure</p>
			<div class="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
				<!-- Cloudflare -->
				<div class="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.01] px-6 py-6 transition-all hover:border-white/[0.08] hover:bg-white/[0.02]">
					<svg class="h-8 w-8 text-muted-foreground/50" viewBox="0 0 24 24" fill="currentColor">
						<path d="M16.5088 16.8447c.1475-.5068.0908-.9707-.1553-1.3154-.2246-.3164-.5752-.4961-.9834-.5264l-8.9209-.1192c-.0537-.0039-.1006-.0303-.127-.0713-.0264-.041-.0322-.0918-.0156-.1377.0322-.084.1113-.1416.2012-.1494l9.0088-.1211c.8535-.0449 1.7793-.7344 2.1113-1.5742l.4219-1.0664c.0273-.0684.0371-.1426.0273-.2148C18.0313 8.1816 14.9004 5.25 11.0781 5.25c-3.4453 0-6.3398 2.4141-7.0664 5.6406-.5879-.4394-1.3242-.6621-2.1035-.5898-1.3066.1211-2.3555 1.1719-2.4727 2.4805-.0391.4316.0195.8457.1504 1.2226C.5234 14.043 0 14.5781 0 15.2344c0 .0312 0 .0605.002.0918l.0488.0215h16.2539c.0977 0 .1875-.0664.2041-.1631z" />
						<path d="M19.2402 9.6934c-.0908 0-.1797.0039-.2695.0098-.0654.0039-.1211.0488-.1406.1074l-.3535 1.2012c-.1475.5068-.0908.9707.1553 1.3154.2246.3164.5742.4961.9834.5264l1.8574.1192c.0527.0039.0996.0312.127.0713.0264.041.0312.0918.0156.1377-.0322.084-.1113.1416-.2012.1504l-1.9453.1211c-.8574.0449-1.7793.7344-2.1113 1.5742l-.1172.2969c-.0224.0566.0088.1191.0684.1367.2734.084.5645.1289.8652.1289 1.8926 0 3.4258-1.5332 3.4258-3.4258 0-1.8906-1.5332-3.4258-3.4258-3.4258z" />
					</svg>
					<span class="text-sm font-medium text-muted-foreground">Cloudflare</span>
				</div>
				<!-- SvelteKit -->
				<div class="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.01] px-6 py-6 transition-all hover:border-white/[0.08] hover:bg-white/[0.02]">
					<svg class="h-7 w-7 text-muted-foreground/50" viewBox="0 0 24 24" fill="currentColor">
						<path d="M20.564 3.34C18.157.292 13.86-.568 10.63 1.56L5.47 4.97a7.018 7.018 0 00-3.164 4.754 7.298 7.298 0 00.694 4.467 6.966 6.966 0 00-1.048 2.637 7.435 7.435 0 001.26 5.488c2.407 3.048 6.704 3.908 9.934 1.78l5.16-3.41a7.018 7.018 0 003.164-4.754 7.298 7.298 0 00-.694-4.467 6.966 6.966 0 001.048-2.637 7.435 7.435 0 00-1.26-5.488zM11.07 21.284a4.482 4.482 0 01-4.83-.924 4.473 4.473 0 01-.8-4.9l.242-.507.457.352a8.465 8.465 0 002.587 1.356l.246.078-.023.246a1.35 1.35 0 00.245.87 1.353 1.353 0 001.46.28c.111-.044.214-.103.308-.175l5.153-3.408a1.253 1.253 0 00.563-.847 1.35 1.35 0 00-.25-1.002 1.353 1.353 0 00-1.46-.28c-.112.045-.215.103-.308.175l-1.968 1.302a4.434 4.434 0 01-1.018.579 4.482 4.482 0 01-4.83-.924 4.473 4.473 0 01-.8-4.901 4.427 4.427 0 002.002-3.007l5.153-3.408a4.434 4.434 0 011.018-.58 4.482 4.482 0 014.83.925 4.473 4.473 0 01.8 4.9l-.242.507-.457-.352A8.465 8.465 0 0016.815 6l-.246-.078.023-.246a1.35 1.35 0 00-.245-.87 1.353 1.353 0 00-1.46-.28c-.111.044-.214.103-.308.175l-5.153 3.408a1.253 1.253 0 00-.563.847c-.02.36.068.717.25 1.002.29.373.728.6 1.202.623.088-.002.176-.013.263-.032.111-.045.215-.103.308-.175l1.968-1.302a4.434 4.434 0 011.018-.58 4.482 4.482 0 014.83.925 4.473 4.473 0 01.8 4.901 4.427 4.427 0 01-2.002 3.007l-5.153 3.408c-.31.208-.651.37-1.013.48z" />
					</svg>
					<span class="text-sm font-medium text-muted-foreground">SvelteKit</span>
				</div>
				<!-- R2 -->
				<div class="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.01] px-6 py-6 transition-all hover:border-white/[0.08] hover:bg-white/[0.02]">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-sm font-bold text-muted-foreground/60">R2</div>
					<span class="text-sm font-medium text-muted-foreground">R2 Storage</span>
				</div>
				<!-- D1 -->
				<div class="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.01] px-6 py-6 transition-all hover:border-white/[0.08] hover:bg-white/[0.02]">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-sm font-bold text-muted-foreground/60">D1</div>
					<span class="text-sm font-medium text-muted-foreground">D1 Database</span>
				</div>
				<!-- Drizzle -->
				<div class="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.01] px-6 py-6 transition-all hover:border-white/[0.08] hover:bg-white/[0.02] sm:col-span-1 col-span-2">
					<svg class="h-7 w-7 text-muted-foreground/50" viewBox="0 0 24 24" fill="currentColor">
						<path d="M9.142 0L2.598 16.272h5.716L14.858 0h-5.716zM16.285 7.728l-6.543 16.272h5.716l6.543-16.272h-5.716z" />
					</svg>
					<span class="text-sm font-medium text-muted-foreground">Drizzle</span>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ============================================ -->
<!-- CTA                                          -->
<!-- ============================================ -->
<section class="relative border-t border-white/[0.04]">
	<div class="pointer-events-none absolute inset-0">
		<div class="absolute bottom-0 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/6 blur-[120px]"></div>
	</div>

	<div class="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-36 lg:px-8">
		<div class="mx-auto max-w-3xl text-center" use:reveal>
			<div class="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-1.5 text-sm text-muted-foreground">
				Community funded
			</div>
			<h2 class="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
				Free because developers<br class="hidden sm:block" />
				<span class="font-display italic text-muted-foreground">deserve better</span>
			</h2>
			<p class="mt-8 text-lg leading-relaxed text-muted-foreground sm:text-xl">
				Lunaris CDN is funded by donations and kept alive by its community.
				No venture capital, no data harvesting, no rug pull. Just infrastructure that works.
			</p>

			<div class="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
				{#if data.user}
					<a href="/dashboard" class="btn-gradient group inline-flex items-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-semibold text-white">
						Go to Dashboard
						<svg class="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
						</svg>
					</a>
				{:else}
					<a href="/auth/register" class="btn-gradient group inline-flex items-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-semibold text-white">
						Get started for free
						<svg class="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
						</svg>
					</a>
				{/if}
			</div>
		</div>
	</div>
</section>

<!-- ============================================ -->
<!-- FOOTER                                       -->
<!-- ============================================ -->
<footer class="border-t border-white/[0.04]">
	<div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
		<div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
			<!-- Brand -->
			<div class="lg:col-span-2">
				<div class="flex items-center gap-2.5">
					<img src="/logo.png" alt="Lunaris" class="h-12 w-12" />
					<span class="text-base font-semibold">Lunaris CDN</span>
				</div>
				<p class="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
					Free developer CDN. Community funded, forever. Upload your files, share clean URLs, and never worry about egress bills.
				</p>
			</div>

			<!-- Product -->
			<div>
				<h4 class="text-sm font-semibold">Product</h4>
				<ul class="mt-4 space-y-3">
					<li><a href="/auth/register" class="text-sm text-muted-foreground transition-colors hover:text-foreground">Get Started</a></li>
					<li><a href="/auth/login" class="text-sm text-muted-foreground transition-colors hover:text-foreground">Sign In</a></li>
					<li><a href="/dashboard" class="text-sm text-muted-foreground transition-colors hover:text-foreground">Dashboard</a></li>
				</ul>
			</div>

			<!-- Developers -->
			<div>
				<h4 class="text-sm font-semibold">Developers</h4>
				<ul class="mt-4 space-y-3">
					<li><a href="/docs" class="text-sm text-muted-foreground transition-colors hover:text-foreground">API Documentation</a></li>
					<li><a href="/about" class="text-sm text-muted-foreground transition-colors hover:text-foreground">About</a></li>
				</ul>
			</div>

			<!-- Legal -->
			<div>
				<h4 class="text-sm font-semibold">Legal</h4>
				<ul class="mt-4 space-y-3">
					<li><a href="/privacy" class="text-sm text-muted-foreground transition-colors hover:text-foreground">Privacy Policy</a></li>
					<li><a href="/tos" class="text-sm text-muted-foreground transition-colors hover:text-foreground">Terms of Service</a></li>
				</ul>
			</div>
		</div>

		<div class="mt-12 border-t border-white/[0.04] pt-8 text-center">
			<p class="text-xs text-muted-foreground/50">
				&copy; {new Date().getFullYear()} Lunaris CDN. Built with care. Powered by Cloudflare.
			</p>
		</div>
	</div>
</footer>
