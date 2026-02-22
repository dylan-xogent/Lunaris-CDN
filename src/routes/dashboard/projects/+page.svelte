<script lang="ts">
	import { formatBytes, formatNumber, formatDate } from '$lib/utils.js';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';

	interface ProjectWithStats {
		id: string;
		name: string;
		slug: string;
		description: string | null;
		isPublic: boolean;
		createdAt: Date;
		fileCount: number;
		totalDownloads: number;
		totalSize: number;
		versionCount: number;
		role: string;
	}

	const roleBadgeColors: Record<string, string> = {
		owner: 'bg-violet-500/10 text-violet-400',
		admin: 'bg-purple-500/10 text-purple-400',
		editor: 'bg-emerald-500/10 text-emerald-400',
		viewer: 'bg-blue-500/10 text-blue-400'
	};

	interface Props {
		data: {
			projects: ProjectWithStats[];
		};
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Projects - Lunaris CDN</title>
</svelte:head>

<div>
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">Projects</h1>
			<p class="mt-1 text-sm text-muted-foreground">Manage your CDN projects and files.</p>
		</div>
		<a href="/dashboard/projects/new">
			<Button>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				New Project
			</Button>
		</a>
	</div>

	{#if data.projects.length === 0}
		<Card class="p-12 text-center">
			<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
				<svg class="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
				</svg>
			</div>
			<h3 class="text-lg font-medium">No projects yet</h3>
			<p class="mt-2 text-sm text-muted-foreground">Create your first project to start uploading files.</p>
			<a href="/dashboard/projects/new" class="mt-4 inline-block">
				<Button>Create Project</Button>
			</a>
		</Card>
	{:else}
		<div class="grid gap-4">
			{#each data.projects as proj}
				<a href="/dashboard/projects/{proj.slug}" class="block">
					<Card class="p-6 transition-colors hover:border-primary/50">
						<div class="flex items-start justify-between">
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-3">
									<h3 class="text-lg font-semibold">{proj.name}</h3>
									<span class="rounded-full px-2 py-0.5 text-xs {proj.isPublic ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}">
										{proj.isPublic ? 'Public' : 'Private'}
									</span>
									{#if proj.role !== 'owner'}
										<span class="rounded-full px-2 py-0.5 text-xs capitalize {roleBadgeColors[proj.role] ?? 'bg-white/5 text-muted-foreground'}">
											{proj.role}
										</span>
									{/if}
								</div>
								{#if proj.description}
									<p class="mt-1 text-sm text-muted-foreground line-clamp-1">{proj.description}</p>
								{/if}
								<div class="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
									<span>{proj.versionCount} version{proj.versionCount !== 1 ? 's' : ''}</span>
									<span>{proj.fileCount} file{proj.fileCount !== 1 ? 's' : ''}</span>
									<span>{formatNumber(proj.totalDownloads)} download{proj.totalDownloads !== 1 ? 's' : ''}</span>
									<span>{formatBytes(proj.totalSize)}</span>
									<span>Created {formatDate(proj.createdAt)}</span>
								</div>
							</div>
							<svg class="h-5 w-5 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						</div>
					</Card>
				</a>
			{/each}
		</div>
	{/if}
</div>
