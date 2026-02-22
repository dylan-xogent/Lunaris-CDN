<script lang="ts">
	import { authClient } from '$lib/auth-client.js';
	import { slugify } from '$lib/utils.js';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import OAuthButtons from '$lib/components/auth/OAuthButtons.svelte';

	let name = $state('');
	let username = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let success = $state(false);
	let loading = $state(false);

	function handleNameInput() {
		if (!username || username === slugify(name.slice(0, -1))) {
			username = slugify(name);
		}
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';

		if (password !== confirmPassword) {
			error = 'Passwords do not match.';
			return;
		}

		if (password.length < 8) {
			error = 'Password must be at least 8 characters.';
			return;
		}

		if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(username) && username.length > 1) {
			error = 'Username must contain only lowercase letters, numbers, and hyphens.';
			return;
		}

		loading = true;

		try {
			const result = await authClient.signUp.email({
				name,
				username,
				email,
				password
			});

			if (result.error) {
				error = result.error.message || 'Failed to create account.';
			} else {
				success = true;
			}
		} catch (err) {
			error = 'An unexpected error occurred. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Create Account - Lunaris CDN</title>
</svelte:head>

<div class="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
	<!-- Background -->
	<div class="pointer-events-none absolute inset-0 grid-bg"></div>
	<div class="pointer-events-none absolute top-1/3 left-1/2 h-[400px] w-[500px] -translate-x-1/2 rounded-full bg-primary/6 blur-[100px]"></div>

	<div class="relative w-full max-w-md">
		<div class="mb-8 text-center">
			{#if !success}
				<h1 class="text-2xl font-bold">Create your account</h1>
				<p class="mt-2 text-sm text-muted-foreground">Start hosting your files for free</p>
			{/if}
		</div>

		<!-- Card -->
		<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm">
			{#if success}
				<div class="text-center">
					<div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald/20 bg-emerald/10">
						<svg class="h-7 w-7 text-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h1 class="text-2xl font-bold">Check your email</h1>
					<p class="mt-3 text-sm text-muted-foreground">
						We sent a verification link to <span class="text-foreground">{email}</span>. Click it to activate your account.
					</p>
					<a href="/auth/login" class="mt-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
						<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
						</svg>
						Back to sign in
					</a>
				</div>
			{:else}
				<OAuthButtons />

				<div class="my-6 flex items-center gap-3">
					<div class="h-px flex-1 bg-white/[0.06]"></div>
					<span class="text-xs text-muted-foreground/60">or continue with email</span>
					<div class="h-px flex-1 bg-white/[0.06]"></div>
				</div>

				{#if error}
					<div class="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-red-400">
						{error}
					</div>
				{/if}

				<form onsubmit={handleSubmit} class="space-y-4">
					<div class="grid gap-4 sm:grid-cols-2">
						<div class="space-y-2">
							<Label for="name">Name</Label>
							<Input
								id="name"
								name="name"
								placeholder="Your name"
								bind:value={name}
								required
								autocomplete="name"
								oninput={handleNameInput}
							/>
						</div>

						<div class="space-y-2">
							<Label for="username">Username</Label>
							<Input
								id="username"
								name="username"
								placeholder="your-username"
								bind:value={username}
								required
								autocomplete="username"
							/>
						</div>
					</div>

					{#if username}
						<div class="rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2">
							<p class="font-mono text-xs text-muted-foreground">
								cdn.lunaris.win/<span class="text-primary">{username}</span>/project/file.exe
							</p>
						</div>
					{/if}

					<div class="space-y-2">
						<Label for="email">Email</Label>
						<Input
							type="email"
							id="email"
							name="email"
							placeholder="you@example.com"
							bind:value={email}
							required
							autocomplete="email"
						/>
					</div>

					<div class="grid gap-4 sm:grid-cols-2">
						<div class="space-y-2">
							<Label for="password">Password</Label>
							<Input
								type="password"
								id="password"
								name="password"
								placeholder="Min 8 characters"
								bind:value={password}
								required
								autocomplete="new-password"
							/>
						</div>

						<div class="space-y-2">
							<Label for="confirmPassword">Confirm</Label>
							<Input
								type="password"
								id="confirmPassword"
								name="confirmPassword"
								placeholder="Confirm password"
								bind:value={confirmPassword}
								required
								autocomplete="new-password"
							/>
						</div>
					</div>

					<button
						type="submit"
						class="btn-gradient inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg text-sm font-medium text-white disabled:pointer-events-none disabled:opacity-50"
						disabled={loading}
					>
						{#if loading}
							<svg class="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
								<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25" />
								<path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" class="opacity-75" />
							</svg>
							Creating account...
						{:else}
							Create account
						{/if}
					</button>
				</form>

				<p class="mt-4 text-center text-xs text-muted-foreground/60">
					By signing up you agree to our <a href="/privacy" class="underline underline-offset-2 hover:text-muted-foreground">Privacy Policy</a>.
				</p>
			{/if}
		</div>

		{#if !success}
			<p class="mt-6 text-center text-sm text-muted-foreground">
				Already have an account?
				<a href="/auth/login" class="text-foreground transition-colors hover:text-primary">Sign in</a>
			</p>
		{/if}
	</div>
</div>
