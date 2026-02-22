<script lang="ts" module>
	import { type Snippet } from 'svelte';

	export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
	export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';
</script>

<script lang="ts">
	import { cn } from '$lib/utils.js';

	interface Props {
		variant?: ButtonVariant;
		size?: ButtonSize;
		class?: string;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		href?: string;
		children: Snippet;
		onclick?: (e: MouseEvent) => void;
	}

	let {
		variant = 'default',
		size = 'default',
		class: className = '',
		disabled = false,
		type = 'button',
		href,
		children,
		onclick,
		...rest
	}: Props = $props();

	const baseStyles = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer';

	const variants: Record<ButtonVariant, string> = {
		default: 'btn-gradient text-white',
		secondary: 'bg-white/[0.04] text-secondary-foreground border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.1]',
		outline: 'border border-white/[0.08] bg-transparent hover:bg-white/[0.04] hover:border-white/[0.12]',
		ghost: 'hover:bg-white/[0.04] text-muted-foreground hover:text-foreground',
		destructive: 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 hover:border-destructive/30',
		link: 'text-primary underline-offset-4 hover:underline'
	};

	const sizes: Record<ButtonSize, string> = {
		default: 'h-10 px-4 py-2',
		sm: 'h-9 rounded-lg px-3',
		lg: 'h-11 rounded-lg px-8',
		icon: 'h-10 w-10'
	};
</script>

{#if href}
	<a {href} class={cn(baseStyles, variants[variant], sizes[size], className)} {...rest}>
		{@render children()}
	</a>
{:else}
	<button {type} {disabled} class={cn(baseStyles, variants[variant], sizes[size], className)} {onclick} {...rest}>
		{@render children()}
	</button>
{/if}
