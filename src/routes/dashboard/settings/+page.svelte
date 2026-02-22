<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { authClient } from '$lib/auth-client.js';
	import { formatBytes, formatDate } from '$lib/utils.js';
	import Card from '$lib/components/ui/card.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Alert from '$lib/components/ui/alert.svelte';
	import Separator from '$lib/components/ui/separator.svelte';

	interface QuotaRequest {
		id: string;
		requestedBytes: number;
		reason: string;
		status: string;
		adminNote: string | null;
		createdAt: Date;
		resolvedAt: Date | null;
	}

	interface Props {
		data: {
			user: { id: string; name: string; username: string; email: string; image: string | null };
			quota: { used: number; limit: number };
			quotaRequests: QuotaRequest[];
			hasPassword: boolean;
		};
	}

	let { data }: Props = $props();

	// Avatar state
	let avatarUrl = $state<string | null>(data.user.image);
	let uploadingAvatar = $state(false);
	let avatarMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);
	let fileInput: HTMLInputElement;

	async function uploadAvatar(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			avatarMessage = { type: 'error', text: 'Please select an image file.' };
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			avatarMessage = { type: 'error', text: 'Image must be under 5MB.' };
			return;
		}

		uploadingAvatar = true;
		avatarMessage = null;

		try {
			const formData = new FormData();
			formData.append('avatar', file);

			const res = await fetch('/api/v1/user/avatar', {
				method: 'POST',
				body: formData
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Upload failed');
			}

			const result = await res.json();
			avatarUrl = result.imageUrl + '?t=' + Date.now();
			avatarMessage = { type: 'success', text: 'Avatar updated!' };
			await invalidateAll();
		} catch (e) {
			avatarMessage = { type: 'error', text: e instanceof Error ? e.message : 'Failed to upload avatar.' };
		} finally {
			uploadingAvatar = false;
			target.value = '';
		}
	}

	async function removeAvatar() {
		uploadingAvatar = true;
		avatarMessage = null;

		try {
			const res = await fetch('/api/v1/user/avatar', { method: 'DELETE' });
			if (!res.ok) throw new Error('Failed to remove avatar');
			avatarUrl = null;
			avatarMessage = { type: 'success', text: 'Avatar removed.' };
			await invalidateAll();
		} catch {
			avatarMessage = { type: 'error', text: 'Failed to remove avatar.' };
		} finally {
			uploadingAvatar = false;
		}
	}

	// Account form
	let name = $state(data.user.name);
	let saving = $state(false);
	let accountMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Password form
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let changingPassword = $state(false);
	let passwordMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Quota request form
	let requestAmount = $state('250');
	let requestReason = $state('');
	let submittingRequest = $state(false);
	let quotaMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	async function updateAccount() {
		saving = true;
		accountMessage = null;

		try {
			await authClient.updateUser({ name });
			accountMessage = { type: 'success', text: 'Account updated successfully.' };
			await invalidateAll();
		} catch {
			accountMessage = { type: 'error', text: 'Failed to update account.' };
		} finally {
			saving = false;
		}
	}

	async function changePassword() {
		if (newPassword !== confirmPassword) {
			passwordMessage = { type: 'error', text: 'Passwords do not match.' };
			return;
		}
		if (newPassword.length < 8) {
			passwordMessage = { type: 'error', text: 'Password must be at least 8 characters.' };
			return;
		}

		changingPassword = true;
		passwordMessage = null;

		try {
			await authClient.changePassword({
				currentPassword,
				newPassword
			});
			passwordMessage = { type: 'success', text: 'Password changed successfully.' };
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
		} catch {
			passwordMessage = { type: 'error', text: 'Failed to change password. Check your current password.' };
		} finally {
			changingPassword = false;
		}
	}

	async function submitQuotaRequest() {
		if (!requestReason.trim()) {
			quotaMessage = { type: 'error', text: 'Please provide a reason for the quota increase.' };
			return;
		}

		submittingRequest = true;
		quotaMessage = null;

		try {
			const res = await fetch('/api/v1/quota-request', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					requestedGB: parseInt(requestAmount),
					reason: requestReason.trim()
				})
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Request failed');
			}

			quotaMessage = { type: 'success', text: 'Quota increase request submitted. We\'ll review it shortly.' };
			requestReason = '';
		} catch (e) {
			quotaMessage = { type: 'error', text: e instanceof Error ? e.message : 'Failed to submit request.' };
		} finally {
			submittingRequest = false;
		}
	}

	// Account deletion
	let showDeleteDialog = $state(false);
	let deletePassword = $state('');
	let deleteConfirmed = $state(false);
	let deleting = $state(false);
	let deleteMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	async function deleteAccount() {
		deleting = true;
		deleteMessage = null;

		try {
			const body = data.hasPassword
				? { password: deletePassword }
				: { confirm: true };

			const res = await fetch('/api/v1/user/delete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			if (!res.ok) {
				const json = await res.json();
				throw new Error(json.error || 'Failed to delete account');
			}

			// Redirect to home on success
			window.location.href = '/';
		} catch (e) {
			deleteMessage = { type: 'error', text: e instanceof Error ? e.message : 'Failed to delete account.' };
		} finally {
			deleting = false;
		}
	}

	function openDeleteDialog() {
		deletePassword = '';
		deleteConfirmed = false;
		deleteMessage = null;
		showDeleteDialog = true;
	}

	function closeDeleteDialog() {
		showDeleteDialog = false;
		deletePassword = '';
		deleteConfirmed = false;
		deleteMessage = null;
	}

	let deleteReady = $derived(
		data.hasPassword ? deletePassword.length > 0 : deleteConfirmed
	);

	let quotaPct = $derived(
		data.quota.limit > 0 ? Math.min(100, (data.quota.used / data.quota.limit) * 100) : 0
	);

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
</script>

