<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	interface Props {
		class?: string;
		children: Snippet;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div class={cn('rounded-xl border border-white/[0.06] bg-white/[0.02] text-card-foreground', className)}>
	{@render children()}
</div>
