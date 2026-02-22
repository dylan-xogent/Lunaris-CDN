<script lang="ts">

	interface Project {
		id: string;
		name: string;
		slug: string;
	}

	interface DailyPoint {
		date: string;
		count: number;
	}

	interface TopFile {
		fileId: string;
		fileName: string;
		projectName: string;
		count: number;
	}

	interface TopReferrer {
		referrer: string;
		count: number;
	}

	interface BrowserStat {
		browser: string;
		count: number;
	}

	interface AnalyticsData {
		totalDownloads: number;
		previousPeriodDownloads: number;
		dailyDownloads: DailyPoint[];
		topFiles: TopFile[];
		topReferrers: TopReferrer[];
		browserStats: BrowserStat[];
		uniqueFiles: number;
		topProject: string | null;
	}

	interface Props {
		data: {
			user: { id: string; name: string; username: string };
			projects: Project[];
		};
	}

	let { data }: Props = $props();

	// State
	let range = $state<'7d' | '30d' | '90d'>('30d');
	let selectedProjectId = $state<string>('');
	let analytics = $state<AnalyticsData | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Tooltip state
	let tooltipVisible = $state(false);
	let tooltipX = $state(0);
	let tooltipY = $state(0);
	let tooltipDate = $state('');
	let tooltipCount = $state(0);

	async function fetchAnalytics() {
		loading = true;
		error = null;
		try {
			const params = new URLSearchParams({ range });
			if (selectedProjectId) params.set('projectId', selectedProjectId);
			const res = await fetch(`/api/v1/analytics?${params}`);
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error ?? 'Failed to load analytics');
			}
			analytics = await res.json();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Unknown error';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		// Runs on mount and whenever range or projectId changes
		range;
		selectedProjectId;
		fetchAnalytics();
	});

	// Chart dimensions
	const chartWidth = 800;
	const chartHeight = 200;
	const paddingLeft = 48;
	const paddingRight = 16;
	const paddingTop = 16;
	const paddingBottom = 40;
	const innerWidth = chartWidth - paddingLeft - paddingRight;
	const innerHeight = chartHeight - paddingTop - paddingBottom;

	// Derived chart values
	let maxCount = $derived(
		analytics ? Math.max(1, ...analytics.dailyDownloads.map((d) => d.count)) : 1
	);

	let barWidth = $derived(
		analytics && analytics.dailyDownloads.length > 0
			? Math.max(2, innerWidth / analytics.dailyDownloads.length - 2)
			: 10
	);

	let xStep = $derived(
		analytics && analytics.dailyDownloads.length > 0
			? innerWidth / analytics.dailyDownloads.length
			: 10
	);

	// Y-axis tick values
	let yTicks = $derived(() => {
		const count = 4;
		return Array.from({ length: count + 1 }, (_, i) =>
			Math.round((maxCount / count) * (count - i))
		);
	});

	// Trend calculation
	let trend = $derived(() => {
		if (!analytics) return null;
		const curr = analytics.totalDownloads;
		const prev = analytics.previousPeriodDownloads;
		if (prev === 0) return curr > 0 ? { pct: 100, up: true } : null;
		const pct = Math.round(((curr - prev) / prev) * 100);
		return { pct: Math.abs(pct), up: pct >= 0 };
	});

	// Average daily
	let avgDaily = $derived(
		analytics && analytics.dailyDownloads.length > 0
			? Math.round(analytics.totalDownloads / analytics.dailyDownloads.length)
			: 0
	);

	// Browser stats max for scaling bars
	let browserMax = $derived(
		analytics && analytics.browserStats.length > 0
			? Math.max(...analytics.browserStats.map((b) => b.count))
			: 1
	);

	// Referrers max
	let referrerMax = $derived(
		analytics && analytics.topReferrers.length > 0
			? Math.max(...analytics.topReferrers.map((r) => r.count))
			: 1
	);

	// Top files max
	let filesMax = $derived(
		analytics && analytics.topFiles.length > 0
			? Math.max(...analytics.topFiles.map((f) => f.count))
			: 1
	);

	// X-axis label indices — show roughly 7 evenly-spaced labels
	let xLabelIndices = $derived(() => {
		const total = analytics?.dailyDownloads.length ?? 0;
		if (total === 0) return [] as number[];
		const step = Math.ceil(total / 7);
		const indices: number[] = [];
		for (let i = 0; i < total; i += step) indices.push(i);
		if (indices[indices.length - 1] !== total - 1) indices.push(total - 1);
		return indices;
	});

	function formatDate(isoDate: string): string {
		const d = new Date(isoDate + 'T00:00:00');
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function formatNumber(n: number): string {
		if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
		if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
		return n.toString();
	}

	function handleBarMouseEnter(
		event: MouseEvent,
		point: DailyPoint,
		index: number
	) {
		const svgEl = (event.currentTarget as SVGElement).closest('svg');
		if (!svgEl) return;
		const rect = svgEl.getBoundingClientRect();
		const barCenterX = paddingLeft + index * xStep + xStep / 2;
		const scaledX = (barCenterX / chartWidth) * rect.width;
		tooltipX = scaledX;
		tooltipY = 0;
		tooltipDate = formatDate(point.date);
		tooltipCount = point.count;
		tooltipVisible = true;
	}

	function handleBarMouseLeave() {
		tooltipVisible = false;
	}

	const rangeOptions: { value: '7d' | '30d' | '90d'; label: string }[] = [
		{ value: '7d', label: '7 days' },
		{ value: '30d', label: '30 days' },
		{ value: '90d', label: '90 days' }
	];

	const browserColors: Record<string, string> = {
		Chrome: '#4ade80',
		Firefox: '#f97316',
		Safari: '#60a5fa',
		Edge: '#a78bfa',
		Opera: '#f43f5e',
		Chromium: '#34d399',
		curl: '#fbbf24',
		wget: '#e879f9',
		Other: '#94a3b8',
		Unknown: '#475569'
	};

	function getBrowserColor(browser: string): string {
		return browserColors[browser] ?? '#94a3b8';
	}
</script>

<svelte:head>
	<title>Analytics - Lunaris CDN</title>
</svelte:head>

<div>
	<!-- Header -->
	<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold">Analytics</h1>
			<p class="mt-1 text-sm text-muted-foreground">Download activity for your files.</p>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<!-- Project filter -->
			{#if data.projects.length > 0}
				<select
					bind:value={selectedProjectId}
					class="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
				>
					<option value="">All Projects</option>
					{#each data.projects as proj}
						<option value={proj.id}>{proj.name}</option>
					{/each}
				</select>
			{/if}

			<!-- Range selector -->
			<div class="flex rounded-xl border border-white/[0.08] bg-white/[0.02] p-0.5">
				{#each rangeOptions as opt}
					<button
						onclick={() => (range = opt.value)}
						class="rounded-lg px-3 py-1.5 text-sm transition-all {range === opt.value
							? 'bg-white/[0.08] text-foreground font-medium'
							: 'text-muted-foreground hover:text-foreground'}"
					>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>
	</div>

	{#if error}
		<div class="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
			{error}
		</div>
	{/if}

	<!-- Stats cards -->
	<div class="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<!-- Total downloads -->
		<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
			<div class="flex items-start justify-between">
				<div class="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
					<svg class="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
					</svg>
				</div>
				{#if trend()}
					{@const t = trend()!}
					<span class="flex items-center gap-1 text-xs font-medium {t.up ? 'text-green-400' : 'text-red-400'}">
						<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
							{#if t.up}
								<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
							{:else}
								<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
							{/if}
						</svg>
						{t.pct}%
					</span>
				{/if}
			</div>
			<p class="mt-3 text-2xl font-bold tracking-tight">
				{#if loading}
					<span class="inline-block h-7 w-16 animate-pulse rounded-lg bg-white/[0.04]"></span>
				{:else}
					{formatNumber(analytics?.totalDownloads ?? 0)}
				{/if}
			</p>
			<p class="mt-0.5 text-xs text-muted-foreground">Total downloads</p>
		</div>

		<!-- Average daily -->
		<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
			<div class="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan/20 bg-cyan/10">
				<svg class="h-4 w-4 text-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
				</svg>
			</div>
			<p class="mt-3 text-2xl font-bold tracking-tight">
				{#if loading}
					<span class="inline-block h-7 w-12 animate-pulse rounded-lg bg-white/[0.04]"></span>
				{:else}
					{formatNumber(avgDaily)}
				{/if}
			</p>
			<p class="mt-0.5 text-xs text-muted-foreground">Avg. per day</p>
		</div>

		<!-- Unique files -->
		<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
			<div class="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
				<svg class="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
				</svg>
			</div>
			<p class="mt-3 text-2xl font-bold tracking-tight">
				{#if loading}
					<span class="inline-block h-7 w-12 animate-pulse rounded-lg bg-white/[0.04]"></span>
				{:else}
					{formatNumber(analytics?.uniqueFiles ?? 0)}
				{/if}
			</p>
			<p class="mt-0.5 text-xs text-muted-foreground">Unique files</p>
		</div>

		<!-- Top project -->
		<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
			<div class="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
				<svg class="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
				</svg>
			</div>
			<p class="mt-3 truncate text-lg font-bold tracking-tight">
				{#if loading}
					<span class="inline-block h-7 w-24 animate-pulse rounded-lg bg-white/[0.04]"></span>
				{:else if analytics?.topProject}
					{analytics.topProject}
				{:else}
					<span class="text-muted-foreground text-sm">None</span>
				{/if}
			</p>
			<p class="mt-0.5 text-xs text-muted-foreground">Top project</p>
		</div>
	</div>

	<!-- Daily downloads chart -->
	<div class="mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
		<h2 class="mb-5 text-sm font-medium">Downloads Over Time</h2>

		{#if loading}
			<div class="h-[200px] animate-pulse rounded-xl bg-white/[0.02]"></div>
		{:else if analytics && analytics.dailyDownloads.length > 0}
			<!-- SVG chart wrapper with relative positioning for tooltip -->
			<div class="relative w-full">
				<svg
					viewBox="0 0 {chartWidth} {chartHeight}"
					class="w-full overflow-visible"
					style="height: {chartHeight}px"
					role="img"
					aria-label="Daily downloads bar chart"
				>
					<defs>
						<linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stop-color="var(--color-primary, #a855f7)" stop-opacity="0.9" />
							<stop offset="100%" stop-color="#22d3ee" stop-opacity="0.6" />
						</linearGradient>
						<linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stop-color="var(--color-primary, #a855f7)" stop-opacity="1" />
							<stop offset="100%" stop-color="#22d3ee" stop-opacity="0.9" />
						</linearGradient>
					</defs>

					<!-- Y-axis grid lines and labels -->
					{#each yTicks() as tick, i}
						{@const y = paddingTop + (i / (yTicks().length - 1)) * innerHeight}
						<line
							x1={paddingLeft}
							y1={y}
							x2={chartWidth - paddingRight}
							y2={y}
							stroke="rgba(255,255,255,0.04)"
							stroke-width="1"
						/>
						<text
							x={paddingLeft - 6}
							y={y + 4}
							text-anchor="end"
							font-size="10"
							fill="rgba(255,255,255,0.3)"
						>
							{formatNumber(tick)}
						</text>
					{/each}

					<!-- Bars -->
					{#each analytics.dailyDownloads as point, i}
						{@const barH = maxCount > 0 ? (point.count / maxCount) * innerHeight : 0}
						{@const x = paddingLeft + i * xStep + (xStep - barWidth) / 2}
						{@const y = paddingTop + innerHeight - barH}
						<rect
							{x}
							{y}
							width={barWidth}
							height={Math.max(barH, point.count > 0 ? 2 : 0)}
							rx="2"
							fill="url(#barGrad)"
							class="cursor-pointer transition-opacity hover:opacity-100 opacity-80"
							onmouseenter={(e) => handleBarMouseEnter(e, point, i)}
							onmouseleave={handleBarMouseLeave}
							role="graphics-symbol"
							aria-label="{formatDate(point.date)}: {point.count} downloads"
						/>
					{/each}

					<!-- X-axis labels -->
					{#each xLabelIndices() as idx}
						{@const point = analytics.dailyDownloads[idx]}
						{@const x = paddingLeft + idx * xStep + xStep / 2}
						<text
							{x}
							y={chartHeight - 6}
							text-anchor="middle"
							font-size="10"
							fill="rgba(255,255,255,0.3)"
						>
							{formatDate(point.date)}
						</text>
					{/each}
				</svg>

				<!-- Tooltip -->
				{#if tooltipVisible}
					<div
						class="pointer-events-none absolute -top-10 z-10 -translate-x-1/2 rounded-lg border border-white/[0.08] bg-background/90 px-2.5 py-1.5 text-xs backdrop-blur-sm"
						style="left: {tooltipX}px"
					>
						<span class="font-medium text-foreground">{tooltipCount} downloads</span>
						<span class="ml-1.5 text-muted-foreground">{tooltipDate}</span>
					</div>
				{/if}
			</div>
		{:else}
			<div class="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
				No download data for this period.
			</div>
		{/if}
	</div>

	<!-- Bottom row: Top Files + Referrers + Browsers -->
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Top Files -->
		<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
			<h2 class="mb-5 text-sm font-medium">Top Files</h2>

			{#if loading}
				<div class="space-y-3">
					{#each { length: 5 } as _}
						<div class="h-9 animate-pulse rounded-lg bg-white/[0.02]"></div>
					{/each}
				</div>
			{:else if analytics && analytics.topFiles.length > 0}
				<div class="space-y-2">
					{#each analytics.topFiles as f, i}
						{@const pct = filesMax > 0 ? (f.count / filesMax) * 100 : 0}
						<div class="group relative">
							<!-- Bar background -->
							<div
								class="absolute inset-y-0 left-0 rounded-lg bg-primary/[0.06] transition-all group-hover:bg-primary/[0.10]"
								style="width: {pct}%"
							></div>
							<div class="relative flex items-center gap-3 rounded-lg px-3 py-2">
								<span class="w-5 shrink-0 text-center text-xs font-medium text-muted-foreground">
									{i + 1}
								</span>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium">{f.fileName}</p>
									<p class="truncate text-xs text-muted-foreground">{f.projectName}</p>
								</div>
								<span class="shrink-0 text-sm font-medium tabular-nums">
									{formatNumber(f.count)}
								</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="py-8 text-center text-sm text-muted-foreground">No file downloads in this period.</p>
			{/if}
		</div>

		<!-- Right column: Referrers + Browsers stacked -->
		<div class="space-y-6">
			<!-- Top Referrers -->
			<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
				<h2 class="mb-5 text-sm font-medium">Top Referrers</h2>

				{#if loading}
					<div class="space-y-3">
						{#each { length: 5 } as _}
							<div class="h-7 animate-pulse rounded-lg bg-white/[0.02]"></div>
						{/each}
					</div>
				{:else if analytics && analytics.topReferrers.length > 0}
					<div class="space-y-2">
						{#each analytics.topReferrers as ref}
							{@const pct = referrerMax > 0 ? (ref.count / referrerMax) * 100 : 0}
							<div class="flex items-center gap-3">
								<div class="min-w-0 flex-1">
									<div class="mb-1 flex items-center justify-between gap-2">
										<span class="truncate text-sm">{ref.referrer}</span>
										<span class="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
											{formatNumber(ref.count)}
										</span>
									</div>
									<div class="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
										<div
											class="h-full rounded-full bg-gradient-to-r from-primary to-cyan"
											style="width: {pct}%"
										></div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="py-4 text-center text-sm text-muted-foreground">No referrer data.</p>
				{/if}
			</div>

			<!-- Browser Breakdown -->
			<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
				<h2 class="mb-5 text-sm font-medium">Browsers & Clients</h2>

				{#if loading}
					<div class="space-y-3">
						{#each { length: 4 } as _}
							<div class="h-7 animate-pulse rounded-lg bg-white/[0.02]"></div>
						{/each}
					</div>
				{:else if analytics && analytics.browserStats.length > 0}
					<div class="space-y-2">
						{#each analytics.browserStats as b}
							{@const pct = browserMax > 0 ? (b.count / browserMax) * 100 : 0}
							<div class="flex items-center gap-3">
								<!-- Color dot -->
								<span
									class="h-2.5 w-2.5 shrink-0 rounded-full"
									style="background-color: {getBrowserColor(b.browser)}"
								></span>
								<div class="min-w-0 flex-1">
									<div class="mb-1 flex items-center justify-between gap-2">
										<span class="text-sm">{b.browser}</span>
										<span class="text-xs font-medium tabular-nums text-muted-foreground">
											{formatNumber(b.count)}
										</span>
									</div>
									<div class="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
										<div
											class="h-full rounded-full transition-all"
											style="width: {pct}%; background-color: {getBrowserColor(b.browser)}; opacity: 0.7"
										></div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="py-4 text-center text-sm text-muted-foreground">No client data.</p>
				{/if}
			</div>
		</div>
	</div>
</div>