<svelte:head>
	<title>Settings - Lunaris CDN</title>
</svelte:head>

<div>
	<div class="mb-8">
		<h1 class="text-2xl font-bold">Settings</h1>
		<p class="mt-1 text-sm text-muted-foreground">Manage your account and storage quota.</p>
	</div>

	<!-- Avatar -->
	<Card class="p-6 mb-6">
		<h2 class="text-lg font-semibold mb-4">Avatar</h2>

		{#if avatarMessage}
			<Alert variant={avatarMessage.type === 'success' ? 'success' : 'destructive'} class="mb-4">
				{avatarMessage.text}
			</Alert>
		{/if}

		<div class="flex items-center gap-6">
			{#if avatarUrl}
				<img
					src={avatarUrl}
					alt={data.user.name}
					class="h-24 w-24 rounded-full ring-2 ring-white/10 object-cover"
				/>
			{:else}
				<div class="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/60 to-cyan/40 text-2xl font-semibold text-white ring-2 ring-white/10">
					{data.user.name.charAt(0).toUpperCase()}
				</div>
			{/if}

			<div class="space-y-2">
				<input
					bind:this={fileInput}
					type="file"
					accept="image/png,image/jpeg,image/gif,image/webp"
					class="hidden"
					onchange={uploadAvatar}
				/>
				<Button onclick={() => fileInput.click()} disabled={uploadingAvatar}>
					{uploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
				</Button>
				{#if avatarUrl}
					<Button variant="outline" onclick={removeAvatar} disabled={uploadingAvatar} class="ml-2">
						Remove
					</Button>
				{/if}
				<p class="text-xs text-muted-foreground">PNG, JPEG, GIF, or WebP. Max 5MB.</p>
			</div>
		</div>
	</Card>

	<!-- Account Settings -->
	<Card class="p-6 mb-6">
		<h2 class="text-lg font-semibold mb-4">Account</h2>

		{#if accountMessage}
			<Alert variant={accountMessage.type === 'success' ? 'success' : 'destructive'} class="mb-4">
				{accountMessage.text}
			</Alert>
		{/if}

		<form onsubmit={updateAccount} class="space-y-4">
			<div>
				<Label for="name">Display Name</Label>
				<Input id="name" bind:value={name} class="mt-1.5" />
			</div>

			<div>
				<Label for="username">Username</Label>
				<Input id="username" value={data.user.username} disabled class="mt-1.5 opacity-60" />
				<p class="mt-1 text-xs text-muted-foreground">Username cannot be changed.</p>
			</div>

			<div>
				<Label for="email">Email</Label>
				<Input id="email" value={data.user.email} disabled class="mt-1.5 opacity-60" />
				<p class="mt-1 text-xs text-muted-foreground">Contact support to change your email.</p>
			</div>

			<Button type="submit" disabled={saving || name === data.user.name}>
				{saving ? 'Saving...' : 'Save Changes'}
			</Button>
		</form>
	</Card>

	<!-- Password -->
	<Card class="p-6 mb-6">
		<h2 class="text-lg font-semibold mb-4">Change Password</h2>

		{#if passwordMessage}
			<Alert variant={passwordMessage.type === 'success' ? 'success' : 'destructive'} class="mb-4">
				{passwordMessage.text}
			</Alert>
		{/if}

		<form onsubmit={changePassword} class="space-y-4">
			<div>
				<Label for="current-password">Current Password</Label>
				<Input id="current-password" type="password" bind:value={currentPassword} class="mt-1.5" />
			</div>

			<div>
				<Label for="new-password">New Password</Label>
				<Input id="new-password" type="password" bind:value={newPassword} class="mt-1.5" />
			</div>

			<div>
				<Label for="confirm-password">Confirm New Password</Label>
				<Input id="confirm-password" type="password" bind:value={confirmPassword} class="mt-1.5" />
			</div>

			<Button type="submit" disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}>
				{changingPassword ? 'Changing...' : 'Change Password'}
			</Button>
		</form>
	</Card>

	<Separator class="my-8" />

	<!-- Storage Quota -->
	<Card class="p-6 mb-6">
		<h2 class="text-lg font-semibold mb-4">Storage Quota</h2>

		<div class="mb-4">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm text-muted-foreground">
					{formatBytes(data.quota.used)} of {formatBytes(data.quota.limit)} used
				</span>
				<span class="text-sm text-muted-foreground">
					{formatBytes(data.quota.limit - data.quota.used)} remaining
				</span>
			</div>
			<div class="h-3 w-full overflow-hidden rounded-full bg-muted">
				<div
					class="h-full rounded-full transition-all duration-500 {quotaPct > 90 ? 'bg-destructive' : quotaPct > 70 ? 'bg-yellow-500' : 'bg-primary'}"
					style="width: {quotaPct}%"
				></div>
			</div>
		</div>

		<Separator class="my-4" />

		<h3 class="text-sm font-medium mb-3">Request Quota Increase</h3>

		{#if quotaMessage}
			<Alert variant={quotaMessage.type === 'success' ? 'success' : 'destructive'} class="mb-4">
				{quotaMessage.text}
			</Alert>
		{/if}

		<form onsubmit={submitQuotaRequest} class="space-y-4">
			<div>
				<Label for="request-amount">Additional Storage (GB)</Label>
				<select
					id="request-amount"
					bind:value={requestAmount}
					class="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				>
					<option value="100">100 GB</option>
					<option value="250">250 GB</option>
					<option value="500">500 GB</option>
					<option value="1000">1 TB</option>
				</select>
			</div>

			<div>
				<Label for="request-reason">Reason</Label>
				<textarea
					id="request-reason"
					bind:value={requestReason}
					rows={3}
					placeholder="Tell us about your project and why you need more storage..."
					class="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
				></textarea>
			</div>

			<Button type="submit" disabled={submittingRequest || !requestReason.trim()}>
				{submittingRequest ? 'Submitting...' : 'Submit Request'}
			</Button>
		</form>
	</Card>

	<!-- Previous Requests -->
	{#if data.quotaRequests.length > 0}
		<Card class="p-6 mb-6">
			<h2 class="text-lg font-semibold mb-4">Request History</h2>

			<div class="divide-y divide-border">
				{#each data.quotaRequests as req}
					<div class="py-3 first:pt-0 last:pb-0">
						<div class="flex items-center justify-between">
							<div>
								<span class="text-sm font-medium">+{formatBytes(req.requestedBytes)}</span>
								<span class="text-xs text-muted-foreground ml-2">{formatDate(req.createdAt)}</span>
							</div>
							<span class="rounded-full px-2 py-0.5 text-xs font-medium capitalize {statusBadge(req.status)}">
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

	<Separator class="my-8" />

	<!-- Danger Zone -->
	<div class="rounded-lg border border-destructive/50 p-6">
		<h2 class="text-lg font-semibold text-destructive mb-1">Danger Zone</h2>
		<p class="text-sm text-muted-foreground mb-6">
			Actions here are permanent and cannot be undone.
		</p>

		<div class="flex items-center justify-between gap-4">
			<div>
				<p class="text-sm font-medium">Delete Account</p>
				<p class="text-xs text-muted-foreground mt-0.5">
					Permanently delete your account, all projects, files, versions, API keys, and stored data.
				</p>
			</div>
			<Button variant="destructive" onclick={openDeleteDialog}>
				Delete Account
			</Button>
		</div>
	</div>
</div>

<!-- Delete Account Dialog -->
{#if showDeleteDialog}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="delete-dialog-title"
	>
		<div class="w-full max-w-md rounded-lg border border-destructive/40 bg-card shadow-xl">
			<div class="p-6">
				<h2 id="delete-dialog-title" class="text-lg font-semibold text-destructive mb-2">
					Delete Account
				</h2>
				<p class="text-sm text-muted-foreground mb-4">
					This will permanently delete:
				</p>
				<ul class="mb-4 space-y-1 text-sm text-muted-foreground list-disc list-inside">
					<li>All your projects and versions</li>
					<li>All uploaded files (removed from storage)</li>
					<li>All API keys and active sessions</li>
					<li>Your quota and account history</li>
				</ul>
				<p class="text-sm font-medium text-destructive mb-4">This action cannot be undone.</p>

				{#if deleteMessage}
					<Alert variant="destructive" class="mb-4">
						{deleteMessage.text}
					</Alert>
				{/if}

				{#if data.hasPassword}
					<div class="mb-4">
						<Label for="delete-password">Enter your password to confirm</Label>
						<Input
							id="delete-password"
							type="password"
							bind:value={deletePassword}
							placeholder="Your current password"
							class="mt-1.5"
							autocomplete="current-password"
						/>
					</div>
				{:else}
					<label class="flex items-center gap-3 mb-4 cursor-pointer select-none">
						<input
							type="checkbox"
							bind:checked={deleteConfirmed}
							class="h-4 w-4 rounded border-input accent-destructive"
						/>
						<span class="text-sm">I understand this is permanent and cannot be undone.</span>
					</label>
				{/if}

				<div class="flex gap-3 justify-end">
					<Button variant="outline" onclick={closeDeleteDialog} disabled={deleting}>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onclick={deleteAccount}
						disabled={deleting || !deleteReady}
					>
						{deleting ? 'Deleting...' : 'Delete My Account'}
					</Button>
				</div>
			</div>
		</div>
	</div>
{/if}
