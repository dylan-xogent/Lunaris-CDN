<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	interface Props {
		variant?: 'default' | 'destructive' | 'success';
		class?: string;
		children: Snippet;
	}

	let { variant = 'default', class: className = '', children }: Props = $props();

	const variants = {
		default: 'border-white/[0.06] bg-white/[0.02] text-foreground',
		destructive: 'border-destructive/20 bg-destructive/5 text-red-400',
		success: 'border-emerald/20 bg-emerald/5 text-emerald'
	};
</script>

<div class={cn('relative w-full rounded-lg border p-4 text-sm', variants[variant], className)} role="alert">
	{@render children()}
</div>
