<script lang="ts">
	import { formatBytes, formatNumber } from '$lib/utils.js';

	interface Props {
		data: {
			user: { name: string; username: string };
			quota: { used: number; limit: number };
			projectCount: number;
			totalDownloads: number;
		};
	}

	let { data }: Props = $props();

	let usagePercent = $derived(
		data.quota.limit > 0 ? Math.min(100, (data.quota.used / data.quota.limit) * 100) : 0
	);

	let usageColor = $derived(
		usagePercent > 90 ? 'from-red-500 to-red-400' :
		usagePercent > 70 ? 'from-amber-500 to-yellow-400' :
		'from-primary to-cyan'
	);
</script>

<svelte:head>
	<title>Dashboard - Lunaris CDN</title>
</svelte:head>

<div>
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-2xl font-bold">Welcome back, {data.user.name}</h1>
		<p class="mt-1 text-sm text-muted-foreground">Here's your Lunaris CDN overview.</p>
	</div>

	<!-- Stats grid -->
	<div class="mb-6 grid gap-3 sm:grid-cols-3">
		<!-- Projects -->
		<div class="group rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6 transition-all hover:border-white/[0.08] hover:bg-white/[0.02]">
			<div class="flex items-center justify-between">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
					<svg class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
					</svg>
				</div>
				<svg class="h-4 w-4 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
				</svg>
			</div>
			<p class="mt-4 text-3xl font-bold tracking-tight">{data.projectCount}</p>
			<p class="mt-1 text-sm text-muted-foreground">Projects</p>
		</div>

		<!-- Downloads -->
		<div class="group rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6 transition-all hover:border-white/[0.08] hover:bg-white/[0.02]">
			<div class="flex items-center justify-between">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan/20 bg-cyan/10">
					<svg class="h-5 w-5 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
					</svg>
				</div>
				<svg class="h-4 w-4 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
				</svg>
			</div>
			<p class="mt-4 text-3xl font-bold tracking-tight">{formatNumber(data.totalDownloads)}</p>
			<p class="mt-1 text-sm text-muted-foreground">Total Downloads</p>
		</div>

		<!-- Storage -->
		<div class="group rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6 transition-all hover:border-white/[0.08] hover:bg-white/[0.02]">
			<div class="flex items-center justify-between">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald/20 bg-emerald/10">
					<svg class="h-5 w-5 text-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
					</svg>
				</div>
			</div>
			<p class="mt-4 text-3xl font-bold tracking-tight">{formatBytes(data.quota.used)}</p>
			<p class="mt-1 text-sm text-muted-foreground">of {formatBytes(data.quota.limit)}</p>
		</div>
	</div>

	<!-- Storage bar -->
	<div class="mb-6 rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-sm font-medium">Storage Usage</h2>
			<span class="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-xs text-muted-foreground">{usagePercent.toFixed(1)}%</span>
		</div>
		<div class="h-2 w-full overflow-hidden rounded-full bg-white/[0.04]">
			<div
				class="h-full rounded-full bg-gradient-to-r {usageColor} transition-all duration-700"
				style="width: {usagePercent}%"
			></div>
		</div>
		<div class="mt-3 flex justify-between text-xs text-muted-foreground">
			<span>{formatBytes(data.quota.used)} used</span>
			<span>{formatBytes(data.quota.limit - data.quota.used)} remaining</span>
		</div>
	</div>

	<!-- Quick actions -->
	<div class="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6">
		<h2 class="mb-4 text-sm font-medium">Quick Actions</h2>
		<div class="flex flex-wrap gap-3">
			<a
				href="/dashboard/projects/new"
				class="btn-gradient group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
				New Project
			</a>
			<a
				href="/dashboard/api-keys"
				class="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-white/[0.04] hover:text-foreground hover:border-white/[0.12]"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
				</svg>
				API Keys
			</a>
			<a
				href="/{data.user.username}"
				class="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-white/[0.04] hover:text-foreground hover:border-white/[0.12]"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
				</svg>
				Public Profile
			</a>
		</div>
	</div>
</div>
