<script lang="ts">
	import { authClient } from '$lib/auth-client.js';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import Alert from '$lib/components/ui/alert.svelte';

	let email = $state('');
	let error = $state('');
	let success = $state(false);
	let loading = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			const result = await authClient.forgetPassword({
				email,
				redirectTo: '/auth/reset-password'
			});

			if (result.error) {
				error = result.error.message || 'Failed to send reset email.';
			} else {
				success = true;
			}
		} catch (err) {
			error = 'An unexpected error occurred.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Forgot Password - Lunaris CDN</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
	<Card class="w-full max-w-md p-8">
		{#if success}
			<div class="text-center">
				<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
					<svg class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
					</svg>
				</div>
				<h1 class="text-2xl font-bold">Check your email</h1>
				<p class="mt-2 text-sm text-muted-foreground">
					If an account with that email exists, we sent a password reset link.
				</p>
				<a href="/auth/login" class="mt-6 inline-block text-sm text-primary hover:underline">
					Back to sign in
				</a>
			</div>
		{:else}
			<div class="mb-8 text-center">
				<h1 class="text-2xl font-bold">Forgot your password?</h1>
				<p class="mt-2 text-sm text-muted-foreground">Enter your email and we'll send you a reset link</p>
			</div>

			{#if error}
				<Alert variant="destructive" class="mb-4">
					{error}
				</Alert>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-4">
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

				<Button type="submit" class="w-full" disabled={loading}>
					{#if loading}
						Sending...
					{:else}
						Send Reset Link
					{/if}
				</Button>
			</form>

			<p class="mt-6 text-center text-sm text-muted-foreground">
				Remember your password?
				<a href="/auth/login" class="text-primary hover:underline">Sign in</a>
			</p>
		{/if}
	</Card>
</div>
