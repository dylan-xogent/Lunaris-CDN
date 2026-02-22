<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import { authClient } from '$lib/auth-client.js';

	interface Props {
		user: { id: string; name: string; username: string; email: string; image?: string | null; role?: string } | null;
	}

	let { user }: Props = $props();
	let menuOpen = $state(false);

	async function handleSignOut() {
		await authClient.signOut();
		window.location.href = '/';
	}
</script>

<nav class="fixed top-0 z-50 w-full">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between rounded-b-2xl border-b border-l border-r border-white/[0.04] bg-white/[0.02] px-6 backdrop-blur-xl">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-2.5 group">
				<img src="/logo.png" alt="Lunaris" class="h-10 w-10 transition-transform group-hover:scale-105" />
				<span class="text-lg font-semibold tracking-tight">Lunaris</span>
			</a>

			<!-- Desktop nav -->
			<div class="hidden items-center gap-1 md:flex">
				{#if user}
					<a href="/dashboard" class="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-white/[0.04]">
						Dashboard
					</a>
					<a href="/dashboard/projects" class="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-white/[0.04]">
						Projects
					</a>
					<a href="/dashboard/api-keys" class="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-white/[0.04]">
						API
					</a>
					<a href="/docs" class="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-white/[0.04]">
						Docs
					</a>

					{#if user.role === 'admin'}
						<a href="/admin" class="rounded-lg px-3 py-1.5 text-sm text-primary transition-colors hover:bg-primary/10 flex items-center gap-1.5">
							<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
							Admin
						</a>
					{/if}

					<div class="ml-3 h-5 w-px bg-white/[0.06]"></div>

					<div class="relative ml-3">
						<button
							class="flex items-center gap-2 rounded-full p-0.5 pr-3 transition-colors hover:bg-white/[0.04] cursor-pointer"
							onclick={() => (menuOpen = !menuOpen)}
						>
							{#if user.image}
								<img src={user.image} alt={user.name} class="h-7 w-7 rounded-full ring-1 ring-white/10" />
							{:else}
								<div class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/60 to-cyan/40 text-xs font-medium text-white">
									{user.name.charAt(0).toUpperCase()}
								</div>
							{/if}
							<span class="text-sm text-muted-foreground">{user.name}</span>
							<svg class="h-3.5 w-3.5 text-muted-foreground transition-transform {menuOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
							</svg>
						</button>

						{#if menuOpen}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div class="fixed inset-0 z-40" onclick={() => (menuOpen = false)} onkeydown={() => {}}></div>
							<div class="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-white/[0.06] bg-[#0c0c10]/95 p-1.5 shadow-2xl backdrop-blur-xl">
								<div class="mb-1.5 border-b border-white/[0.04] px-3 pb-2 pt-1">
									<p class="text-sm font-medium">{user.name}</p>
									<p class="text-xs text-muted-foreground">@{user.username}</p>
								</div>
								<a href="/dashboard" class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground" onclick={() => (menuOpen = false)}>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
									Dashboard
								</a>
								<a href="/dashboard/settings" class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground" onclick={() => (menuOpen = false)}>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
									Settings
								</a>
								<a href="/dashboard/api-keys" class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground" onclick={() => (menuOpen = false)}>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
									API Keys
								</a>
								{#if user.role === 'admin'}
									<div class="my-1.5 h-px bg-white/[0.04]"></div>
									<a href="/admin" class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-primary transition-colors hover:bg-primary/10" onclick={() => (menuOpen = false)}>
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
										Admin Panel
									</a>
								{/if}
								<div class="my-1.5 h-px bg-white/[0.04]"></div>
								<button
									class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10 cursor-pointer"
									onclick={handleSignOut}
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
									Sign Out
								</button>
							</div>
						{/if}
					</div>
				{:else}
					<a href="/about" class="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-white/[0.04]">
						About
					</a>
					<a href="/docs" class="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-white/[0.04]">
						Docs
					</a>
					<div class="ml-1 h-5 w-px bg-white/[0.06]"></div>
					<a href="/auth/login" class="ml-1 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-white/[0.04]">
						Log in
					</a>
					<a href="/auth/register" class="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-primary/50 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/20 hover:border-primary/70">
						Get Started
						<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
						</svg>
					</a>
				{/if}
			</div>

			<!-- Mobile menu button -->
			<button class="md:hidden rounded-lg p-2 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-colors cursor-pointer" onclick={() => (menuOpen = !menuOpen)}>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					{#if menuOpen}
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					{:else}
						<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
					{/if}
				</svg>
			</button>
		</div>
	</div>

	<!-- Mobile menu -->
	{#if menuOpen}
		<div class="mx-4 mt-1 rounded-2xl border border-white/[0.04] bg-[#0c0c10]/95 p-2 backdrop-blur-xl md:hidden sm:mx-6 lg:mx-8">
			{#if user}
				<div class="mb-2 flex items-center gap-3 rounded-xl bg-white/[0.02] px-3 py-3">
					{#if user.image}
						<img src={user.image} alt={user.name} class="h-9 w-9 rounded-full ring-1 ring-white/10" />
					{:else}
						<div class="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/60 to-cyan/40 text-sm font-medium text-white">
							{user.name.charAt(0).toUpperCase()}
						</div>
					{/if}
					<div>
						<p class="text-sm font-medium">{user.name}</p>
						<p class="text-xs text-muted-foreground">@{user.username}</p>
					</div>
				</div>
				<a href="/dashboard" class="block rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/[0.04] hover:text-foreground" onclick={() => (menuOpen = false)}>Dashboard</a>
				<a href="/dashboard/projects" class="block rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/[0.04] hover:text-foreground" onclick={() => (menuOpen = false)}>Projects</a>
				<a href="/dashboard/settings" class="block rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/[0.04] hover:text-foreground" onclick={() => (menuOpen = false)}>Settings</a>
				<a href="/dashboard/api-keys" class="block rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/[0.04] hover:text-foreground" onclick={() => (menuOpen = false)}>API Keys</a>
				<a href="/docs" class="block rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/[0.04] hover:text-foreground" onclick={() => (menuOpen = false)}>Docs</a>
				{#if user.role === 'admin'}
					<a href="/admin" class="block rounded-xl px-3 py-2.5 text-sm text-primary hover:bg-primary/10" onclick={() => (menuOpen = false)}>Admin Panel</a>
				{/if}
				<div class="my-1 h-px bg-white/[0.04]"></div>
				<button class="w-full rounded-xl px-3 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 cursor-pointer" onclick={handleSignOut}>
					Sign Out
				</button>
			{:else}
				<a href="/about" class="block rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/[0.04] hover:text-foreground" onclick={() => (menuOpen = false)}>About</a>
				<a href="/docs" class="block rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/[0.04] hover:text-foreground" onclick={() => (menuOpen = false)}>Docs</a>
				<div class="my-1 h-px bg-white/[0.04]"></div>
				<a href="/auth/login" class="block rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/[0.04] hover:text-foreground" onclick={() => (menuOpen = false)}>Log in</a>
				<a href="/auth/register" class="mt-1 block rounded-xl bg-primary/10 px-3 py-2.5 text-center text-sm font-medium text-primary-foreground hover:bg-primary/20" onclick={() => (menuOpen = false)}>Get Started</a>
			{/if}
		</div>
	{/if}
</nav>
