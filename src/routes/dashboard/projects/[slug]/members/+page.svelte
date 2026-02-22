<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { formatDate } from '$lib/utils.js';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import Alert from '$lib/components/ui/alert.svelte';

	interface Member {
		id: string;
		userId: string;
		role: string;
		createdAt: Date;
		name: string;
		email: string;
		username: string;
		image: string | null;
	}

	interface Invitation {
		id: string;
		email: string;
		role: string;
		status: string;
		expiresAt: Date;
		createdAt: Date;
		inviterName: string;
	}

	interface Props {
		data: {
			project: {
				id: string;
				name: string;
				slug: string;
				userId: string;
			};
			currentUserRole: string | null;
			owner: {
				id: string;
				name: string;
				email: string;
				username: string;
				image: string | null;
			} | null;
			members: Member[];
			invitations: Invitation[];
			user: { id: string };
		};
	}

	let { data }: Props = $props();

	let inviteEmail = $state('');
	let inviteRole = $state('viewer');
	let inviteError = $state('');
	let inviteSuccess = $state('');
	let inviteLoading = $state(false);

	let removingMemberId = $state<string | null>(null);
	let confirmRemove = $state<string | null>(null);

	let cancellingInvitationId = $state<string | null>(null);
	let resendingInvitationId = $state<string | null>(null);

	const canManage = data.currentUserRole === 'owner' || data.currentUserRole === 'admin';
	const isOwner = data.currentUserRole === 'owner';

	const roleColors: Record<string, string> = {
		owner: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
		admin: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
		editor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
		viewer: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
	};

	const roleDescriptions: Record<string, string> = {
		viewer: 'Can view the project and its files',
		editor: 'Can upload files to the project',
		admin: 'Can manage members and upload files'
	};

	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	async function sendInvite(e: SubmitEvent) {
		e.preventDefault();
		if (!inviteEmail.trim()) return;

		inviteError = '';
		inviteSuccess = '';
		inviteLoading = true;

		try {
			const res = await fetch(`/api/v1/projects/${data.project.slug}/members`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole })
			});

			const result = await res.json();

			if (!res.ok) {
				inviteError = result.error ?? 'Failed to send invitation.';
			} else {
				inviteSuccess = `Invitation sent to ${inviteEmail.trim()}.`;
				inviteEmail = '';
				await invalidateAll();
			}
		} catch {
			inviteError = 'Failed to send invitation.';
		} finally {
			inviteLoading = false;
		}
	}

	async function updateRole(memberId: string, newRole: string) {
		try {
			const res = await fetch(`/api/v1/projects/${data.project.slug}/members/${memberId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role: newRole })
			});

			if (!res.ok) {
				const result = await res.json();
				alert(result.error ?? 'Failed to update role.');
			} else {
				await invalidateAll();
			}
		} catch {
			alert('Failed to update role.');
		}
	}

	async function removeMember(memberId: string) {
		removingMemberId = memberId;
		try {
			const res = await fetch(`/api/v1/projects/${data.project.slug}/members/${memberId}`, {
				method: 'DELETE'
			});

			if (!res.ok) {
				const result = await res.json();
				alert(result.error ?? 'Failed to remove member.');
			} else {
				confirmRemove = null;
				await invalidateAll();
			}
		} catch {
			alert('Failed to remove member.');
		} finally {
			removingMemberId = null;
		}
	}

	async function cancelInvitation(invitationId: string) {
		cancellingInvitationId = invitationId;
		try {
			const res = await fetch(`/api/v1/projects/${data.project.slug}/invitations/${invitationId}`, {
				method: 'DELETE'
			});

			if (!res.ok) {
				const result = await res.json();
				alert(result.error ?? 'Failed to cancel invitation.');
			} else {
				await invalidateAll();
			}
		} catch {
			alert('Failed to cancel invitation.');
		} finally {
			cancellingInvitationId = null;
		}
	}

	async function resendInvitation(email: string, role: string) {
		resendingInvitationId = email;
		inviteError = '';
		inviteSuccess = '';

		try {
			const res = await fetch(`/api/v1/projects/${data.project.slug}/members`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, role })
			});

			const result = await res.json();

			if (!res.ok) {
				inviteError = result.error ?? 'Failed to resend invitation.';
			} else {
				inviteSuccess = `Invitation resent to ${email}.`;
				await invalidateAll();
			}
		} catch {
			inviteError = 'Failed to resend invitation.';
		} finally {
			resendingInvitationId = null;
		}
	}

	const pendingInvitations = $derived(data.invitations.filter((i) => i.status === 'pending'));
</script>

<svelte:head>
	<title>Members - {data.project.name} - Lunaris CDN</title>
</svelte:head>

<div>
	<!-- Header -->
	<div class="mb-8">
		<a href="/dashboard/projects/{data.project.slug}" class="text-sm text-muted-foreground hover:text-foreground transition-colors">
			&larr; Back to {data.project.name}
		</a>
		<div class="mt-4 flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold">Members</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					Manage who has access to <strong>{data.project.name}</strong>
				</p>
			</div>
			<span class="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 text-sm text-muted-foreground">
				{1 + data.members.length} member{1 + data.members.length !== 1 ? 's' : ''}
			</span>
		</div>
	</div>

	<!-- Invite form (owner/admin only) -->
	{#if canManage}
		<Card class="p-6 mb-6">
			<h2 class="text-sm font-semibold mb-1">Invite a Member</h2>
			<p class="text-xs text-muted-foreground mb-4">They'll receive an email with a link to accept or decline.</p>

			{#if inviteError}
				<Alert variant="destructive" class="mb-4">{inviteError}</Alert>
			{/if}
			{#if inviteSuccess}
				<Alert variant="success" class="mb-4">{inviteSuccess}</Alert>
			{/if}

			<form onsubmit={sendInvite} class="space-y-4">
				<div class="flex gap-3">
					<div class="flex-1">
						<Input
							type="email"
							placeholder="colleague@example.com"
							bind:value={inviteEmail}
							required
						/>
					</div>
					<select
						bind:value={inviteRole}
						class="h-10 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/30"
					>
						<option value="viewer">Viewer</option>
						<option value="editor">Editor</option>
						{#if isOwner}
							<option value="admin">Admin</option>
						{/if}
					</select>
					<Button type="submit" disabled={inviteLoading || !inviteEmail.trim()}>
						{inviteLoading ? 'Sending...' : 'Send Invite'}
					</Button>
				</div>

				<!-- Role descriptions -->
				<div class="grid grid-cols-3 gap-2 text-xs">
					{#each Object.entries(roleDescriptions) as [r, desc]}
						{#if r !== 'admin' || isOwner}
							<div
								class="rounded-lg border p-2.5 transition-colors cursor-pointer {inviteRole === r ? 'border-primary/40 bg-primary/5' : 'border-white/[0.04] bg-white/[0.01] hover:border-white/[0.08]'}"
								onclick={() => (inviteRole = r)}
								role="button"
								tabindex="0"
								onkeydown={(e) => e.key === 'Enter' && (inviteRole = r)}
							>
								<span class="font-medium capitalize {inviteRole === r ? 'text-foreground' : 'text-muted-foreground'}">{r}</span>
								<p class="text-muted-foreground/70 mt-0.5">{desc}</p>
							</div>
						{/if}
					{/each}
				</div>
			</form>
		</Card>
	{/if}

	<!-- Members list -->
	<Card class="mb-6 overflow-hidden">
		<div class="px-6 py-4 border-b border-white/[0.04]">
			<h2 class="text-sm font-semibold">Current Members</h2>
		</div>

		<div class="divide-y divide-white/[0.04]">
			<!-- Owner row -->
			{#if data.owner}
				<div class="flex items-center gap-4 px-6 py-4">
					<div class="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
						{#if data.owner.image}
							<img src={data.owner.image} alt={data.owner.name} class="w-full h-full object-cover" />
						{:else}
							<span class="text-xs font-semibold text-amber-300">{getInitials(data.owner.name)}</span>
						{/if}
					</div>
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2">
							<p class="text-sm font-medium truncate">{data.owner.name}</p>
							<span class="text-xs text-muted-foreground">@{data.owner.username}</span>
						</div>
						<p class="text-xs text-muted-foreground truncate">{data.owner.email}</p>
					</div>
					<span class="rounded-full border px-2.5 py-0.5 text-xs font-medium {roleColors.owner}">
						Owner
					</span>
				</div>
			{/if}

			<!-- Member rows -->
			{#each data.members as member (member.id)}
				<div class="flex items-center gap-4 px-6 py-4">
					<div class="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center flex-shrink-0 overflow-hidden">
						{#if member.image}
							<img src={member.image} alt={member.name} class="w-full h-full object-cover" />
						{:else}
							<span class="text-xs font-semibold text-muted-foreground">{getInitials(member.name)}</span>
						{/if}
					</div>
					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2">
							<p class="text-sm font-medium truncate">{member.name}</p>
							{#if member.username}
								<span class="text-xs text-muted-foreground">@{member.username}</span>
							{/if}
						</div>
						<p class="text-xs text-muted-foreground truncate">{member.email}</p>
					</div>
					<div class="flex items-center gap-2 flex-shrink-0">
						{#if canManage && (isOwner || member.role !== 'admin')}
							<select
								value={member.role}
								onchange={(e) => updateRole(member.id, (e.target as HTMLSelectElement).value)}
								class="h-8 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
							>
								<option value="viewer">Viewer</option>
								<option value="editor">Editor</option>
								{#if isOwner}
									<option value="admin">Admin</option>
								{/if}
							</select>
						{:else}
							<span class="rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize {roleColors[member.role] ?? 'text-muted-foreground bg-white/5 border-white/10'}">
								{member.role}
							</span>
						{/if}

						<p class="text-xs text-muted-foreground hidden sm:block">
							{formatDate(member.createdAt)}
						</p>

						{#if isOwner || member.userId === data.user?.id}
							{#if confirmRemove === member.id}
								<div class="flex gap-1.5">
									<Button
										variant="destructive"
										size="sm"
										disabled={removingMemberId === member.id}
										onclick={() => removeMember(member.id)}
									>
										{removingMemberId === member.id ? '...' : 'Remove'}
									</Button>
									<Button variant="ghost" size="sm" onclick={() => (confirmRemove = null)}>
										Cancel
									</Button>
								</div>
							{:else}
								<Button
									variant="ghost"
									size="sm"
									onclick={() => (confirmRemove = member.id)}
								>
									<svg class="h-4 w-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</Button>
							{/if}
						{/if}
					</div>
				</div>
			{/each}

			{#if data.members.length === 0}
				<div class="px-6 py-8 text-center text-sm text-muted-foreground">
					No additional members yet. Invite someone above.
				</div>
			{/if}
		</div>
	</Card>

	<!-- Pending invitations -->
	{#if pendingInvitations.length > 0}
		<Card class="overflow-hidden">
			<div class="px-6 py-4 border-b border-white/[0.04]">
				<div class="flex items-center gap-2">
					<h2 class="text-sm font-semibold">Pending Invitations</h2>
					<span class="rounded-full bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400">
						{pendingInvitations.length}
					</span>
				</div>
			</div>

			<div class="divide-y divide-white/[0.04]">
				{#each pendingInvitations as inv (inv.id)}
					<div class="flex items-center gap-4 px-6 py-4">
						<div class="w-9 h-9 rounded-full bg-white/[0.04] border border-dashed border-white/[0.1] flex items-center justify-center flex-shrink-0">
							<svg class="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
							</svg>
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium truncate">{inv.email}</p>
							<p class="text-xs text-muted-foreground">
								Invited {formatDate(inv.createdAt)} &middot; Expires {formatDate(inv.expiresAt)}
							</p>
						</div>
						<div class="flex items-center gap-2 flex-shrink-0">
							<span class="rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize {roleColors[inv.role] ?? 'text-muted-foreground bg-white/5 border-white/10'}">
								{inv.role}
							</span>
							{#if canManage}
								<Button
									variant="ghost"
									size="sm"
									disabled={resendingInvitationId === inv.email}
									onclick={() => resendInvitation(inv.email, inv.role)}
								>
									{resendingInvitationId === inv.email ? '...' : 'Resend'}
								</Button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</Card>
	{/if}
</div>
