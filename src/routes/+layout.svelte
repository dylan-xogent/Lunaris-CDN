<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/layout/Navbar.svelte';
	import Toast from '$lib/components/ui/toast.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		data: { user: { id: string; name: string; username: string; email: string; image?: string | null } | null };
		children: Snippet;
	}

	let { data, children }: Props = $props();
</script>

<svelte:head>
	<title>Lunaris CDN</title>
	<meta name="description" content="Free developer CDN for hosting installers, packages, and documentation." />
</svelte:head>

<div class="min-h-screen flex flex-col">
	<Navbar user={data.user} />
	<main class="flex-1">
		{@render children()}
	</main>
</div>
<Toast />
