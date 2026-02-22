<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { formatBytes, formatNumber, formatDate } from '$lib/utils.js';
	import Card from '$lib/components/ui/card.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Alert from '$lib/components/ui/alert.svelte';
	import Label from '$lib/components/ui/label.svelte';

	interface QuotaRequest {
		id: string;
		requestedBytes: number;
		reason: string;
		status: string;
		adminNote: string | null;
		createdAt: Date;
		resolvedAt: Date | null;
	}

	interface UserProject {
		id: string;
		name: string;
		slug: string;
		description: string | null;
		isPublic: boolean;
		createdAt: Date;
		fileCount: number;
		versionCount: number;
		totalDownloads: number;
	}

	interface Props {
		data: {
			targetUser: {
				id: string;
				name: string;
				username: string;
				email: string;
				image: string | null;
				role: string;
				emailVerified: boolean;
				createdAt: Date;
			};
			quota: { used: number; limit: number };
			projects: UserProject[];
			quotaRequests: QuotaRequest[];
		};
	}

	let { data }: Props = $props();

	// Edit form state
	let editName = $state(data.targetUser.name);
	let editUsername = $state(data.targetUser.username);
	let editEmail = $state(data.targetUser.email);
	let editRole = $state(data.targetUser.role);
	let savingUser = $state(false);
	let userMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Quota form state
	let quotaLimitGB = $state(parseFloat((data.quota.limit / 1073741824).toFixed(2)));
	let savingQuota = $state(false);
	let quotaMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Delete state
	let confirmDelete = $state(false);
	let deleting = $state(false);
	let deleteMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Derived
	let quotaPct = $derived(
		data.quota.limit > 0 ? Math.min(100, (data.quota.used / data.quota.limit) * 100) : 0
	);

	let quotaColor = $derived(
		quotaPct > 90
			? 'from-red-500 to-red-400'
			: quotaPct > 70
				? 'from-amber-500 to-yellow-400'
				: 'from-primary to-cyan'
	);

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

	function statusBadge(status: string) {
		switch (status) {
			case 'approved':
				return 'bg-green-500/10 text-green-400';
			case 'denied':
				return 'bg-destructive/10 text-destructive';
			default:
				return 'bg-yellow-500/10 text-yellow-400';
		}
	}

	async function saveUser() {
		savingUser = true;
		userMessage = null;

		try {
			const res = await fetch(`/api/v1/admin/users/${data.targetUser.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: editName,
					username: editUsername,
					email: editEmail,
					role: editRole
				})
			});

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || 'Failed to update user');
			}

			userMessage = { type: 'success', text: 'User updated successfully.' };
			await invalidateAll();
		} catch (e) {
			userMessage = {
				type: 'error',
				text: e instanceof Error ? e.message : 'Failed to update user.'
			};
		} finally {
			savingUser = false;
		}
	}

	async function saveQuota() {
		savingQuota = true;
		quotaMessage = null;

		try {
			const res = await fetch(`/api/v1/admin/users/${data.targetUser.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					storageLimitGB: quotaLimitGB
				})
			});

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || 'Failed to update quota');
			}

			quotaMessage = { type: 'success', text: 'Storage quota updated successfully.' };
			await invalidateAll();
		} catch (e) {
			quotaMessage = {
				type: 'error',
				text: e instanceof Error ? e.message : 'Failed to update quota.'
			};
		} finally {
			savingQuota = false;
		}
	}

	async function deleteUser() {
		deleting = true;
		deleteMessage = null;

		try {
			const res = await fetch(`/api/v1/admin/users/${data.targetUser.id}`, {
				method: 'DELETE'
			});

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || 'Failed to delete user');
			}

			goto('/admin/users');
		} catch (e) {
			deleteMessage = {
				type: 'error',
				text: e instanceof Error ? e.message : 'Failed to delete user.'
			};
			deleting = false;
		}
	}
</script>

<svelte:head>
	<title>{data.targetUser.name} - Admin - Lunaris CDN</title>
</svelte:head>

