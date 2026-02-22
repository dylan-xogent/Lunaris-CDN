<script lang="ts">
	import { goto } from '$app/navigation';
	import FileUploader from '$lib/components/projects/FileUploader.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Card from '$lib/components/ui/card.svelte';

	interface Props {
		data: {
			project: { name: string; slug: string };
			versions: { id: string; tag: string; isLatest: boolean }[];
			selectedVersion: string;
		};
	}

	let { data }: Props = $props();
	let selectedVersion = $state(data.selectedVersion);

	function handleComplete() {
		goto(`/dashboard/projects/${data.project.slug}`);
	}
</script>

<svelte:head>
	<title>Upload Files - {data.project.name} - Lunaris CDN</title>
</svelte:head>

<div class="mx-auto max-w-2xl">
	<div class="mb-8">
		<a
			href="/dashboard/projects/{data.project.slug}"
			class="text-sm text-muted-foreground hover:text-foreground transition-colors"
		>
			&larr; Back to {data.project.name}
		</a>
		<h1 class="mt-4 text-2xl font-bold">Upload Files</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Add files to <strong>{data.project.name}</strong>
		</p>
	</div>

	<!-- Version selector -->
	<Card class="p-4 mb-6">
		<label for="version" class="block text-sm font-medium mb-2">Upload to version:</label>
		<select
			id="version"
			bind:value={selectedVersion}
			class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
		>
			{#each data.versions as ver}
				<option value={ver.tag}>
					{ver.tag}{ver.isLatest ? ' (latest)' : ''}
				</option>
			{/each}
		</select>
	</Card>

	<!-- Uploader -->
	<FileUploader
		projectSlug={data.project.slug}
		versionTag={selectedVersion}
		onuploadcomplete={handleComplete}
	>
		<a href="/dashboard/projects/{data.project.slug}">
			<Button variant="outline">Done</Button>
		</a>
	</FileUploader>
</div>
