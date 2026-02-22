<script lang="ts">
	import { formatNumber, formatDate, formatBytes } from '$lib/utils.js';
	import Card from '$lib/components/ui/card.svelte';

	interface Props {
		data: {
			profile: {
				name: string;
				username: string;
				image: string | null;
				createdAt: Date;
			};
			projects: {
				name: string;
				slug: string;
				description: string | null;
				totalDownloads: number;
				totalSize: number;
				fileCount: number;
				versionCount: number;
				createdAt: Date;
			}[];
		};
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>{data.profile.name} (@{data.profile.username}) - Lunaris CDN</title>
	<meta name="description" content="Projects by {data.profile.name} on Lunaris CDN. {data.projects.length} public project{data.projects.length !== 1 ? 's' : ''}." />
	<meta property="og:title" content="{data.profile.name} (@{data.profile.username}) - Lunaris CDN" />
	<meta property="og:description" content="Projects by {data.profile.name} on Lunaris CDN." />
	<meta property="og:type" content="profile" />
	<meta property="og:url" content="https://lunaris.win/{data.profile.username}" />
	<meta property="og:site_name" content="Lunaris CDN" />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="{data.profile.name} - Lunaris CDN" />
</svelte:head>

<div class="mx-auto max-w-4xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
	<!-- Profile header -->
	<div class="mb-10 flex items-center gap-5">
		{#if data.profile.image}
			<img src={data.profile.image} alt={data.profile.name} class="h-20 w-20 rounded-full ring-2 ring-border" />
		{:else}
			<div class="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-3xl font-bold text-white ring-2 ring-border">
				{data.profile.name.charAt(0).toUpperCase()}
			</div>
		{/if}
		<div>
			<h1 class="text-2xl font-bold">{data.profile.name}</h1>
			<p class="text-sm text-muted-foreground">@{data.profile.username}</p>
			<p class="mt-1 text-xs text-muted-foreground">Joined {formatDate(data.profile.createdAt)} · {data.projects.length} project{data.projects.length !== 1 ? 's' : ''}</p>
		</div>
	</div>

	<!-- Projects -->
	<h2 class="mb-4 text-lg font-semibold">Public Projects</h2>
	{#if data.projects.length === 0}
		<Card class="p-8 text-center">
			<p class="text-muted-foreground">No public projects yet.</p>
		</Card>
	{:else}
		<div class="grid gap-4">
			{#each data.projects as proj}
				<a href="/{data.profile.username}/{proj.slug}" class="block group">
					<Card class="p-5 transition-all hover:border-primary/50 hover:bg-white/[0.01]">
						<div class="flex items-center justify-between">
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2.5">
									<h3 class="font-semibold truncate">{proj.name}</h3>
									{#if proj.versionCount > 0}
										<span class="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[0.6875rem] text-primary">
											{proj.versionCount} version{proj.versionCount !== 1 ? 's' : ''}
										</span>
									{/if}
								</div>
								{#if proj.description}
									<p class="mt-1.5 text-sm text-muted-foreground line-clamp-2">{proj.description}</p>
								{/if}
								<div class="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
									<span class="flex items-center gap-1">
										<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
										</svg>
										{formatNumber(proj.totalDownloads)} downloads
									</span>
									{#if proj.fileCount > 0}
										<span>{proj.fileCount} file{proj.fileCount !== 1 ? 's' : ''}</span>
									{/if}
									{#if proj.totalSize > 0}
										<span>{formatBytes(proj.totalSize)}</span>
									{/if}
								</div>
							</div>
							<svg class="h-5 w-5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						</div>
					</Card>
				</a>
			{/each}
		</div>
	{/if}
</div>
