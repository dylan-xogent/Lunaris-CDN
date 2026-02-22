<script lang="ts">
	import { formatBytes, formatNumber, formatDate } from '$lib/utils.js';
	import Card from '$lib/components/ui/card.svelte';
	import Button from '$lib/components/ui/button.svelte';

	interface FileData {
		id: string;
		fileName: string;
		filePath: string;
		sizeBytes: number;
		sha256: string;
		downloadCount: number;
	}

	interface Props {
		data: {
			profile: { name: string; username: string };
			project: { name: string; slug: string; description: string | null };
			versions: {
				id: string;
				tag: string;
				isLatest: boolean;
				createdAt: Date;
				files: FileData[];
			}[];
		};
	}

	let { data }: Props = $props();

	let selectedVersion = $state(data.versions.find((v) => v.isLatest)?.id ?? data.versions[0]?.id);
	let copiedUrl = $state<string | null>(null);
	let copiedHash = $state<string | null>(null);

	let currentVersion = $derived(data.versions.find((v) => v.id === selectedVersion));

	function copyUrl(filePath: string, versionTag: string) {
		const url = `https://cdn.lunaris.win/${data.profile.username}/${data.project.slug}/${filePath}?v=${versionTag}`;
		navigator.clipboard.writeText(url);
		copiedUrl = filePath;
		setTimeout(() => (copiedUrl = null), 2000);
	}

	function copyHash(sha256: string) {
		navigator.clipboard.writeText(sha256);
		copiedHash = sha256;
		setTimeout(() => (copiedHash = null), 2000);
	}

	function downloadUrl(filePath: string, versionTag?: string) {
		let url = `https://cdn.lunaris.win/${data.profile.username}/${data.project.slug}/${filePath}`;
		if (versionTag) url += `?v=${versionTag}`;
		return url;
	}
</script>

<svelte:head>
	<title>{data.project.name} by {data.profile.name} - Lunaris CDN</title>
	<meta name="description" content="{data.project.description || `Download ${data.project.name} from Lunaris CDN`}" />
	<meta property="og:title" content="{data.project.name} - Lunaris CDN" />
	<meta property="og:description" content="{data.project.description || `Download ${data.project.name} from Lunaris CDN. ${data.versions.length} version${data.versions.length !== 1 ? 's' : ''} available.`}" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://lunaris.win/{data.profile.username}/{data.project.slug}" />
	<meta property="og:site_name" content="Lunaris CDN" />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="{data.project.name} by {data.profile.name}" />
</svelte:head>

<div class="mx-auto max-w-4xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="text-sm text-muted-foreground mb-3">
			<a href="/{data.profile.username}" class="hover:text-foreground transition-colors">@{data.profile.username}</a>
			<span class="mx-1.5 text-muted-foreground/50">/</span>
			<span>{data.project.slug}</span>
		</div>
		<h1 class="text-3xl font-bold">{data.project.name}</h1>
		{#if data.project.description}
			<p class="mt-2 text-muted-foreground">{data.project.description}</p>
		{/if}
	</div>

	{#if data.versions.length === 0}
		<Card class="p-8 text-center">
			<p class="text-muted-foreground">No versions published yet.</p>
		</Card>
	{:else}
		<!-- Version selector -->
		<div class="mb-6 flex items-center gap-3">
			<label for="version-select" class="text-sm font-medium">Version:</label>
			<select
				id="version-select"
				bind:value={selectedVersion}
				class="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
			>
				{#each data.versions as ver}
					<option value={ver.id}>
						{ver.tag}{ver.isLatest ? ' (latest)' : ''}
					</option>
				{/each}
			</select>
		</div>

		<!-- Files table -->
		{#if currentVersion}
			<Card class="overflow-hidden">
				<div class="p-4 border-b border-border">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<span class="font-mono font-medium">{currentVersion.tag}</span>
							{#if currentVersion.isLatest}
								<span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">latest</span>
							{/if}
						</div>
						<span class="text-xs text-muted-foreground">
							{currentVersion.files.length} file{currentVersion.files.length !== 1 ? 's' : ''} · Published {formatDate(currentVersion.createdAt)}
						</span>
					</div>
				</div>

				{#if currentVersion.files.length === 0}
					<div class="p-8 text-center text-sm text-muted-foreground">
						No files in this version.
					</div>
				{:else}
					<div class="divide-y divide-border">
						{#each currentVersion.files as f}
							<div class="flex items-center justify-between p-4">
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<svg class="h-4 w-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
										</svg>
										<span class="font-mono text-sm font-medium">{f.filePath}</span>
									</div>
									<div class="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
										<span>{formatBytes(f.sizeBytes)}</span>
										<span>{formatNumber(f.downloadCount)} downloads</span>
										<button
											class="hover:text-foreground transition-colors cursor-pointer"
											onclick={() => copyHash(f.sha256)}
										>
											SHA256: <code class="font-mono">{f.sha256.substring(0, 16)}...</code>
											{copiedHash === f.sha256 ? ' (copied!)' : ''}
										</button>
									</div>
								</div>
								<div class="flex items-center gap-2 ml-4">
									<button
										class="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
										onclick={() => copyUrl(f.filePath, currentVersion.tag)}
									>
										{copiedUrl === f.filePath ? 'Copied!' : 'Copy URL'}
									</button>
									<a href={downloadUrl(f.filePath, currentVersion.tag)}>
										<Button size="sm">Download</Button>
									</a>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</Card>
		{/if}
	{/if}
</div>
