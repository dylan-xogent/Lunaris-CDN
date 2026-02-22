<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatDate } from '$lib/utils.js';

	interface Props {
		data: {
			invitation: {
				id: string;
				email: string;
				role: string;
				expiresAt: Date;
				createdAt: Date;
			} | null;
			project: {
				id: string;
				name: string;
				slug: string;
				description: string | null;
			} | null;
			inviter: {
				id: string;
				name: string;
				username: string;
			} | null;
			currentUser: { id: string; name: string; email: string } | null;
			errorType: string | null;
		};
		form?: { declined?: boolean } | null;
	}

	let { data, form }: Props = $props();

	let accepting = $state(false);
	let declining = $state(false);

	const roleDescriptions: Record<string, string> = {
		viewer: 'Can view the project and its files',
		editor: 'Can view and upload files to the project',
		admin: 'Can view, upload files, and manage members'
	};

	const roleColors: Record<string, string> = {
		viewer: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
		editor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
		admin: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
	};
</script>

<svelte:head>
	<title>
		{data.invitation ? `Invitation to ${data.project?.name ?? 'a project'}` : 'Invitation'} - Lunaris CDN
	</title>
</svelte:head>

<div class="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
	<!-- Background -->
	<div class="pointer-events-none absolute inset-0 grid-bg"></div>
	<div class="pointer-events-none absolute top-1/4 left-1/2 h-[400px] w-[500px] -translate-x-1/2 rounded-full bg-primary/6 blur-[100px]"></div>

	<div class="relative w-full max-w-md">
		<!-- Logo -->
		<div class="mb-8 text-center">
			<a href="/" class="inline-flex items-center gap-2.5 group">
				<img src="/logo.png" alt="Lunaris" class="h-10 w-10 transition-transform group-hover:scale-105" />
				<span class="text-lg font-semibold tracking-tight">Lunaris CDN</span>
			</a>
		</div>

		<!-- Error states -->
		{#if data.errorType === 'expired'}
			<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm text-center">
				<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-yellow-500/20 bg-yellow-500/10">
					<svg class="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<h1 class="text-xl font-semibold">Invitation Expired</h1>
				<p class="mt-2 text-sm text-muted-foreground">
					This invitation link has expired. Please ask the project owner to send a new invitation.
				</p>
				<a
					href="/dashboard"
					class="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] px-6 text-sm font-medium text-foreground transition-all hover:bg-white/[0.06]"
				>
					Go to Dashboard
				</a>
			</div>
		{:else if data.errorType === 'already_accepted'}
			<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm text-center">
				<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
					<svg class="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h1 class="text-xl font-semibold">Already Accepted</h1>
				<p class="mt-2 text-sm text-muted-foreground">
					This invitation has already been accepted.
				</p>
				<a
					href="/dashboard/projects"
					class="btn-gradient mt-6 inline-flex h-10 items-center justify-center rounded-lg px-6 text-sm font-medium text-white"
				>
					View Projects
				</a>
			</div>
		{:else if data.errorType === 'already_declined'}
			<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm text-center">
				<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
					<svg class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</div>
				<h1 class="text-xl font-semibold">Invitation Declined</h1>
				<p class="mt-2 text-sm text-muted-foreground">
					This invitation was previously declined.
				</p>
				<a
					href="/dashboard"
					class="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] px-6 text-sm font-medium text-foreground transition-all hover:bg-white/[0.06]"
				>
					Go to Dashboard
				</a>
			</div>
		{:else if form?.declined}
			<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm text-center">
				<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
					<svg class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</div>
				<h1 class="text-xl font-semibold">Invitation Declined</h1>
				<p class="mt-2 text-sm text-muted-foreground">
					You have declined the invitation to join <strong class="text-foreground">{data.project?.name}</strong>.
				</p>
				<a
					href="/dashboard"
					class="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] px-6 text-sm font-medium text-foreground transition-all hover:bg-white/[0.06]"
				>
					Go to Dashboard
				</a>
			</div>
		{:else if data.invitation && data.project}
			<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm">
				<!-- Header text -->
				<p class="mb-6 text-center text-sm text-muted-foreground">You've been invited to collaborate</p>

				<!-- Project info -->
				<div class="flex items-center gap-4 mb-6">
					<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-gradient-to-br from-violet-500/20 to-blue-500/20">
						<svg class="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
						</svg>
					</div>
					<div>
						<h1 class="text-xl font-semibold">{data.project.name}</h1>
						{#if data.project.description}
							<p class="text-sm text-muted-foreground">{data.project.description}</p>
						{:else}
							<p class="text-sm text-muted-foreground">{data.project.slug}</p>
						{/if}
					</div>
				</div>

				<!-- Invitation details -->
				<div class="mb-6 space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">Invited by</span>
						<span class="font-medium">{data.inviter?.name ?? 'Unknown'}</span>
					</div>
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">Your role</span>
						<span class="rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize {roleColors[data.invitation.role] ?? 'text-muted-foreground bg-white/5 border-white/10'}">
							{data.invitation.role}
						</span>
					</div>
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">Expires</span>
						<span>{formatDate(data.invitation.expiresAt)}</span>
					</div>
					{#if data.invitation.role in roleDescriptions}
						<div class="border-t border-white/[0.04] pt-2 text-xs text-muted-foreground">
							{roleDescriptions[data.invitation.role]}
						</div>
					{/if}
				</div>

				{#if data.currentUser}
					<!-- Email mismatch warning -->
					{#if data.currentUser.email?.toLowerCase() !== data.invitation.email.toLowerCase()}
						<div class="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm">
							<p class="font-medium text-red-400 mb-1">Wrong account</p>
							<p class="text-xs text-muted-foreground">
								This invitation was sent to <strong class="text-foreground">{data.invitation.email}</strong>, but you're signed in as
								<strong class="text-foreground">{data.currentUser.email}</strong>. Please sign out and use the correct account.
							</p>
						</div>
						<a
							href="/auth/login?redirect=/invite/{data.invitation.id}"
							class="inline-flex h-10 w-full items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-sm font-medium text-foreground transition-all hover:bg-white/[0.06]"
						>
							Switch Account
						</a>
					{:else}
						<!-- Accept / Decline -->
						<div class="flex gap-3">
							<form
								method="POST"
								action="?/accept"
								use:enhance={() => {
									accepting = true;
									return async ({ update }) => {
										await update();
										accepting = false;
									};
								}}
								class="flex-1"
							>
								<button
									type="submit"
									disabled={accepting || declining}
									class="btn-gradient inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg text-sm font-medium text-white disabled:pointer-events-none disabled:opacity-50"
								>
									{#if accepting}
										<svg class="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
											<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25" />
											<path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" class="opacity-75" />
										</svg>
										Accepting...
									{:else}
										Accept Invitation
									{/if}
								</button>
							</form>
							<form
								method="POST"
								action="?/decline"
								use:enhance={() => {
									declining = true;
									return async ({ update }) => {
										await update();
										declining = false;
									};
								}}
							>
								<button
									type="submit"
									disabled={accepting || declining}
									class="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] px-5 text-sm font-medium text-foreground transition-all hover:bg-white/[0.06] disabled:pointer-events-none disabled:opacity-50"
								>
									{declining ? 'Declining...' : 'Decline'}
								</button>
							</form>
						</div>
						<p class="mt-3 text-center text-xs text-muted-foreground">
							Signed in as <strong class="text-foreground">{data.currentUser.email}</strong>
						</p>
					{/if}
				{:else}
					<!-- Not logged in -->
					<div class="text-center space-y-4">
						<p class="text-sm text-muted-foreground">
							Sign in to your Lunaris CDN account to accept this invitation.
						</p>
						<a
							href="/auth/login?redirect=/invite/{data.invitation.id}"
							class="btn-gradient inline-flex h-10 w-full items-center justify-center rounded-lg text-sm font-medium text-white"
						>
							Sign In to Accept
						</a>
						<p class="text-xs text-muted-foreground">
							Don't have an account?
							<a href="/auth/register" class="text-foreground transition-colors hover:text-primary">
								Sign up for free
							</a>
						</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
