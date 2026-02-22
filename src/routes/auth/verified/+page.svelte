<script lang="ts">
	import { onMount } from 'svelte';

	let countdown = $state(5);

	onMount(() => {
		const interval = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				clearInterval(interval);
				window.location.href = '/dashboard';
			}
		}, 1000);
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>Email Verified - Lunaris CDN</title>
</svelte:head>

<div class="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
	<!-- Background -->
	<div class="pointer-events-none absolute inset-0 grid-bg"></div>
	<div class="pointer-events-none absolute top-1/3 left-1/2 h-[400px] w-[500px] -translate-x-1/2 rounded-full bg-primary/6 blur-[100px]"></div>

	<div class="relative w-full max-w-md">
		<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center backdrop-blur-sm">
			<div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald/20 bg-emerald/10">
				<svg class="h-7 w-7 text-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
				</svg>
			</div>

			<h1 class="text-2xl font-bold">Email verified</h1>
			<p class="mt-3 text-sm text-muted-foreground">
				Your account is now active. Redirecting to your dashboard in {countdown}s...
			</p>

			<a
				href="/dashboard"
				class="btn-gradient mt-8 inline-flex h-10 items-center justify-center gap-2 rounded-lg px-6 text-sm font-medium text-white"
			>
				Go to Dashboard
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
				</svg>
			</a>
		</div>
	</div>
</div>
