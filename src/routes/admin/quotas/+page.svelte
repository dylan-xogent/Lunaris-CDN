<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { formatBytes, formatDate } from '$lib/utils.js';
	import Card from '$lib/components/ui/card.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Alert from '$lib/components/ui/alert.svelte';

	let { data } = $props();

	let adminNotes = $state<Record<string, string>>({});
	let processingId = $state<string | null>(null);
	let error = $state('');

	let pendingRequests = $derived(
		data.requests.filter((r) => r.status === 'pending')
	);

	let resolvedRequests = $derived(
		data.requests.filter((r) => r.status !== 'pending')
	);

	async function handleAction(requestId: string, action: 'approve' | 'deny') {
		processingId = requestId;
		error = '';
		try {
			const res = await fetch(`/api/v1/admin/quotas/${requestId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action,
					adminNote: adminNotes[requestId] ?? ''
				})
			});
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(body?.message ?? `Failed to ${action} request`);
			}
			delete adminNotes[requestId];
			await invalidateAll();
		} catch (e) {
			error = e instanceof Error ? e.message : 'An error occurred';
		} finally {
			processingId = null;
		}
	}

	function getQuotaPercent(used: number | null, limit: number | null): number {
		if (!used || !limit || limit === 0) return 0;
		return Math.min(Math.round((used / limit) * 100), 100);
	}
</script>

<svelte:head>
	<title>Quotas - Admin - Lunaris CDN</title>
</svelte:head>

<div class="space-y-8">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold tracking-tight">Quota Requests</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			{pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
		</p>
	</div>

	{#if error}
		<Alert variant="destructive">
			<p>{error}</p>
		</Alert>
	{/if}

	<!-- Pending Requests -->
	<section class="space-y-4">
		<h2 class="text-lg font-semibold">Pending Requests</h2>

		{#if pendingRequests.length === 0}
			<Card class="p-6">
				<p class="text-center text-sm text-muted-foreground">No pending quota requests</p>
			</Card>
		{:else}
			<div class="grid gap-4">
				{#each pendingRequests as request (request.id)}
					{@const percent = getQuotaPercent(request.storageUsedBytes, request.storageLimitBytes)}
					<Card class="p-5">
						<div class="space-y-4">
							<!-- User info -->
							<div class="flex items-start justify-between gap-4">
								<div>
									<div class="font-medium text-foreground">{request.userName}</div>
									<div class="flex items-center gap-2 text-sm text-muted-foreground">
										<a href="/admin/users" class="text-primary hover:underline">@{request.userUsername}</a>
										<span class="text-white/[0.1]">|</span>
										<span>{request.userEmail}</span>
									</div>
								</div>
								<span class="shrink-0 text-xs text-muted-foreground">{formatDate(request.createdAt)}</span>
							</div>

							<!-- Current quota bar -->
							<div class="space-y-1.5">
								<div class="flex items-center justify-between text-xs">
									<span class="text-muted-foreground">Current quota</span>
									<span class="tabular-nums text-muted-foreground">
										{formatBytes(request.storageUsedBytes ?? 0)} / {formatBytes(request.storageLimitBytes ?? 0)}
									</span>
								</div>
								<div class="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
									<div
										class="h-full rounded-full transition-all {percent >= 90 ? 'bg-red-500' : percent >= 70 ? 'bg-amber-500' : 'bg-primary'}"
										style="width: {percent}%"
									></div>
								</div>
							</div>

							<!-- Requested amount -->
							<div class="rounded-lg bg-white/[0.03] px-3 py-2">
								<div class="text-xs text-muted-foreground">Requested increase</div>
								<div class="mt-0.5 text-sm font-semibold text-foreground">{formatBytes(request.requestedBytes)}</div>
							</div>

							<!-- Reason -->
							<div>
								<div class="text-xs font-medium text-muted-foreground">Reason</div>
								<p class="mt-1 text-sm text-foreground/80">{request.reason}</p>
							</div>

							<!-- Admin note -->
							<div>
								<label for="note-{request.id}" class="mb-1 block text-xs font-medium text-muted-foreground">Admin note</label>
								<textarea
									id="note-{request.id}"
									bind:value={adminNotes[request.id]}
									placeholder="Optional note..."
									rows="2"
									class="flex w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/30 focus-visible:bg-white/[0.03] resize-none"
								></textarea>
							</div>

							<!-- Actions -->
							<div class="flex items-center justify-end gap-2 border-t border-white/[0.04] pt-4">
								<Button
									variant="destructive"
									size="sm"
									disabled={processingId === request.id}
									onclick={() => handleAction(request.id, 'deny')}
								>
									{#if processingId === request.id}
										Denying...
									{:else}
										Deny
									{/if}
								</Button>
								<Button
									size="sm"
									disabled={processingId === request.id}
									onclick={() => handleAction(request.id, 'approve')}
								>
									{#if processingId === request.id}
										Approving...
									{:else}
										Approve
									{/if}
								</Button>
							</div>
						</div>
					</Card>
				{/each}
			</div>
		{/if}
	</section>

	<!-- History -->
	<section class="space-y-4">
		<h2 class="text-lg font-semibold">History</h2>

		{#if resolvedRequests.length === 0}
			<Card class="p-6">
				<p class="text-center text-sm text-muted-foreground">No resolved requests yet</p>
			</Card>
		{:else}
			<Card>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-white/[0.06]">
								<th class="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
								<th class="px-4 py-3 text-right font-medium text-muted-foreground">Requested</th>
								<th class="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
								<th class="px-4 py-3 text-left font-medium text-muted-foreground">Admin Note</th>
								<th class="px-4 py-3 text-left font-medium text-muted-foreground">Resolved</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-white/[0.04]">
							{#each resolvedRequests as request (request.id)}
								<tr class="transition-colors hover:bg-white/[0.02]">
									<td class="px-4 py-3">
										<div class="font-medium text-foreground">{request.userName}</div>
										<a href="/admin/users" class="text-xs text-primary hover:underline">@{request.userUsername}</a>
									</td>
									<td class="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatBytes(request.requestedBytes)}</td>
									<td class="px-4 py-3">
										{#if request.status === 'approved'}
											<span class="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
												Approved
											</span>
										{:else}
											<span class="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-500/20">
												Denied
											</span>
										{/if}
									</td>
									<td class="max-w-[200px] truncate px-4 py-3 text-muted-foreground" title={request.adminNote ?? ''}>
										{request.adminNote || '--'}
									</td>
									<td class="px-4 py-3 text-muted-foreground">
										{request.resolvedAt ? formatDate(request.resolvedAt) : '--'}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</Card>
		{/if}
	</section>
</div>
