<script lang="ts">
	import { cn } from '$lib/utils.js';

	interface Props {
		type?: string;
		value?: string;
		placeholder?: string;
		name?: string;
		id?: string;
		required?: boolean;
		disabled?: boolean;
		class?: string;
		autocomplete?: string;
		oninput?: (e: Event) => void;
		onchange?: (e: Event) => void;
	}

	let {
		type = 'text',
		value = $bindable(''),
		placeholder,
		name,
		id,
		required = false,
		disabled = false,
		class: className = '',
		autocomplete,
		oninput,
		onchange,
		...rest
	}: Props = $props();
</script>

<input
	{type}
	bind:value
	{placeholder}
	{name}
	{id}
	{required}
	{disabled}
	{autocomplete}
	{oninput}
	{onchange}
	class={cn(
		'flex h-10 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/30 focus-visible:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	{...rest}
/>
