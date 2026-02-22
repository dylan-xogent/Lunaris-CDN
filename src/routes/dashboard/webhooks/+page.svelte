<script lang="ts">
	import { formatDate } from '$lib/utils.js';
	import Card from '$lib/components/ui/card.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Alert from '$lib/components/ui/alert.svelte';

	interface Delivery {
		id: number;
		webhookId: string;
		event: string;
		payload: string;
		statusCode: number | null;
		response: string | null;
		success: boolean;
		attemptCount: number;
		createdAt: Date;
	}

	interface Webhook {
		id: string;
		userId: string;
		projectId: string | null;
		url: string;
		secret: string;
		events: string[];
		enabled: boolean;
		createdAt: Date;
		updatedAt: Date;
	}

	interface Props {
		data: {
			user: { id: string; name: string };
			webhooks: Webhook[];
			deliveriesMap: Record<string, Delivery[]>;
		};
	}

	let { data }: Props = $props();

	const ALL_EVENTS = [
		{ value: 'file.uploaded', label: 'File Uploaded' },
		{ value: 'file.downloaded', label: 'File Downloaded' },
		{ value: 'version.created', label: 'Version Created' },
		{ value: 'project.created', label: 'Project Created' },
		{ value: 'project.deleted', label: 'Project Deleted' }
	];

	// Local state for webhooks (so we can mutate without full page reload)
	let webhooks = $state<Webhook[]>(data.webhooks);
	let deliveriesMap = $state<Record<string, Delivery[]>>(data.deliveriesMap);

	let error = $state<string | null>(null);
	let success = $state<string | null>(null);

	// Add webhook form
	let showAddForm = $state(false);
	let newUrl = $state('');
	let newEvents = $state<string[]>(['file.uploaded']);
	let adding = $state(false);

	// Edit state
	let editingId = $state<string | null>(null);
	let editUrl = $state('');
	let editEvents = $state<string[]>([]);
	let saving = $state(false);

	// Delete confirmation
	let deletingId = $state<string | null>(null);
	let deleting = $state(false);

	// Expanded deliveries
	let expandedId = $state<string | null>(null);

	// Test ping state
	let testingId = $state<string | null>(null);
	let testResults = $state<Record<string, { success: boolean; statusCode: number | null; response: string | null }>>({});

	// Secret reveal
	let revealedSecrets = $state<Set<string>>(new Set());

	function clearMessages() {
		error = null;
		success = null;
	}

	function toggleEvent(events: string[], value: string): string[] {
		return events.includes(value) ? events.filter((e) => e !== value) : [...events, value];
	}

	async function addWebhook() {
		clearMessages();
		if (!newUrl.trim()) { error = 'URL is required.'; return; }
		if (newEvents.length === 0) { error = 'Select at least one event.'; return; }

		adding = true;
		try {
			const res = await fetch('/api/v1/webhooks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: newUrl.trim(), events: newEvents })
			});
			const json = await res.json();
			if (!res.ok) { error = json.error || 'Failed to create webhook.'; return; }

			webhooks = [{ ...json.webhook, events: json.webhook.events }, ...webhooks];
			deliveriesMap = { ...deliveriesMap, [json.webhook.id]: [] };
			newUrl = '';
			newEvents = ['file.uploaded'];
			showAddForm = false;
			success = 'Webhook created successfully.';
		} catch {
			error = 'Failed to create webhook.';
		} finally {
			adding = false;
		}
	}

	function startEdit(wh: Webhook) {
		editingId = wh.id;
		editUrl = wh.url;
		editEvents = [...wh.events];
	}

	function cancelEdit() {
		editingId = null;
		editUrl = '';
		editEvents = [];
	}

	async function saveEdit(id: string) {
		clearMessages();
		if (!editUrl.trim()) { error = 'URL is required.'; return; }
		if (editEvents.length === 0) { error = 'Select at least one event.'; return; }

		saving = true;
		try {
			const res = await fetch(`/api/v1/webhooks/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: editUrl.trim(), events: editEvents })
			});
			const json = await res.json();
			if (!res.ok) { error = json.error || 'Failed to update webhook.'; return; }

			webhooks = webhooks.map((wh) => wh.id === id ? { ...wh, ...json.webhook } : wh);
			editingId = null;
			success = 'Webhook updated.';
		} catch {
			error = 'Failed to update webhook.';
		} finally {
			saving = false;
		}
	}

	async function toggleEnabled(wh: Webhook) {
		clearMessages();
		try {
			const res = await fetch(`/api/v1/webhooks/${wh.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ enabled: !wh.enabled })
			});
			const json = await res.json();
			if (!res.ok) { error = json.error || 'Failed to update webhook.'; return; }
			webhooks = webhooks.map((w) => w.id === wh.id ? { ...w, enabled: json.webhook.enabled } : w);
		} catch {
			error = 'Failed to update webhook.';
		}
	}

	async function deleteWebhook(id: string) {
		clearMessages();
		deleting = true;
		try {
			const res = await fetch(`/api/v1/webhooks/${id}`, { method: 'DELETE' });
			if (!res.ok) {
				const json = await res.json();
				error = json.error || 'Failed to delete webhook.';
				return;
			}
			webhooks = webhooks.filter((wh) => wh.id !== id);
			const { [id]: _, ...rest } = deliveriesMap;
			deliveriesMap = rest;
			deletingId = null;
			success = 'Webhook deleted.';
		} catch {
			error = 'Failed to delete webhook.';
		} finally {
			deleting = false;
		}
	}

	async function sendTestPing(id: string) {
		clearMessages();
		testingId = id;
		try {
			const res = await fetch(`/api/v1/webhooks/${id}`, { method: 'POST' });
			const json = await res.json();
			testResults = { ...testResults, [id]: json };

			// Add to deliveries list
			const newDelivery: Delivery = {
				id: Date.now(),
				webhookId: id,
				event: 'ping',
				payload: '{}',
				statusCode: json.statusCode,
				response: json.response,
				success: json.success,
				attemptCount: 1,
				createdAt: new Date()
			};
			deliveriesMap = { ...deliveriesMap, [id]: [newDelivery, ...(deliveriesMap[id] || [])].slice(0, 20) };
			expandedId = id;
		} catch {
			error = 'Failed to send test ping.';
		} finally {
			testingId = null;
		}
	}

	function truncateUrl(url: string, max = 50) {
		return url.length > max ? url.slice(0, max) + '...' : url;
	}

	function eventBadgeClass(event: string) {
		switch (event) {
			case 'file.uploaded': return 'bg-blue-500/10 text-blue-400';
			case 'file.downloaded': return 'bg-cyan-500/10 text-cyan-400';
			case 'version.created': return 'bg-purple-500/10 text-purple-400';
			case 'project.created': return 'bg-green-500/10 text-green-400';
			case 'project.deleted': return 'bg-red-500/10 text-red-400';
			case 'ping': return 'bg-yellow-500/10 text-yellow-400';
			default: return 'bg-muted text-muted-foreground';
		}
	}
