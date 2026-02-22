<script lang="ts">
	import { toast, type Toast } from '$lib/stores/toast.svelte';

	const typeConfig = {
		success: {
			border: 'border-emerald-500/20',
			icon_color: 'text-emerald-400',
			title: 'Success'
		},
		error: {
			border: 'border-red-500/20',
			icon_color: 'text-red-400',
			title: 'Error'
		},
		warning: {
			border: 'border-yellow-500/20',
			icon_color: 'text-yellow-400',
			title: 'Warning'
		},
		info: {
			border: 'border-blue-500/20',
			icon_color: 'text-blue-400',
			title: 'Info'
		}
	} satisfies Record<Toast['type'], { border: string; icon_color: string; title: string }>;
</script>

<div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
	{#each toast.toasts as t (t.id)}
		<div
			class="pointer-events-auto flex items-start gap-3 rounded-xl border bg-[#0c0c10]/95 backdrop-blur-xl px-4 py-3 shadow-2xl shadow-black/40 min-w-[300px] max-w-[420px] animate-slide-in {typeConfig[t.type].border}"
			role="alert"
			aria-live="assertive"
		>
			<span class="mt-0.5 shrink-0 {typeConfig[t.type].icon_color}">
				{#if t.type === 'success'}
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"/>
						<path d="m9 12 2 2 4-4"/>
					</svg>
				{:else if t.type === 'error'}
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"/>
						<path d="m15 9-6 6"/>
						<path d="m9 9 6 6"/>
					</svg>
				{:else if t.type === 'warning'}
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
						<path d="M12 9v4"/>
						<path d="M12 17h.01"/>
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"/>
						<path d="M12 16v-4"/>
						<path d="M12 8h.01"/>
					</svg>
				{/if}
			</span>

			<div class="flex-1 min-w-0">
				<p class="text-sm font-medium text-white/90 leading-snug">{t.message}</p>
			</div>

			<button
				onclick={() => toast.dismiss(t.id)}
				class="shrink-0 mt-0.5 text-white/30 hover:text-white/70 transition-colors cursor-pointer"
				aria-label="Dismiss notification"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 6 6 18"/>
					<path d="m6 6 12 12"/>
				</svg>
			</button>
		</div>
	{/each}
</div>

<style>
	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateX(100%);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.animate-slide-in {
		animation: slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
	}
</style>
