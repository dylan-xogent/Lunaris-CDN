<script lang="ts">
	import { authClient } from '$lib/auth-client.js';
	import { formatDate } from '$lib/utils.js';
	import Card from '$lib/components/ui/card.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Alert from '$lib/components/ui/alert.svelte';

	interface ApiKey {
		id: string;
		name: string | null;
		start: string;
		prefix: string | null;
		enabled: boolean;
		createdAt: Date;
		expiresAt: Date | null;
		lastRequest: Date | null;
	}

	let keys = $state<ApiKey[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Create form
	let newKeyName = $state('');
	let creating = $state(false);
	let createdKey = $state<string | null>(null);
	let copiedKey = $state(false);

	// Delete confirmation
	let deletingId = $state<string | null>(null);

	async function loadKeys() {
		loading = true;
		error = null;
		try {
			const result = await authClient.apiKey.list();
			if (result.data) {
				keys = result.data as ApiKey[];
			}
		} catch {
			error = 'Failed to load API keys.';
		} finally {
			loading = false;
		}
	}

	async function createKey() {
		if (!newKeyName.trim()) return;

		creating = true;
		error = null;
		createdKey = null;

		try {
			const result = await authClient.apiKey.create({
				name: newKeyName.trim(),
				prefix: 'lnrs'
			});
			if (result.data?.key) {
				createdKey = result.data.key;
				newKeyName = '';
				await loadKeys();
			}
		} catch {
			error = 'Failed to create API key.';
		} finally {
			creating = false;
		}
	}

	async function deleteKey(id: string) {
		try {
			await authClient.apiKey.delete({ keyId: id });
			keys = keys.filter((k) => k.id !== id);
			deletingId = null;
		} catch {
			error = 'Failed to delete API key.';
		}
	}

	function copyKey() {
		if (createdKey) {
			navigator.clipboard.writeText(createdKey);
			copiedKey = true;
			setTimeout(() => (copiedKey = false), 2000);
		}
	}

	// Load keys on mount
	$effect(() => {
		loadKeys();
	});
</script>

<svelte:head>
	<title>API Keys - Lunaris CDN</title>
</svelte:head>

<div>
	<div class="mb-8">
		<h1 class="text-2xl font-bold">API Keys</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Create and manage API keys for programmatic access to your projects.
		</p>
	</div>

	{#if error}
		<Alert variant="destructive" class="mb-6">{error}</Alert>
	{/if}

	<!-- Newly created key banner -->
	{#if createdKey}
		<Alert variant="success" class="mb-6">
			<div>
				<p class="font-medium mb-2">API key created! Copy it now — it won't be shown again.</p>
				<div class="flex items-center gap-2">
					<code class="flex-1 rounded bg-background px-3 py-2 font-mono text-sm break-all border border-border">
						{createdKey}
					</code>
					<Button size="sm" onclick={copyKey}>
						{copiedKey ? 'Copied!' : 'Copy'}
					</Button>
				</div>
			</div>
		</Alert>
	{/if}

	<!-- Create new key -->
	<Card class="p-6 mb-6">
		<h2 class="text-lg font-semibold mb-4">Create API Key</h2>
		<form onsubmit={createKey} class="flex items-end gap-3">
			<div class="flex-1">
				<Label for="key-name">Key Name</Label>
				<Input
					id="key-name"
					bind:value={newKeyName}
					placeholder="e.g. CI/CD Pipeline, CLI Tool"
					class="mt-1.5"
				/>
			</div>
			<Button type="submit" disabled={creating || !newKeyName.trim()}>
				{creating ? 'Creating...' : 'Create Key'}
			</Button>
		</form>
	</Card>

	<!-- Keys list -->
	<Card class="overflow-hidden">
		<div class="p-4 border-b border-border">
			<h2 class="font-semibold">Your API Keys</h2>
		</div>

		{#if loading}
			<div class="p-8 text-center text-sm text-muted-foreground">Loading...</div>
		{:else if keys.length === 0}
			<div class="p-8 text-center text-sm text-muted-foreground">
				No API keys yet. Create one to get started with programmatic access.
			</div>
		{:else}
			<div class="divide-y divide-border">
				{#each keys as key (key.id)}
					<div class="flex items-center justify-between p-4">
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<span class="font-medium text-sm">{key.name || 'Unnamed Key'}</span>
								{#if !key.enabled}
									<span class="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
										Disabled
									</span>
								{/if}
							</div>
							<div class="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
								<span class="font-mono">{key.start}...</span>
								<span>Created {formatDate(key.createdAt)}</span>
								{#if key.lastRequest}
									<span>Last used {formatDate(key.lastRequest)}</span>
								{:else}
									<span>Never used</span>
								{/if}
								{#if key.expiresAt}
									<span>Expires {formatDate(key.expiresAt)}</span>
								{/if}
							</div>
						</div>
						<div class="ml-4">
							{#if deletingId === key.id}
								<div class="flex items-center gap-2">
									<span class="text-xs text-muted-foreground">Delete?</span>
									<Button size="sm" variant="destructive" onclick={() => deleteKey(key.id)}>
										Confirm
									</Button>
									<Button size="sm" variant="ghost" onclick={() => (deletingId = null)}>
										Cancel
									</Button>
								</div>
							{:else}
								<Button size="sm" variant="ghost" onclick={() => (deletingId = key.id)}>
									Delete
								</Button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card>

	<!-- Usage instructions -->
	<Card class="p-6 mt-6">
		<h2 class="text-lg font-semibold mb-3">Usage</h2>
		<p class="text-sm text-muted-foreground mb-3">
			Include your API key in the <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">Authorization</code> header:
		</p>
		<div class="rounded-lg bg-muted p-4 font-mono text-sm overflow-x-auto">
			<pre>curl -H "Authorization: Bearer lnrs_your_api_key" \
  https://lunaris.win/api/v1/projects</pre>
		</div>
	</Card>
</div>
