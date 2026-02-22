<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { formatBytes, formatNumber, formatDate } from '$lib/utils.js';
	import Card from '$lib/components/ui/card.svelte';
	import Alert from '$lib/components/ui/alert.svelte';

	let { data } = $props();

	let search = $state('');
	let deletingId = $state<string | null>(null);
	let togglingId = $state<string | null>(null);
	let error = $state('');

	// Selection state
	let selectedIds = $state<Set<string>>(new Set());
	let allSelected = $derived(data.projects.length > 0 && data.projects.every((p: any) => selectedIds.has(p.id)));
	let someSelected = $derived(selectedIds.size > 0);

	// Bulk action state
	let bulkLoading = $state(false);
	let bulkError = $state('');
	let confirmModal = $state<{ action: string; label: string } | null>(null);

	let filteredProjects = $derived(
		data.projects.filter((p: any) => {
			if (!search) return true;
			const q = search.toLowerCase();
			return (
				p.name.toLowerCase().includes(q) ||
				p.ownerUsername.toLowerCase().includes(q)
			);
		})
	);

	function toggleAll() {
		if (allSelected) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(data.projects.map((p: any) => p.id));
		}
	}

	function toggleOne(id: string) {
		const next = new Set(selectedIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		selectedIds = next;
	}

	// Pagination
	function buildPageUrl(p: number) {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('page', String(p));
		return `?${params.toString()}`;
	}

	async function toggleVisibility(project: (typeof data.projects)[0]) {
		togglingId = project.id;
		error = '';
		try {
			const res = await fetch(`/api/v1/admin/projects/${project.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isPublic: !project.isPublic })
			});
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(body?.message ?? 'Failed to update visibility');
			}
			await invalidateAll();
		} catch (e) {
			error = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			togglingId = null;
		}
	}

	async function deleteProject(id: string) {
		error = '';
		try {
			const res = await fetch(`/api/v1/admin/projects/${id}`, {
				method: 'DELETE'
			});
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(body?.message ?? 'Failed to delete project');
			}
			deletingId = null;
			await invalidateAll();
		} catch (e) {
			error = e instanceof Error ? e.message : 'An error occurred';
		}
	}

	function requestBulkAction(action: string, label: string) {
		confirmModal = { action, label };
	}

	async function executeBulkAction(action: string) {
		bulkLoading = true;
		bulkError = '';
		confirmModal = null;

		const ids = Array.from(selectedIds);

		try {
			if (action === 'delete') {
				await Promise.all(
					ids.map((id) =>
						fetch(`/api/v1/admin/projects/${id}`, { method: 'DELETE' }).then((r) => {
							if (!r.ok) throw new Error(`Failed for project ${id}`);
						})
					)
				);
			} else if (action === 'make_public') {
				await Promise.all(
					ids.map((id) =>
						fetch(`/api/v1/admin/projects/${id}`, {
							method: 'PATCH',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ isPublic: true })
						}).then((r) => {
							if (!r.ok) throw new Error(`Failed for project ${id}`);
						})
					)
				);
			} else if (action === 'make_private') {
				await Promise.all(
					ids.map((id) =>
						fetch(`/api/v1/admin/projects/${id}`, {
							method: 'PATCH',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ isPublic: false })
						}).then((r) => {
							if (!r.ok) throw new Error(`Failed for project ${id}`);
						})
					)
				);
			}

			selectedIds = new Set();
			await invalidateAll();
		} catch (e) {
			bulkError = e instanceof Error ? e.message : 'An error occurred during bulk action';
		} finally {
			bulkLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Projects - Admin - Lunaris CDN</title>
</svelte:head>

<!-- Confirmation Modal -->
{#if confirmModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<button
			class="absolute inset-0 bg-black/60 backdrop-blur-sm"
			onclick={() => (confirmModal = null)}
			aria-label="Close modal"
		></button>
		<div class="relative z-10 w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0d0d0f] p-6 shadow-2xl">
			<h3 class="text-base font-semibold">Confirm: {confirmModal.label}</h3>
			<p class="mt-2 text-sm text-muted-foreground">
				This will apply to <strong class="text-foreground">{selectedIds.size}</strong> selected
				{selectedIds.size === 1 ? 'project' : 'projects'}. This action cannot be undone.
			</p>
			<div class="mt-5 flex justify-end gap-2">
				<button
					onclick={() => (confirmModal = null)}
					class="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
				>
					Cancel
				</button>
				<button
					onclick={() => executeBulkAction(confirmModal!.action)}
					class="rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
				>
					Confirm
				</button>
			</div>
		</div>
	</div>
{/if}

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold tracking-tight">Projects</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			{data.total} total project{data.total !== 1 ? 's' : ''}
		</p>
	</div>

	{#if error}
		<Alert variant="destructive">
			<p>{error}</p>
		</Alert>
	{/if}

	{#if bulkError}
		<div class="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
			{bulkError}
		</div>
	{/if}

	<!-- Search -->
	<div class="relative">
		<svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
		</svg>
		<input
			type="text"
			bind:value={search}
			placeholder="Search by project name or owner..."
			class="flex h-10 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/30 focus-visible:bg-white/[0.03]"
		/>
	</div>

	<!-- Bulk action bar -->
	{#if someSelected}
		<div class="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
			<span class="text-sm font-medium text-foreground">
				{selectedIds.size} selected
			</span>
			<div class="ml-auto flex items-center gap-2">
				<button
					onclick={() => requestBulkAction('make_public', 'Make Public')}
					disabled={bulkLoading}
					class="rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground disabled:opacity-50"
				>
					Make Public
				</button>
				<button
					onclick={() => requestBulkAction('make_private', 'Make Private')}
					disabled={bulkLoading}
					class="rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground disabled:opacity-50"
				>
					Make Private
				</button>
				<button
					onclick={() => requestBulkAction('delete', 'Delete Projects')}
					disabled={bulkLoading}
					class="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
				>
					{bulkLoading ? 'Processing...' : 'Delete'}
				</button>
				<button
					onclick={() => (selectedIds = new Set())}
					class="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
					aria-label="Clear selection"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>
	{/if}

	<!-- Table -->
	<Card>
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-white/[0.06]">
						<th class="px-4 py-3 text-left">
							<input
								type="checkbox"
								checked={allSelected}
								onchange={toggleAll}
								class="h-4 w-4 rounded border-white/[0.2] bg-white/[0.04] accent-primary"
								aria-label="Select all"
							/>
						</th>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Project</th>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Owner</th>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Visibility</th>
						<th class="px-4 py-3 text-right font-medium text-muted-foreground">Versions</th>
						<th class="px-4 py-3 text-right font-medium text-muted-foreground">Files</th>
						<th class="px-4 py-3 text-right font-medium text-muted-foreground">Size</th>
						<th class="px-4 py-3 text-right font-medium text-muted-foreground">Downloads</th>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
						<th class="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-white/[0.04]">
					{#each filteredProjects as project (project.id)}
						<tr class="transition-colors hover:bg-white/[0.02] {selectedIds.has(project.id) ? 'bg-primary/[0.03]' : ''}">
							<td class="px-4 py-3">
								<input
									type="checkbox"
									checked={selectedIds.has(project.id)}
									onchange={() => toggleOne(project.id)}
									class="h-4 w-4 rounded border-white/[0.2] bg-white/[0.04] accent-primary"
									aria-label="Select {project.name}"
								/>
							</td>
							<td class="px-4 py-3">
								<div class="font-medium text-foreground">{project.name}</div>
								<div class="text-xs text-muted-foreground">{project.slug}</div>
							</td>
							<td class="px-4 py-3">
								<a href="/admin/users" class="text-primary hover:underline">@{project.ownerUsername}</a>
							</td>
							<td class="px-4 py-3">
								{#if project.isPublic}
									<span class="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
										Public
									</span>
								{:else}
									<span class="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 ring-1 ring-inset ring-amber-500/20">
										Private
									</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatNumber(project.versionCount)}</td>
							<td class="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatNumber(project.fileCount)}</td>
							<td class="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatBytes(project.totalSize)}</td>
							<td class="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatNumber(project.totalDownloads)}</td>
							<td class="px-4 py-3 text-muted-foreground">{formatDate(project.createdAt)}</td>
							<td class="px-4 py-3">
								<div class="flex items-center justify-end gap-1">
									<!-- Toggle visibility -->
									<button
										onclick={() => toggleVisibility(project)}
										disabled={togglingId === project.id}
										class="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground disabled:opacity-50"
										title={project.isPublic ? 'Make private' : 'Make public'}
									>
										{#if project.isPublic}
											<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
												<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
												<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
											</svg>
										{:else}
											<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
												<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
											</svg>
										{/if}
									</button>

									<!-- Delete -->
									{#if deletingId === project.id}
										<div class="flex items-center gap-1">
											<button
												onclick={() => deleteProject(project.id)}
												class="rounded-lg px-2 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
											>
												Confirm
											</button>
											<button
												onclick={() => (deletingId = null)}
												class="rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-white/[0.06]"
											>
												Cancel
											</button>
										</div>
									{:else}
										<button
											onclick={() => (deletingId = project.id)}
											class="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
											title="Delete project"
										>
											<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
												<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
											</svg>
										</button>
									{/if}
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="10" class="px-4 py-8 text-center text-muted-foreground">
								{#if search}
									No projects matching "{search}"
								{:else}
									No projects yet
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Card>

	<!-- Pagination -->
	{#if data.totalPages > 1}
		<div class="flex items-center justify-between">
			<p class="text-sm text-muted-foreground">
				Showing {(data.page - 1) * data.limit + 1}–{Math.min(data.page * data.limit, data.total)} of {data.total} projects
			</p>
			<div class="flex items-center gap-1">
				<a
					href={buildPageUrl(data.page - 1)}
					aria-disabled={data.page <= 1}
					class="inline-flex h-8 items-center gap-1 rounded-lg border border-white/[0.06] px-3 text-xs text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground {data.page <= 1 ? 'pointer-events-none opacity-40' : ''}"
				>
					<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
					</svg>
					Previous
				</a>
				<span class="px-3 text-xs text-muted-foreground">
					Page {data.page} of {data.totalPages}
				</span>
				<a
					href={buildPageUrl(data.page + 1)}
					aria-disabled={data.page >= data.totalPages}
					class="inline-flex h-8 items-center gap-1 rounded-lg border border-white/[0.06] px-3 text-xs text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground {data.page >= data.totalPages ? 'pointer-events-none opacity-40' : ''}"
				>
					Next
					<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
					</svg>
				</a>
			</div>
		</div>
	{:else if !search}
		<p class="text-center text-xs text-muted-foreground">
			{data.total} {data.total === 1 ? 'project' : 'projects'} total
		</p>
	{/if}
</div>
