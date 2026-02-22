<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { slugify } from '$lib/utils.js';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import Alert from '$lib/components/ui/alert.svelte';

	interface Props {
		data: {
			project: {
				id: string;
				name: string;
				slug: string;
				description: string | null;
				isPublic: boolean;
			};
		};
	}

	let { data }: Props = $props();

	let name = $state(data.project.name);
	let description = $state(data.project.description ?? '');
	let isPublic = $state(data.project.isPublic);
	let error = $state('');
	let success = $state('');
	let loading = $state(false);
	let deleteConfirm = $state(false);
	let deleteLoading = $state(false);

	let slug = $derived(slugify(name));

	async function handleSave(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		success = '';
		loading = true;

		try {
			const res = await fetch(`/api/v1/projects/${data.project.slug}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, description: description || undefined, isPublic })
			});

			const result = await res.json();

			if (!res.ok) {
				error = result.error;
			} else {
				success = 'Project updated successfully.';
				// If slug changed, redirect to new URL
				if (result.project.slug !== data.project.slug) {
					goto(`/dashboard/projects/${result.project.slug}/settings`);
				} else {
					await invalidateAll();
				}
			}
		} catch {
			error = 'Failed to update project.';
		} finally {
			loading = false;
		}
	}

	async function handleDelete() {
		deleteLoading = true;

		try {
			const res = await fetch(`/api/v1/projects/${data.project.slug}`, {
				method: 'DELETE'
			});

			if (res.ok) {
				goto('/dashboard/projects');
			} else {
				const result = await res.json();
				error = result.error || 'Failed to delete project.';
			}
		} catch {
			error = 'Failed to delete project.';
		} finally {
			deleteLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Settings - {data.project.name} - Lunaris CDN</title>
</svelte:head>

<div class="mx-auto max-w-lg">
	<div class="mb-8">
		<a href="/dashboard/projects/{data.project.slug}" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
			&larr; Back to {data.project.name}
		</a>
		<h1 class="mt-4 text-2xl font-bold">Project Settings</h1>
	</div>

	{#if error}
		<Alert variant="destructive" class="mb-6">{error}</Alert>
	{/if}
	{#if success}
		<Alert variant="success" class="mb-6">{success}</Alert>
	{/if}

	<!-- General settings -->
	<Card class="p-6 mb-6">
		<h2 class="text-lg font-semibold mb-4">General</h2>
		<form onsubmit={handleSave} class="space-y-4">
			<div class="space-y-2">
				<Label for="name">Project Name</Label>
				<Input id="name" bind:value={name} required />
				{#if slug && slug !== data.project.slug}
					<p class="text-xs text-yellow-400">
						URL will change to: cdn.lunaris.win/.../
						<span class="font-mono">{slug}</span>/...
					</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="description">Description</Label>
				<Input id="description" bind:value={description} placeholder="Optional description" />
			</div>

			<div class="space-y-2">
				<Label>Visibility</Label>
				<div class="flex gap-3">
					<button
						type="button"
						class="flex-1 rounded-lg border p-3 text-left text-sm transition-colors cursor-pointer {isPublic ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}"
						onclick={() => (isPublic = true)}
					>
						<div class="font-medium">Public</div>
					</button>
					<button
						type="button"
						class="flex-1 rounded-lg border p-3 text-left text-sm transition-colors cursor-pointer {!isPublic ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}"
						onclick={() => (isPublic = false)}
					>
						<div class="font-medium">Private</div>
					</button>
				</div>
			</div>

			<Button type="submit" disabled={loading}>
				{loading ? 'Saving...' : 'Save Changes'}
			</Button>
		</form>
	</Card>

	<!-- Danger zone -->
	<Card class="border-destructive/30 p-6">
		<h2 class="text-lg font-semibold text-destructive mb-2">Danger Zone</h2>
		<p class="text-sm text-muted-foreground mb-4">
			Deleting this project will permanently remove all versions, files, and download history. This cannot be undone.
		</p>
		{#if deleteConfirm}
			<div class="flex gap-3">
				<Button variant="destructive" onclick={handleDelete} disabled={deleteLoading}>
					{deleteLoading ? 'Deleting...' : 'Yes, Delete Project'}
				</Button>
				<Button variant="outline" onclick={() => (deleteConfirm = false)}>Cancel</Button>
			</div>
		{:else}
			<Button variant="destructive" onclick={() => (deleteConfirm = true)}>
				Delete Project
			</Button>
		{/if}
	</Card>
</div>
