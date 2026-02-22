<script lang="ts">
	import { invalidateAll, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { formatBytes, formatNumber, formatDate } from '$lib/utils.js';

	interface UserWithStats {
		id: string;
		name: string;
		username: string;
		email: string;
		image: string | null;
		role: string;
		emailVerified: boolean;
		createdAt: Date;
		projectCount: number;
		totalDownloads: number;
		storageUsed: number;
		storageLimit: number;
		registrationIp: string | null;
		ipAccountCount: number;
	}

	interface Props {
		data: {
			users: UserWithStats[];
			page: number;
			totalPages: number;
			total: number;
			limit: number;
		};
	}

	let { data }: Props = $props();

	// Selection state
	let selectedIds = $state<Set<string>>(new Set());
	let allSelected = $derived(data.users.length > 0 && data.users.every((u) => selectedIds.has(u.id)));
	let someSelected = $derived(selectedIds.size > 0);

	// Bulk action state
	let bulkLoading = $state(false);
	let bulkError = $state('');
	let confirmModal = $state<{ action: string; label: string } | null>(null);

	function toggleAll() {
		if (allSelected) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(data.users.map((u) => u.id));
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

	function getUserInitial(name: string) {
		return name.charAt(0).toUpperCase();
	}

	function getAvatarGradient(name: string) {
		const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
		const gradients = [
			'from-violet-500 to-purple-500',
			'from-blue-500 to-cyan-500',
			'from-emerald-500 to-teal-500',
			'from-orange-500 to-amber-500',
			'from-pink-500 to-rose-500',
			'from-indigo-500 to-blue-500'
		];
		return gradients[hash % gradients.length];
	}

	// Pagination helpers
	function buildPageUrl(p: number) {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('page', String(p));
		return `?${params.toString()}`;
	}

	// Bulk actions
	async function executeBulkAction(action: string) {
		bulkLoading = true;
		bulkError = '';
		confirmModal = null;

		const ids = Array.from(selectedIds);

		try {
			if (action === 'delete') {
				await Promise.all(
					ids.map((id) =>
						fetch(`/api/v1/admin/users/${id}`, { method: 'DELETE' }).then((r) => {
							if (!r.ok) throw new Error(`Failed for user ${id}`);
						})
					)
				);
			} else if (action === 'make_admin') {
				await Promise.all(
					ids.map((id) =>
						fetch(`/api/v1/admin/users/${id}`, {
							method: 'PATCH',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ role: 'admin' })
						}).then((r) => {
							if (!r.ok) throw new Error(`Failed for user ${id}`);
						})
					)
				);
			} else if (action === 'make_user') {
				await Promise.all(
					ids.map((id) =>
						fetch(`/api/v1/admin/users/${id}`, {
							method: 'PATCH',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ role: 'user' })
						}).then((r) => {
							if (!r.ok) throw new Error(`Failed for user ${id}`);
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

	function requestBulkAction(action: string, label: string) {
		confirmModal = { action, label };
	}
</script>

<svelte:head>
	<title>Users - Admin - Lunaris CDN</title>
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
				{selectedIds.size === 1 ? 'user' : 'users'}. This action cannot be undone.
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

<div>
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-2xl font-bold">Users</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			{data.total} registered {data.total === 1 ? 'user' : 'users'}
		</p>
	</div>

	<!-- Bulk error -->
	{#if bulkError}
		<div class="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
			{bulkError}
		</div>
	{/if}

	<!-- Bulk action bar -->
	{#if someSelected}
		<div class="mb-4 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
			<span class="text-sm font-medium text-foreground">
				{selectedIds.size} selected
			</span>
			<div class="ml-auto flex items-center gap-2">
				<button
					onclick={() => requestBulkAction('make_admin', 'Make Admin')}
					disabled={bulkLoading}
					class="rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground disabled:opacity-50"
				>
					Make Admin
				</button>
				<button
					onclick={() => requestBulkAction('make_user', 'Make User')}
					disabled={bulkLoading}
					class="rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground disabled:opacity-50"
				>
					Make User
				</button>
				<button
					onclick={() => requestBulkAction('delete', 'Delete Users')}
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

	<!-- Users list -->
	{#if data.users.length === 0}
		<div class="rounded-xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
			<svg class="mx-auto h-10 w-10 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
			</svg>
			<p class="mt-3 text-sm text-muted-foreground">No users found.</p>
		</div>
	{:else}
		<div class="overflow-hidden rounded-xl border border-white/[0.06]">
			<table class="w-full">
				<thead>
					<tr class="border-b border-white/[0.06] bg-white/[0.02]">
						<th class="px-4 py-3 text-left">
							<input
								type="checkbox"
								checked={allSelected}
								onchange={toggleAll}
								class="h-4 w-4 rounded border-white/[0.2] bg-white/[0.04] accent-primary"
								aria-label="Select all"
							/>
						</th>
						<th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">User</th>
						<th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Role</th>
						<th class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground md:table-cell">Storage</th>
						<th class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground sm:table-cell">Projects</th>
						<th class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground lg:table-cell">Reg. IP</th>
						<th class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground lg:table-cell">Joined</th>
						<th class="px-4 py-3"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-white/[0.04]">
					{#each data.users as u (u.id)}
						<tr class="transition-colors hover:bg-white/[0.02] {selectedIds.has(u.id) ? 'bg-primary/[0.03]' : ''}">
							<td class="px-4 py-3">
								<input
									type="checkbox"
									checked={selectedIds.has(u.id)}
									onchange={() => toggleOne(u.id)}
									class="h-4 w-4 rounded border-white/[0.2] bg-white/[0.04] accent-primary"
									aria-label="Select {u.name}"
								/>
							</td>
							<td class="px-4 py-3">
								<div class="flex items-center gap-3">
									{#if u.image}
										<img src={u.image} alt={u.name} class="h-9 w-9 rounded-full object-cover" />
									{:else}
										<div class="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br {getAvatarGradient(u.name)} text-sm font-semibold text-white">
											{getUserInitial(u.name)}
										</div>
									{/if}
									<div class="min-w-0">
										<p class="truncate text-sm font-medium">{u.name}</p>
										<p class="truncate text-xs text-muted-foreground">@{u.username}</p>
										<p class="truncate text-xs text-muted-foreground md:hidden">{u.email}</p>
									</div>
								</div>
							</td>
							<td class="px-4 py-3">
								{#if u.role === 'admin'}
									<span class="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
										Admin
									</span>
								{:else}
									<span class="inline-flex items-center rounded-full bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-muted-foreground">
										User
									</span>
								{/if}
							</td>
							<td class="hidden px-4 py-3 md:table-cell">
								<div class="text-sm">
									<span class="text-foreground">{formatBytes(u.storageUsed)}</span>
									<span class="text-muted-foreground"> / {formatBytes(u.storageLimit)}</span>
								</div>
							</td>
							<td class="hidden px-4 py-3 sm:table-cell">
								<span class="text-sm">{u.projectCount}</span>
							</td>
							<td class="hidden px-4 py-3 lg:table-cell">
								{#if u.registrationIp}
									<div class="flex items-center gap-1.5">
										<code class="text-xs font-mono text-muted-foreground">{u.registrationIp}</code>
										{#if u.ipAccountCount > 1}
											<span class="inline-flex items-center rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400" title="{u.ipAccountCount} accounts share this IP">
												{u.ipAccountCount}
											</span>
										{/if}
									</div>
								{:else}
									<span class="text-xs text-muted-foreground/40">—</span>
								{/if}
							</td>
							<td class="hidden px-4 py-3 lg:table-cell">
								<span class="text-sm text-muted-foreground">{formatDate(u.createdAt)}</span>
							</td>
							<td class="px-4 py-3 text-right">
								<a
									href="/admin/users/{u.id}"
									class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
								>
									View
									<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
									</svg>
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		{#if data.totalPages > 1}
			<div class="mt-4 flex items-center justify-between">
				<p class="text-sm text-muted-foreground">
					Showing {(data.page - 1) * data.limit + 1}–{Math.min(data.page * data.limit, data.total)} of {data.total} users
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
		{:else}
			<p class="mt-4 text-center text-xs text-muted-foreground">
				{data.total} {data.total === 1 ? 'user' : 'users'} total
			</p>
		{/if}
	{/if}
</div>
