<script lang="ts">
	import { goto } from '$app/navigation';
	import { slugify } from '$lib/utils.js';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import Alert from '$lib/components/ui/alert.svelte';

	let name = $state('');
	let description = $state('');
	let isPublic = $state(true);
	let error = $state('');
	let loading = $state(false);

	let slug = $derived(slugify(name));

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			const res = await fetch('/api/v1/projects', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name, description: description || undefined, isPublic })
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error || 'Failed to create project.';
			} else {
				goto(`/dashboard/projects/${data.project.slug}`);
			}
		} catch (err) {
			error = 'An unexpected error occurred.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>New Project - Lunaris CDN</title>
</svelte:head>

<div class="mx-auto max-w-lg">
	<div class="mb-8">
		<a href="/dashboard/projects" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
			&larr; Back to projects
		</a>
		<h1 class="mt-4 text-2xl font-bold">Create a new project</h1>
		<p class="mt-1 text-sm text-muted-foreground">A project groups your files and versions under a single CDN namespace.</p>
	</div>

	{#if error}
		<Alert variant="destructive" class="mb-6">
			{error}
		</Alert>
	{/if}

	<Card class="p-6">
		<form onsubmit={handleSubmit} class="space-y-6">
			<div class="space-y-2">
				<Label for="name">Project Name</Label>
				<Input
					id="name"
					name="name"
					placeholder="My Cool Library"
					bind:value={name}
					required
				/>
				{#if slug}
					<p class="text-xs text-muted-foreground">
						URL slug: <span class="font-mono text-foreground">{slug}</span>
					</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="description">Description <span class="text-muted-foreground">(optional)</span></Label>
				<Input
					id="description"
					name="description"
					placeholder="A brief description of your project"
					bind:value={description}
				/>
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
						<div class="mt-0.5 text-xs text-muted-foreground">Anyone can download files</div>
					</button>
					<button
						type="button"
						class="flex-1 rounded-lg border p-3 text-left text-sm transition-colors cursor-pointer {!isPublic ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}"
						onclick={() => (isPublic = false)}
					>
						<div class="font-medium">Private</div>
						<div class="mt-0.5 text-xs text-muted-foreground">Only you can access files</div>
					</button>
				</div>
			</div>

			<div class="flex gap-3 pt-2">
				<a href="/dashboard/projects" class="flex-1">
					<Button variant="outline" class="w-full">Cancel</Button>
				</a>
				<Button type="submit" class="flex-1" disabled={loading || !name.trim()}>
					{#if loading}
						Creating...
					{:else}
						Create Project
					{/if}
				</Button>
			</div>
		</form>
	</Card>
</div>
