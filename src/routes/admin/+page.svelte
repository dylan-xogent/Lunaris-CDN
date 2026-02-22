<script lang="ts">
	import { formatBytes, formatNumber, formatDate } from '$lib/utils.js';

	interface Props {
		data: {
			totalUsers: number;
			totalProjects: number;
			totalFiles: number;
			totalStorage: number;
			totalDownloads: number;
			pendingQuotaRequests: number;
			recentUsers: Array<{
				id: string;
				name: string;
				username: string;
				email: string;
				createdAt: Date;
			}>;
			recentFiles: Array<{
				id: string;
				fileName: string;
				sizeBytes: number;
				createdAt: Date;
				projectName: string;
				userName: string;
				username: string;
			}>;
		};
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Admin - Lunaris CDN</title>
</svelte:head>

<div>
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-2xl font-bold">Platform Overview</h1>
		<p class="mt-1 text-sm text-muted-foreground">System-wide statistics and recent activity.</p>
	</div>

	<!-- Stats grid -->
	<div class="mb-8 grid gap-3 sm:grid-cols-3">
		<!-- Total Users -->
		<div class="group rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6 transition-all hover:border-white/[0.08] hover:bg-white/[0.02]">
			<div class="flex items-center justify-between">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10">
					<svg class="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
					</svg>
				</div>
				<a href="/admin/users">
					<svg class="h-4 w-4 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
					</svg>
				</a>
			</div>
			<p class="mt-4 text-3xl font-bold tracking-tight">{formatNumber(data.totalUsers)}</p>
			<p class="mt-1 text-sm text-muted-foreground">Total Users</p>
		</div>

		<!-- Total Projects -->
		<div class="group rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6 transition-all hover:border-white/[0.08] hover:bg-white/[0.02]">
			<div class="flex items-center justify-between">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
					<svg class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
					</svg>
				</div>
				<a href="/admin/projects">
					<svg class="h-4 w-4 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
					</svg>
				</a>
			</div>
			<p class="mt-4 text-3xl font-bold tracking-tight">{formatNumber(data.totalProjects)}</p>
			<p class="mt-1 text-sm text-muted-foreground">Total Projects</p>
		</div>

		<!-- Total Files -->
		<div class="group rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6 transition-all hover:border-white/[0.08] hover:bg-white/[0.02]">
			<div class="flex items-center justify-between">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan/20 bg-cyan/10">
					<svg class="h-5 w-5 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
					</svg>
				</div>
				<a href="/admin/files">
					<svg class="h-4 w-4 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
					</svg>
				</a>
			</div>
			<p class="mt-4 text-3xl font-bold tracking-tight">{formatNumber(data.totalFiles)}</p>
			<p class="mt-1 text-sm text-muted-foreground">Total Files</p>
		</div>

		<!-- Total Storage -->
		<div class="group rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6 transition-all hover:border-white/[0.08] hover:bg-white/[0.02]">
			<div class="flex items-center justify-between">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald/20 bg-emerald/10">
					<svg class="h-5 w-5 text-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
					</svg>
				</div>
			</div>
			<p class="mt-4 text-3xl font-bold tracking-tight">{formatBytes(data.totalStorage)}</p>
			<p class="mt-1 text-sm text-muted-foreground">Total Storage</p>
		</div>

		<!-- Total Downloads -->
		<div class="group rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6 transition-all hover:border-white/[0.08] hover:bg-white/[0.02]">
			<div class="flex items-center justify-between">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan/20 bg-cyan/10">
					<svg class="h-5 w-5 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
					</svg>
				</div>
			</div>
			<p class="mt-4 text-3xl font-bold tracking-tight">{formatNumber(data.totalDownloads)}</p>
			<p class="mt-1 text-sm text-muted-foreground">Total Downloads</p>
		</div>

		<!-- Pending Quota Requests -->
		<a href="/admin/quotas" class="group rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6 transition-all hover:border-white/[0.08] hover:bg-white/[0.02]">
			<div class="flex items-center justify-between">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
					<svg class="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
					</svg>
				</div>
				<div class="flex items-center gap-2">
					{#if data.pendingQuotaRequests > 0}
						<span class="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-xs font-medium text-amber-400">
							{data.pendingQuotaRequests}
						</span>
					{/if}
					<svg class="h-4 w-4 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
					</svg>
				</div>
			</div>
			<p class="mt-4 text-3xl font-bold tracking-tight">{data.pendingQuotaRequests}</p>
			<p class="mt-1 text-sm text-muted-foreground">Pending Quotas</p>
		</a>
	</div>

	<!-- Recent Users -->
	<div class="mb-6 rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-sm font-medium">Recent Users</h2>
			<a href="/admin/users" class="text-xs text-muted-foreground transition-colors hover:text-foreground">View all</a>
		</div>
		{#if data.recentUsers.length === 0}
			<p class="text-sm text-muted-foreground">No users yet.</p>
		{:else}
			<div class="space-y-3">
				{#each data.recentUsers as u}
					<div class="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-3">
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{u.name}</p>
							<p class="truncate text-xs text-muted-foreground">@{u.username} &middot; {u.email}</p>
						</div>
						<p class="shrink-0 pl-4 text-xs text-muted-foreground">{formatDate(new Date(u.createdAt))}</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Recent Uploads -->
	<div class="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-sm font-medium">Recent Uploads</h2>
			<a href="/admin/files" class="text-xs text-muted-foreground transition-colors hover:text-foreground">View all</a>
		</div>
		{#if data.recentFiles.length === 0}
			<p class="text-sm text-muted-foreground">No files uploaded yet.</p>
		{:else}
			<div class="space-y-3">
				{#each data.recentFiles as f}
					<div class="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-3">
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{f.fileName}</p>
							<p class="truncate text-xs text-muted-foreground">{f.projectName} &middot; @{f.username}</p>
						</div>
						<div class="shrink-0 pl-4 text-right">
							<p class="text-xs text-muted-foreground">{formatBytes(f.sizeBytes)}</p>
							<p class="text-xs text-muted-foreground">{formatDate(new Date(f.createdAt))}</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
