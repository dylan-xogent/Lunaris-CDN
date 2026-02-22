<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client.js';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Card from '$lib/components/ui/card.svelte';
	import Alert from '$lib/components/ui/alert.svelte';

	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let success = $state(false);
	let loading = $state(false);

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

		loading = true;

		try {
			const token = $page.url.searchParams.get('token');
			if (!token) {
				error = 'Invalid or missing reset token.';
				return;
			}

			const result = await authClient.resetPassword({
				newPassword: password,
				token
			});

			if (result.error) {
				error = result.error.message || 'Failed to reset password.';
			} else {
				success = true;
				setTimeout(() => goto('/auth/login'), 3000);
			}
		} catch (err) {
			error = 'An unexpected error occurred.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Reset Password - Lunaris CDN</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
	<Card class="w-full max-w-md p-8">
		{#if success}
			<div class="text-center">
				<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
					<svg class="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h1 class="text-2xl font-bold">Password reset</h1>
				<p class="mt-2 text-sm text-muted-foreground">
					Your password has been updated. Redirecting to sign in...
				</p>
			</div>
		{:else}
			<div class="mb-8 text-center">
				<h1 class="text-2xl font-bold">Reset your password</h1>
				<p class="mt-2 text-sm text-muted-foreground">Enter a new password for your account</p>
			</div>

			{#if error}
				<Alert variant="destructive" class="mb-4">
					{error}
				</Alert>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-4">
				<div class="space-y-2">
					<Label for="password">New Password</Label>
					<Input
						type="password"
						id="password"
						name="password"
						placeholder="At least 8 characters"
						bind:value={password}
						required
						autocomplete="new-password"
					/>
				</div>

				<div class="space-y-2">
					<Label for="confirmPassword">Confirm New Password</Label>
					<Input
						type="password"
						id="confirmPassword"
						name="confirmPassword"
						placeholder="Confirm your password"
						bind:value={confirmPassword}
						required
						autocomplete="new-password"
					/>
				</div>

				<Button type="submit" class="w-full" disabled={loading}>
					{#if loading}
						Resetting...
					{:else}
						Reset Password
					{/if}
				</Button>
			</form>
		{/if}
	</Card>
</div>