</script>

<svelte:head>
	<title>Webhooks - Lunaris CDN</title>
</svelte:head>

<div>
	<div class="mb-8 flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-bold">Webhooks</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Receive HTTP notifications when events occur in your account.
			</p>
		</div>
		<Button onclick={() => { showAddForm = !showAddForm; clearMessages(); }}>
			{showAddForm ? 'Cancel' : 'Add Webhook'}
		</Button>
	</div>

	{#if error}
		<Alert variant="destructive" class="mb-6">{error}</Alert>
	{/if}
	{#if success}
		<Alert variant="success" class="mb-6">{success}</Alert>
	{/if}

	<!-- Add webhook form -->
	{#if showAddForm}
		<Card class="p-6 mb-6">
			<h2 class="text-lg font-semibold mb-4">New Webhook</h2>
			<div class="space-y-4">
				<div>
					<Label for="new-url">Endpoint URL</Label>
					<Input
						id="new-url"
						bind:value={newUrl}
						placeholder="https://example.com/webhook"
						class="mt-1.5"
					/>
				</div>

				<div>
					<Label>Events</Label>
					<div class="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
						{#each ALL_EVENTS as evt}
							<label class="flex items-center gap-2.5 cursor-pointer">
								<input
									type="checkbox"
									class="rounded border-border bg-background accent-primary h-4 w-4"
									checked={newEvents.includes(evt.value)}
									onchange={() => { newEvents = toggleEvent(newEvents, evt.value); }}
								/>
								<span class="text-sm">{evt.label}</span>
							</label>
						{/each}
					</div>
				</div>

				<div class="flex items-center gap-3">
					<Button onclick={addWebhook} disabled={adding || !newUrl.trim() || newEvents.length === 0}>
						{adding ? 'Creating...' : 'Create Webhook'}
					</Button>
					<Button variant="ghost" onclick={() => { showAddForm = false; clearMessages(); }}>
						Cancel
					</Button>
				</div>
			</div>
		</Card>
	{/if}

	<!-- Webhooks list -->
	{#if webhooks.length === 0}
		<Card class="p-12 text-center">
			<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04]">
				<svg class="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
				</svg>
			</div>
			<h3 class="text-sm font-medium mb-1">No webhooks yet</h3>
			<p class="text-sm text-muted-foreground">Add a webhook to start receiving event notifications.</p>
		</Card>
	{:else}
		<div class="space-y-4">
			{#each webhooks as wh (wh.id)}
				<Card class="overflow-hidden">
					<!-- Webhook header -->
					<div class="p-4 flex items-start gap-4">
						<!-- Status dot -->
						<div class="mt-0.5 shrink-0">
							<div class="h-2.5 w-2.5 rounded-full {wh.enabled ? 'bg-green-400' : 'bg-muted-foreground'}"></div>
						</div>

						<!-- Main info -->
						<div class="min-w-0 flex-1">
							{#if editingId === wh.id}
								<!-- Edit form -->
								<div class="space-y-3">
									<div>
										<Label for="edit-url-{wh.id}">URL</Label>
										<Input
											id="edit-url-{wh.id}"
											bind:value={editUrl}
											placeholder="https://example.com/webhook"
											class="mt-1"
										/>
									</div>
									<div>
										<Label>Events</Label>
										<div class="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
											{#each ALL_EVENTS as evt}
												<label class="flex items-center gap-2 cursor-pointer">
													<input
														type="checkbox"
														class="rounded border-border bg-background accent-primary h-3.5 w-3.5"
														checked={editEvents.includes(evt.value)}
														onchange={() => { editEvents = toggleEvent(editEvents, evt.value); }}
													/>
													<span class="text-sm">{evt.label}</span>
												</label>
											{/each}
										</div>
									</div>
									<div class="flex gap-2">
										<Button size="sm" onclick={() => saveEdit(wh.id)} disabled={saving}>
											{saving ? 'Saving...' : 'Save'}
										</Button>
										<Button size="sm" variant="ghost" onclick={cancelEdit}>Cancel</Button>
									</div>
								</div>
							{:else}
								<!-- Display mode -->
								<div class="flex flex-wrap items-center gap-x-3 gap-y-1">
									<span class="font-mono text-sm font-medium">{truncateUrl(wh.url)}</span>
									{#if !wh.enabled}
										<span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Disabled</span>
									{/if}
								</div>
								<div class="mt-2 flex flex-wrap gap-1.5">
									{#each wh.events as evt}
										<span class="rounded-full px-2 py-0.5 text-xs font-medium {eventBadgeClass(evt)}">
											{evt}
										</span>
									{/each}
								</div>
								<div class="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
									<span>Created {formatDate(wh.createdAt)}</span>
									<span>{deliveriesMap[wh.id]?.length ?? 0} recent deliveries</span>
								</div>

								<!-- Secret -->
								<div class="mt-3 flex items-center gap-2">
									<span class="text-xs text-muted-foreground">Secret:</span>
									{#if revealedSecrets.has(wh.id)}
										<code class="font-mono text-xs bg-muted rounded px-2 py-0.5 break-all">{wh.secret}</code>
										<button
											class="text-xs text-muted-foreground hover:text-foreground"
											onclick={() => { const s = new Set(revealedSecrets); s.delete(wh.id); revealedSecrets = s; }}
										>
											Hide
										</button>
									{:else}
										<code class="font-mono text-xs bg-muted rounded px-2 py-0.5">••••••••••••••••</code>
										<button
											class="text-xs text-muted-foreground hover:text-foreground"
											onclick={() => { revealedSecrets = new Set([...revealedSecrets, wh.id]); }}
										>
											Reveal
										</button>
									{/if}
								</div>
							{/if}
						</div>

						<!-- Actions -->
						{#if editingId !== wh.id}
							<div class="flex items-center gap-1 shrink-0">
								<!-- Toggle enabled -->
								<button
									class="rounded-lg p-1.5 text-xs transition-colors {wh.enabled ? 'text-green-400 hover:bg-green-400/10' : 'text-muted-foreground hover:bg-white/[0.04]'}"
									onclick={() => toggleEnabled(wh)}
									title={wh.enabled ? 'Disable' : 'Enable'}
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
										{#if wh.enabled}
											<path stroke-linecap="round" stroke-linejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
										{:else}
											<path stroke-linecap="round" stroke-linejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
										{/if}
									</svg>
								</button>

								<!-- Test -->
								<button
									class="rounded-lg p-1.5 text-xs text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-colors"
									onclick={() => sendTestPing(wh.id)}
									disabled={testingId === wh.id}
									title="Send test ping"
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
										<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
									</svg>
								</button>

								<!-- Edit -->
								<button
									class="rounded-lg p-1.5 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-colors"
									onclick={() => startEdit(wh)}
									title="Edit webhook"
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
										<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
									</svg>
								</button>

								<!-- Deliveries toggle -->
								<button
									class="rounded-lg p-1.5 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-colors"
									onclick={() => { expandedId = expandedId === wh.id ? null : wh.id; }}
									title="View deliveries"
								>
									<svg class="h-4 w-4 transition-transform {expandedId === wh.id ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
										<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
									</svg>
								</button>

								<!-- Delete -->
								{#if deletingId === wh.id}
									<div class="flex items-center gap-1 ml-1">
										<span class="text-xs text-muted-foreground">Delete?</span>
										<Button size="sm" variant="destructive" onclick={() => deleteWebhook(wh.id)} disabled={deleting}>
											{deleting ? '...' : 'Yes'}
										</Button>
										<Button size="sm" variant="ghost" onclick={() => { deletingId = null; }}>No</Button>
									</div>
								{:else}
									<button
										class="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
										onclick={() => { deletingId = wh.id; }}
										title="Delete webhook"
									>
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
											<path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
										</svg>
									</button>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Test result banner -->
					{#if testResults[wh.id]}
						{@const result = testResults[wh.id]}
						<div class="mx-4 mb-4 rounded-lg p-3 text-sm {result.success ? 'bg-green-500/10 text-green-400' : 'bg-destructive/10 text-destructive'}">
							<div class="flex items-center gap-2">
								<span class="font-medium">Test ping {result.success ? 'succeeded' : 'failed'}</span>
								{#if result.statusCode}
									<span class="font-mono text-xs opacity-70">HTTP {result.statusCode}</span>
								{/if}
							</div>
							{#if result.response}
								<p class="mt-1 font-mono text-xs opacity-70 truncate">{result.response}</p>
							{/if}
						</div>
					{/if}

					<!-- Deliveries section -->
					{#if expandedId === wh.id}
						<div class="border-t border-border">
							<div class="px-4 py-3 flex items-center justify-between">
								<span class="text-sm font-medium text-muted-foreground">Recent Deliveries</span>
								<span class="text-xs text-muted-foreground">Last 20</span>
							</div>

							{#if !deliveriesMap[wh.id] || deliveriesMap[wh.id].length === 0}
								<div class="px-4 pb-4 text-sm text-muted-foreground">No deliveries yet.</div>
							{:else}
								<div class="divide-y divide-border">
									{#each deliveriesMap[wh.id] as delivery (delivery.id)}
										<div class="flex items-center gap-3 px-4 py-2.5">
											<!-- Status badge -->
											<span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium {delivery.success ? 'bg-green-500/10 text-green-400' : 'bg-destructive/10 text-destructive'}">
												{delivery.success ? 'OK' : 'FAIL'}
											</span>

											<!-- Status code -->
											{#if delivery.statusCode}
												<span class="shrink-0 font-mono text-xs text-muted-foreground w-10">
													{delivery.statusCode}
												</span>
											{:else}
												<span class="shrink-0 font-mono text-xs text-muted-foreground w-10">---</span>
											{/if}

											<!-- Event -->
											<span class="rounded-full px-2 py-0.5 text-xs {eventBadgeClass(delivery.event)}">
												{delivery.event}
											</span>

											<!-- Response snippet -->
											{#if delivery.response}
												<span class="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
													{delivery.response}
												</span>
											{/if}

											<!-- Timestamp -->
											<span class="shrink-0 text-xs text-muted-foreground ml-auto">
												{formatDate(delivery.createdAt)}
											</span>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				</Card>
			{/each}
		</div>
	{/if}

	<!-- Docs card -->
	<Card class="p-6 mt-6">
		<h2 class="text-lg font-semibold mb-3">Webhook Signatures</h2>
		<p class="text-sm text-muted-foreground mb-3">
			Each request is signed using HMAC-SHA256. Verify the signature with your webhook secret:
		</p>
		<div class="rounded-lg bg-muted p-4 font-mono text-sm overflow-x-auto">
			<pre class="text-xs leading-relaxed">{@html `// Node.js example
const crypto = require('crypto');

function verifySignature(secret, body, signature) \{
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
\}`}</pre>
		</div>
		<div class="mt-4">
			<p class="text-sm text-muted-foreground mb-2">Headers sent with every webhook request:</p>
			<ul class="space-y-1 text-xs font-mono text-muted-foreground">
				<li><span class="text-foreground">X-Webhook-Signature</span>: sha256=&lt;hmac&gt;</li>
				<li><span class="text-foreground">X-Webhook-Event</span>: file.uploaded</li>
				<li><span class="text-foreground">X-Webhook-ID</span>: &lt;webhook-id&gt;</li>
				<li><span class="text-foreground">Content-Type</span>: application/json</li>
			</ul>
		</div>
	</Card>
</div>
