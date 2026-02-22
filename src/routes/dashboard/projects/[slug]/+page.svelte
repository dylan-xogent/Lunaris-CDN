<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { formatBytes, formatNumber, formatDate } from '$lib/utils.js';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import Alert from '$lib/components/ui/alert.svelte';

	interface FileData {
		id: string;
		fileName: string;
		filePath: string;
		sizeBytes: number;
		mimeType: string | null;
		sha256: string;
		downloadCount: number;
		createdAt: Date;
	}

	interface VersionWithStats {
		id: string;
		tag: string;
		isLatest: boolean;
		createdAt: Date;
		files: FileData[];
		fileCount: number;
		totalSize: number;
		totalDownloads: number;
	}

	interface Props {
		data: {
			user: { username: string };
			project: {
				id: string;
				name: string;
				slug: string;
				description: string | null;
				isPublic: boolean;
			};
			versions: VersionWithStats[];
			stats: { totalFiles: number; totalDownloads: number; totalSize: number };
			memberCount: number;
			currentUserRole: string | null;
		};
	}

	let { data }: Props = $props();

	const canEditProject = ['owner', 'admin', 'editor'].includes(data.currentUserRole ?? '');

	let newVersionTag = $state('');
	let versionError = $state('');
	let versionLoading = $state(false);
	let expandedVersion = $state<string | null>(data.versions[0]?.id ?? null);
	let deleteConfirm = $state<string | null>(null);
	let deleteFileConfirm = $state<string | null>(null);
	let renamingFile = $state<string | null>(null);
	let renameValue = $state('');
	let copiedUrl = $state<string | null>(null);

	async function createVersion() {
		if (!newVersionTag.trim()) return;
		versionError = '';
		versionLoading = true;

		try {
			const res = await fetch(`/api/v1/projects/${data.project.slug}/versions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tag: newVersionTag.trim() })
			});

			const result = await res.json();
			if (!res.ok) {
				versionError = result.error;
			} else {
				newVersionTag = '';
				await invalidateAll();
			}
		} catch {
			versionError = 'Failed to create version.';
		} finally {
			versionLoading = false;
		}
	}

	async function setLatest(tag: string) {
		await fetch(`/api/v1/projects/${data.project.slug}/versions/${tag}/set-latest`, {
			method: 'POST'
		});
		await invalidateAll();
	}

	async function deleteVersion(tag: string) {
		try {
			const res = await fetch(`/api/v1/projects/${data.project.slug}/versions/${tag}`, {
				method: 'DELETE'
			});
			if (!res.ok) {
				const result = await res.json();
				versionError = result.error || 'Failed to delete version.';
			}
		} catch {
			versionError = 'Failed to delete version.';
		}
		deleteConfirm = null;
		await invalidateAll();
	}

	function copyUrl(filePath: string) {
		const url = `https://cdn.lunaris.win/${data.user.username}/${data.project.slug}/${filePath}`;
		navigator.clipboard.writeText(url);
		copiedUrl = filePath;
		setTimeout(() => (copiedUrl = null), 2000);
	}

	async function deleteFile(fileId: string, slug: string) {
		try {
			const res = await fetch(`/api/v1/projects/${slug}/files/${fileId}`, {
				method: 'DELETE'
			});
			if (!res.ok) {
				const result = await res.json();
				versionError = result.error || 'Failed to delete file.';
			}
		} catch {
			versionError = 'Failed to delete file.';
		}
		deleteFileConfirm = null;
		await invalidateAll();
	}

	async function renameFile(fileId: string, slug: string) {
		try {
			const res = await fetch(`/api/v1/projects/${slug}/files/${fileId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ filePath: renameValue })
			});
			if (!res.ok) {
				const result = await res.json();
				versionError = result.error || 'Failed to rename file.';
			}
		} catch {
			versionError = 'Failed to rename file.';
		}
		renamingFile = null;
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>{data.project.name} - Lunaris CDN</title>
</svelte:head>

<div>
	<!-- Header -->
	<div class="mb-8">
		<a href="/dashboard/projects" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
			&larr; Back to projects
		</a>
		<div class="mt-4 flex items-start justify-between">
			<div>
				<div class="flex items-center gap-3">
					<h1 class="text-2xl font-bold">{data.project.name}</h1>
					<span class="rounded-full px-2 py-0.5 text-xs {data.project.isPublic ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}">
						{data.project.isPublic ? 'Public' : 'Private'}
					</span>
				</div>
				{#if data.project.description}
					<p class="mt-1 text-sm text-muted-foreground">{data.project.description}</p>
				{/if}
			</div>
			<div class="flex items-center gap-2">
				<a href="/dashboard/projects/{data.project.slug}/members">
					<Button variant="outline" size="sm">
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						Members
						{#if data.memberCount > 0}
							<span class="ml-1 rounded-full bg-white/[0.08] px-1.5 py-0.5 text-xs">
								{data.memberCount + 1}
							</span>
						{/if}
					</Button>
				</a>
				{#if data.currentUserRole === 'owner'}
					<a href="/dashboard/projects/{data.project.slug}/settings">
						<Button variant="outline" size="sm">
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							Settings
						</Button>
					</a>
				{/if}
			</div>
		</div>
	</div>

	<!-- Stats -->
	<div class="grid grid-cols-3 gap-4 mb-8">
		<Card class="p-4 text-center">
			<p class="text-2xl font-bold">{data.versions.length}</p>
			<p class="text-xs text-muted-foreground">Versions</p>
		</Card>
		<Card class="p-4 text-center">
			<p class="text-2xl font-bold">{formatNumber(data.stats.totalDownloads)}</p>
			<p class="text-xs text-muted-foreground">Downloads</p>
		</Card>
		<Card class="p-4 text-center">
			<p class="text-2xl font-bold">{formatBytes(data.stats.totalSize)}</p>
			<p class="text-xs text-muted-foreground">Storage</p>
		</Card>
	</div>

	<!-- Create Version -->
	<Card class="p-6 mb-8">
		<h2 class="text-sm font-medium mb-3">Add Version</h2>
		{#if versionError}
			<Alert variant="destructive" class="mb-3">{versionError}</Alert>
		{/if}
		<form onsubmit={(e) => { e.preventDefault(); createVersion(); }} class="flex gap-3">
			<Input
				placeholder="e.g. 1.0.0, v2.3.1, nightly"
				bind:value={newVersionTag}
				class="flex-1"
			/>
			<Button type="submit" disabled={versionLoading || !newVersionTag.trim()}>
				{versionLoading ? 'Creating...' : 'Create'}
			</Button>
		</form>
	</Card>

	<!-- Versions -->
	{#if data.versions.length === 0}
		<Card class="p-8 text-center">
			<p class="text-muted-foreground">No versions yet. Create one above to start uploading files.</p>
		</Card>
	{:else}
		<div class="space-y-4">
			{#each data.versions as ver}
				<Card class="overflow-hidden">
					<!-- Version header -->
					<button
						class="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors cursor-pointer"
						onclick={() => (expandedVersion = expandedVersion === ver.id ? null : ver.id)}
					>
						<div class="flex items-center gap-3">
							<svg class="h-4 w-4 text-muted-foreground transition-transform {expandedVersion === ver.id ? 'rotate-90' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
							<span class="font-mono font-medium">{ver.tag}</span>
							{#if ver.isLatest}
								<span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">latest</span>
							{/if}
						</div>
						<div class="flex items-center gap-4 text-xs text-muted-foreground">
							<span>{ver.fileCount} file{ver.fileCount !== 1 ? 's' : ''}</span>
							<span>{formatBytes(ver.totalSize)}</span>
							<span>{formatNumber(ver.totalDownloads)} downloads</span>
							<span>{formatDate(ver.createdAt)}</span>
						</div>
					</button>

					<!-- Expanded content -->
					{#if expandedVersion === ver.id}
						<div class="border-t border-border p-4">
							<!-- Version actions -->
							<div class="flex gap-2 mb-4">
								<a href="/dashboard/projects/{data.project.slug}/upload?version={ver.tag}">
									<Button size="sm">
										<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
										</svg>
										Upload Files
									</Button>
								</a>
								{#if !ver.isLatest}
									<Button variant="outline" size="sm" onclick={() => setLatest(ver.tag)}>
										Set as Latest
									</Button>
								{/if}
								{#if deleteConfirm === ver.id}
									<Button variant="destructive" size="sm" onclick={() => deleteVersion(ver.tag)}>
										Confirm Delete
									</Button>
									<Button variant="outline" size="sm" onclick={() => (deleteConfirm = null)}>
										Cancel
									</Button>
								{:else}
									<Button variant="ghost" size="sm" onclick={() => (deleteConfirm = ver.id)}>
										<svg class="h-3.5 w-3.5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									</Button>
								{/if}
							</div>

							<!-- File list -->
							{#if ver.files.length === 0}
								<p class="text-sm text-muted-foreground py-4 text-center">No files uploaded to this version yet.</p>
							{:else}
								<div class="overflow-x-auto">
									<table class="w-full text-sm">
										<thead>
											<tr class="border-b border-border text-left text-xs text-muted-foreground">
												<th class="pb-2 font-medium">File</th>
												<th class="pb-2 font-medium">Size</th>
												<th class="pb-2 font-medium">Downloads</th>
												<th class="pb-2 font-medium">SHA256</th>
												<th class="pb-2 font-medium">URL</th>
												{#if canEditProject}
													<th class="pb-2 font-medium">Actions</th>
												{/if}
											</tr>
										</thead>
										<tbody>
											{#each ver.files as f}
												<tr class="border-b border-border/50 last:border-0">
													<td class="py-2.5 font-mono text-xs">
														{#if renamingFile === f.id}
															<form class="flex items-center gap-1" onsubmit={(e) => { e.preventDefault(); renameFile(f.id, data.project.slug); }}>
																<input
																	type="text"
																	class="rounded border border-border bg-background px-1.5 py-0.5 text-xs font-mono w-48 focus:outline-none focus:ring-1 focus:ring-primary"
																	bind:value={renameValue}
																/>
																<button type="submit" class="rounded px-1.5 py-0.5 text-xs text-primary hover:bg-primary/10 transition-colors cursor-pointer">Save</button>
																<button type="button" class="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted transition-colors cursor-pointer" onclick={() => (renamingFile = null)}>Cancel</button>
															</form>
														{:else}
															{f.filePath}
														{/if}
													</td>
													<td class="py-2.5 text-muted-foreground">{formatBytes(f.sizeBytes)}</td>
													<td class="py-2.5 text-muted-foreground">{formatNumber(f.downloadCount)}</td>
													<td class="py-2.5">
														<code class="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
															{f.sha256.substring(0, 12)}...
														</code>
													</td>
													<td class="py-2.5">
														<button
															class="rounded-md px-2 py-1 text-xs text-primary hover:bg-primary/10 transition-colors cursor-pointer"
															onclick={() => copyUrl(f.filePath)}
														>
															{copiedUrl === f.filePath ? 'Copied!' : 'Copy URL'}
														</button>
													</td>
													{#if canEditProject}
														<td class="py-2.5">
															{#if deleteFileConfirm === f.id}
																<div class="flex items-center gap-1">
																	<button
																		class="rounded-md px-2 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
																		onclick={() => deleteFile(f.id, data.project.slug)}
																	>
																		Confirm
																	</button>
																	<button
																		class="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
																		onclick={() => (deleteFileConfirm = null)}
																	>
																		Cancel
																	</button>
																</div>
															{:else}
																<div class="flex items-center gap-1">
																	<!-- Rename button -->
																	<button
																		class="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
																		title="Rename file"
																		onclick={() => { renamingFile = f.id; renameValue = f.filePath; }}
																	>
																		<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
																			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
																		</svg>
																	</button>
																	<!-- Delete button -->
																	<button
																		class="rounded-md p-1 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
																		title="Delete file"
																		onclick={() => (deleteFileConfirm = f.id)}
																	>
																		<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
																			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
																		</svg>
																	</button>
																</div>
															{/if}
														</td>
													{/if}
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{/if}
						</div>
					{/if}
				</Card>
			{/each}
		</div>
	{/if}
</div>