<div>
	<!-- Back link -->
	<a
		href="/admin/users"
		class="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
	>
		<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
		</svg>
		Back to Users
	</a>

	<!-- Header -->
	<div class="mb-8 flex items-start gap-4">
		{#if data.targetUser.image}
			<img
				src={data.targetUser.image}
				alt={data.targetUser.name}
				class="h-16 w-16 rounded-full object-cover"
			/>
		{:else}
			<div
				class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br {getAvatarGradient(data.targetUser.name)} text-xl font-bold text-white"
			>
				{getUserInitial(data.targetUser.name)}
			</div>
		{/if}
		<div class="min-w-0 flex-1">
			<h1 class="text-2xl font-bold">{data.targetUser.name}</h1>
			<p class="mt-0.5 text-sm text-muted-foreground">@{data.targetUser.username}</p>
			<div class="mt-2 flex flex-wrap items-center gap-2">
				<span class="text-sm text-muted-foreground">{data.targetUser.email}</span>
				{#if data.targetUser.role === 'admin'}
					<span
						class="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
					>
						Admin
					</span>
				{:else}
					<span
						class="inline-flex items-center rounded-full bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-muted-foreground"
					>
						User
					</span>
				{/if}
				{#if data.targetUser.emailVerified}
					<span
						class="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400"
					>
						<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						Verified
					</span>
				{:else}
					<span
						class="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-400"
					>
						Unverified
					</span>
				{/if}
				<span class="text-xs text-muted-foreground">
					Joined {formatDate(data.targetUser.createdAt)}
				</span>
			</div>
		</div>
	</div>

	<!-- Edit User -->
	<Card class="mb-6 p-6">
		<h2 class="mb-4 text-lg font-semibold">Edit User</h2>

		{#if userMessage}
			<Alert variant={userMessage.type === 'success' ? 'success' : 'destructive'} class="mb-4">
				{userMessage.text}
			</Alert>
		{/if}

		<form onsubmit={saveUser} class="space-y-4">
			<div>
				<Label for="edit-name">Name</Label>
				<Input id="edit-name" bind:value={editName} class="mt-1.5" />
			</div>

			<div>
				<Label for="edit-username">Username</Label>
				<Input id="edit-username" bind:value={editUsername} class="mt-1.5" />
			</div>

			<div>
				<Label for="edit-email">Email</Label>
				<Input id="edit-email" type="email" bind:value={editEmail} class="mt-1.5" />
			</div>

			<div>
				<Label for="edit-role">Role</Label>
				<select
					id="edit-role"
					bind:value={editRole}
					class="mt-1.5 flex h-10 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-foreground transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/30 focus-visible:bg-white/[0.03]"
				>
					<option value="user">User</option>
					<option value="admin">Admin</option>
				</select>
			</div>

			<Button type="submit" disabled={savingUser}>
				{savingUser ? 'Saving...' : 'Save Changes'}
			</Button>
		</form>
	</Card>

	<!-- Storage Quota -->
	<Card class="mb-6 p-6">
		<h2 class="mb-4 text-lg font-semibold">Storage Quota</h2>

		{#if quotaMessage}
			<Alert variant={quotaMessage.type === 'success' ? 'success' : 'destructive'} class="mb-4">
				{quotaMessage.text}
			</Alert>
		{/if}

		<!-- Usage bar -->
		<div class="mb-6">
			<div class="mb-2 flex items-center justify-between">
				<span class="text-sm text-muted-foreground">
					{formatBytes(data.quota.used)} of {formatBytes(data.quota.limit)} used
				</span>
				<span class="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-xs text-muted-foreground">
					{quotaPct.toFixed(1)}%
				</span>
			</div>
			<div class="h-2 w-full overflow-hidden rounded-full bg-white/[0.04]">
				<div
					class="h-full rounded-full bg-gradient-to-r {quotaColor} transition-all duration-700"
					style="width: {quotaPct}%"
				></div>
			</div>
			<div class="mt-2 flex justify-between text-xs text-muted-foreground">
				<span>{formatBytes(data.quota.used)} used</span>
				<span>{formatBytes(data.quota.limit - data.quota.used)} remaining</span>
			</div>
		</div>

		<!-- Set new limit -->
		<form onsubmit={saveQuota} class="flex items-end gap-3">
			<div class="flex-1">
				<Label for="quota-limit">Storage Limit (GB)</Label>
				<Input
					id="quota-limit"
					type="number"
					bind:value={quotaLimitGB}
					class="mt-1.5"
				/>
			</div>
			<Button type="submit" disabled={savingQuota}>
				{savingQuota ? 'Saving...' : 'Update Limit'}
			</Button>
		</form>
	</Card>

	<!-- Quota Requests -->
	{#if data.quotaRequests.length > 0}
		<Card class="mb-6 p-6">
			<h2 class="mb-4 text-lg font-semibold">Quota Requests</h2>

			<div class="divide-y divide-white/[0.04]">
				{#each data.quotaRequests as req}
					<div class="py-3 first:pt-0 last:pb-0">
						<div class="flex items-center justify-between">
							<div>
								<span class="text-sm font-medium">+{formatBytes(req.requestedBytes)}</span>
								<span class="ml-2 text-xs text-muted-foreground">{formatDate(req.createdAt)}</span>
							</div>
							<span
								class="rounded-full px-2 py-0.5 text-xs font-medium capitalize {statusBadge(req.status)}"
							>
								{req.status}
							</span>
						</div>
						<p class="mt-1 text-sm text-muted-foreground">{req.reason}</p>
						{#if req.adminNote}
							<p class="mt-1 text-sm text-primary">Note: {req.adminNote}</p>
						{/if}
					</div>
				{/each}
			</div>
		</Card>
	{/if}

	<!-- Projects -->
	<div class="mb-6">
		<h2 class="mb-4 text-lg font-semibold">
			Projects
			<span class="ml-1 text-sm font-normal text-muted-foreground">({data.projects.length})</span>
		</h2>

		{#if data.projects.length === 0}
			<Card class="p-8 text-center">
				<svg
					class="mx-auto h-10 w-10 text-muted-foreground/40"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
					/>
				</svg>
				<p class="mt-3 text-sm text-muted-foreground">This user has no projects.</p>
			</Card>
		{:else}
			<div class="grid gap-3 sm:grid-cols-2">
				{#each data.projects as proj}
					<Card class="p-5 transition-all hover:border-white/[0.1] hover:bg-white/[0.03]">
						<div class="flex items-start justify-between">
							<div class="min-w-0">
								<h3 class="truncate text-sm font-semibold">{proj.name}</h3>
								<p class="mt-0.5 text-xs text-muted-foreground">/{data.targetUser.username}/{proj.slug}</p>
							</div>
							{#if proj.isPublic}
								<span class="shrink-0 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
									Public
								</span>
							{:else}
								<span class="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-muted-foreground">
									Private
								</span>
							{/if}
						</div>
						{#if proj.description}
							<p class="mt-2 line-clamp-2 text-xs text-muted-foreground">{proj.description}</p>
						{/if}
						<div class="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
							<span class="flex items-center gap-1">
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
								</svg>
								{proj.fileCount} {proj.fileCount === 1 ? 'file' : 'files'}
							</span>
							<span class="flex items-center gap-1">
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
								</svg>
								{formatNumber(proj.totalDownloads)} downloads
							</span>
							<span class="flex items-center gap-1">
								<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
								</svg>
								{proj.versionCount} {proj.versionCount === 1 ? 'version' : 'versions'}
							</span>
						</div>
					</Card>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Danger Zone -->
	<Card class="border-destructive/20 p-6">
		<h2 class="mb-2 text-lg font-semibold text-destructive">Danger Zone</h2>
		<p class="mb-4 text-sm text-muted-foreground">
			Permanently delete this user and all of their data. This action cannot be undone.
		</p>

		{#if deleteMessage}
			<Alert variant="destructive" class="mb-4">
				{deleteMessage.text}
			</Alert>
		{/if}

		{#if !confirmDelete}
			<Button variant="destructive" onclick={() => (confirmDelete = true)}>
				Delete User
			</Button>
		{:else}
			<div class="flex items-center gap-3">
				<Button variant="destructive" onclick={deleteUser} disabled={deleting}>
					{deleting ? 'Deleting...' : 'Confirm Delete'}
				</Button>
				<Button variant="ghost" onclick={() => (confirmDelete = false)} disabled={deleting}>
					Cancel
				</Button>
			</div>
		{/if}
	</Card>
</div>
