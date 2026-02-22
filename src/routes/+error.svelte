<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} | Lunaris CDN</title>
</svelte:head>

<section class="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-4">
	<!-- Grid background -->
	<div class="pointer-events-none absolute inset-0 grid-bg"></div>

	<!-- Glow orbs -->
	<div class="pointer-events-none absolute top-1/4 left-1/2 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/6 blur-[120px]"></div>
	<div class="pointer-events-none absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-destructive/4 blur-[100px]"></div>

	<div class="relative z-10 mx-auto max-w-lg text-center">
		<!-- Status code -->
		<div class="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-1.5 text-sm backdrop-blur-sm">
			<span class="relative flex h-2 w-2">
				<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
				<span class="relative inline-flex h-2 w-2 rounded-full bg-destructive"></span>
			</span>
			<span class="text-muted-foreground">Error</span>
		</div>

		<h1 class="text-8xl font-bold tracking-tighter sm:text-9xl">
			<span class="gradient-text">{page.status}</span>
		</h1>

		<p class="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
			{page.error?.message ?? 'Something went wrong'}
		</p>

		<!-- Divider -->
		<div class="mx-auto mt-8 h-px w-24 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

		<!-- Actions -->
		<div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
			<a
				href="/"
				class="btn-gradient group inline-flex items-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-semibold text-white"
			>
				<!-- Home icon -->
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
				</svg>
				Go Home
			</a>
			<button
				onclick={() => history.back()}
				class="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-8 py-3.5 text-sm font-medium text-muted-foreground transition-all hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-foreground"
			>
				<!-- Arrow left icon -->
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
				</svg>
				Go Back
			</button>
		</div>
	</div>
</section>
