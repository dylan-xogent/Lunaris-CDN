<script lang="ts">
	import { slugify } from '$lib/utils.js';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Alert from '$lib/components/ui/alert.svelte';

	interface Props {
		data: {
			user: { id: string; name: string; email: string };
		};
	}

	let { data }: Props = $props();

	let username = $state(slugify(data.user.name));
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';

		if (username.length < 2) {
			error = 'Username must be at least 2 characters.';
			return;
		}

		if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(username) && username.length > 1) {
			error = 'Username must contain only lowercase letters, numbers, and hyphens.';
			return;
		}

		loading = true;

		try {
			const res = await fetch('/api/v1/user/username', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username })
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to set username');
			}

			window.location.href = '/dashboard';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Something went wrong.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Choose Username - Lunaris CDN</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center px-4">
	<div class="w-full max-w-md">
		<div class="mb-8 text-center">
			<h1 class="text-2xl font-bold">Choose your username</h1>
			<p class="mt-2 text-sm text-muted-foreground">
				Welcome, {data.user.name}! Pick a unique username for your profile. This can't be changed later.
			</p>
		</div>

		<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
			{#if error}
				<Alert variant="destructive" class="mb-4">{error}</Alert>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<Label for="username">Username</Label>
					<div class="relative mt-1.5">
						<span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
						<Input
							id="username"
							bind:value={username}
							placeholder="your-username"
							class="pl-7"
							required
						/>
					</div>
					<p class="mt-1.5 text-xs text-muted-foreground">
						Lowercase letters, numbers, and hyphens only. This will be your public profile URL: lunaris.win/@{username || '...'}
					</p>
				</div>

				<Button type="submit" class="w-full" disabled={loading || !username}>
					{loading ? 'Setting username...' : 'Continue'}
				</Button>
			</form>
		</div>
	</div>
</div>
