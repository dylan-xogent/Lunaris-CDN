<script lang="ts">
	import type { Snippet } from 'svelte';
	import { createSHA256 } from 'hash-wasm';
	import { formatBytes } from '$lib/utils.js';
	import Button from '$lib/components/ui/button.svelte';
	import Alert from '$lib/components/ui/alert.svelte';

	interface Props {
		projectSlug: string;
		versionTag: string;
		onuploadcomplete?: () => void;
		children?: Snippet;
	}

	let { projectSlug, versionTag, onuploadcomplete, children }: Props = $props();

	interface UploadingFile {
		file: File;
		status: 'pending' | 'uploading' | 'hashing' | 'completed' | 'error';
		progress: number;
		uploadedParts: number;
		totalParts: number;
		sha256: string;
		error: string;
		uploadSessionId: string;
		cancelled: boolean;
	}

	let files = $state<UploadingFile[]>([]);
	let dragOver = $state(false);
	let globalError = $state('');

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		if (e.dataTransfer?.files) {
			addFiles(Array.from(e.dataTransfer.files));
		}
	}

	function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files) {
			addFiles(Array.from(input.files));
			input.value = '';
		}
	}

	function addFiles(newFiles: File[]) {
		globalError = '';
		for (const file of newFiles) {
			if (file.size > 5 * 1024 * 1024 * 1024) {
				globalError = `${file.name} exceeds the 5 GB limit.`;
				continue;
			}
			if (files.some((f) => f.file.name === file.name)) {
				continue; // Skip duplicates
			}
			files.push({
				file,
				status: 'pending',
				progress: 0,
				uploadedParts: 0,
				totalParts: 0,
				sha256: '',
				error: '',
				uploadSessionId: '',
				cancelled: false
			});
		}
	}

	function removeFile(index: number) {
		files.splice(index, 1);
	}

	async function computeSHA256(file: File): Promise<string> {
		const hasher = await createSHA256();
		const stream = file.stream();
		const reader = stream.getReader();

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			hasher.update(value);
		}

		return hasher.digest('hex');
	}

	async function safeJson(res: Response): Promise<{ error?: string; [key: string]: unknown }> {
		try {
			return await res.json();
		} catch {
			return { error: `Server error (${res.status})` };
		}
	}

	async function abortSession(sessionId: string) {
		try {
			await fetch('/api/v1/upload/abort', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ uploadSessionId: sessionId })
			});
		} catch {
			// Best-effort cleanup
		}
	}

	function cancelUpload(f: UploadingFile) {
		f.cancelled = true;
	}

	async function uploadFile(uf: UploadingFile) {
		uf.status = 'hashing';
		uf.error = '';
		uf.cancelled = false;
		uf.uploadSessionId = '';

		let sessionId = '';

		try {
			// Compute SHA256
			const sha256 = await computeSHA256(uf.file);
			if (uf.cancelled) {
				uf.status = 'error';
				uf.error = 'Upload cancelled.';
				return;
			}
			uf.sha256 = sha256;

			uf.status = 'uploading';

			// Initiate upload
			const initRes = await fetch('/api/v1/upload/initiate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					projectSlug,
					versionTag,
					fileName: uf.file.name,
					filePath: uf.file.name,
					totalSize: uf.file.size
				})
			});

			const initData = await safeJson(initRes);
			if (!initRes.ok) {
				uf.status = 'error';
				uf.error = initData.error || 'Failed to initiate upload';
				return;
			}

			const { uploadSessionId, partSize, totalParts } = initData;
			sessionId = uploadSessionId as string;
			uf.uploadSessionId = sessionId;
			uf.totalParts = totalParts as number;

			// Upload parts
			for (let i = 0; i < (totalParts as number); i++) {
				if (uf.cancelled) {
					await abortSession(sessionId);
					uf.status = 'error';
					uf.error = 'Upload cancelled.';
					uf.uploadSessionId = '';
					return;
				}

				const start = i * (partSize as number);
				const end = Math.min(start + (partSize as number), uf.file.size);
				const chunk = uf.file.slice(start, end);

				const partRes = await fetch('/api/v1/upload/part', {
					method: 'PUT',
					headers: {
						'x-upload-session-id': sessionId,
						'x-part-number': String(i + 1),
						'Content-Type': 'application/octet-stream'
					},
					body: chunk
				});

				if (!partRes.ok) {
					const partErr = await safeJson(partRes);
					await abortSession(sessionId);
					uf.status = 'error';
					uf.error = partErr.error || `Failed to upload part ${i + 1}`;
					uf.uploadSessionId = '';
					return;
				}

				uf.uploadedParts = i + 1;
				uf.progress = ((i + 1) / (totalParts as number)) * 100;
			}

			// Complete upload
			const completeRes = await fetch('/api/v1/upload/complete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ uploadSessionId: sessionId, sha256 })
			});

			if (!completeRes.ok) {
				const completeErr = await safeJson(completeRes);
				await abortSession(sessionId);
				uf.status = 'error';
				uf.error = completeErr.error || 'Failed to complete upload';
				uf.uploadSessionId = '';
				return;
			}

			uf.status = 'completed';
			uf.progress = 100;
			uf.uploadSessionId = '';
		} catch (err) {
			// Network error or other failure — abort the server-side session
			if (sessionId) {
				await abortSession(sessionId);
				uf.uploadSessionId = '';
			}
			uf.status = 'error';
			uf.error = err instanceof Error ? err.message : 'An unexpected error occurred.';
		}
	}

	async function uploadAll() {
		const pending = files.filter((f) => f.status === 'pending' || f.status === 'error');
		for (const f of pending) {
			await uploadFile(f);
		}
		if (files.every((f) => f.status === 'completed')) {
			onuploadcomplete?.();
		}
	}

	let hasFiles = $derived(files.length > 0);
	let hasPending = $derived(files.some((f) => f.status === 'pending' || f.status === 'error'));
	let isUploading = $derived(files.some((f) => f.status === 'uploading' || f.status === 'hashing'));
</script>

<div>
	{#if globalError}
		<Alert variant="destructive" class="mb-4">{globalError}</Alert>
	{/if}

	<!-- Drop zone -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="relative rounded-xl border-2 border-dashed p-8 text-center transition-colors {dragOver
			? 'border-primary bg-primary/5'
			: 'border-border hover:border-muted-foreground'}"
		ondragover={(e) => {
			e.preventDefault();
			dragOver = true;
		}}
		ondragleave={() => (dragOver = false)}
		ondrop={handleDrop}
	>
		<svg class="mx-auto h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
		</svg>
		<p class="mt-3 text-sm text-muted-foreground">
			Drag and drop files here, or
			<label class="cursor-pointer text-primary hover:underline">
				browse
				<input type="file" class="hidden" multiple onchange={handleFileInput} />
			</label>
		</p>
		<p class="mt-1 text-xs text-muted-foreground">Up to 5 GB per file</p>
	</div>

	<!-- File list -->
	{#if hasFiles}
		<div class="mt-4 space-y-3">
			{#each files as f, i}
				<div class="rounded-lg border border-border p-3">
					<div class="flex items-center justify-between gap-3">
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<span class="truncate text-sm font-medium">{f.file.name}</span>
								<span class="shrink-0 text-xs text-muted-foreground">{formatBytes(f.file.size)}</span>
							</div>

							{#if f.status === 'hashing'}
								<p class="mt-1 text-xs text-muted-foreground">Computing checksum...</p>
							{:else if f.status === 'uploading'}
								<div class="mt-2">
									<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
										<div
											class="h-full rounded-full bg-primary transition-all duration-300"
											style="width: {f.progress}%"
										></div>
									</div>
									<p class="mt-1 text-xs text-muted-foreground">
										Part {f.uploadedParts}/{f.totalParts} · {f.progress.toFixed(0)}%
									</p>
								</div>
							{:else if f.status === 'completed'}
								<p class="mt-1 text-xs text-green-400">Uploaded successfully</p>
								{#if f.sha256}
									<p class="text-xs text-muted-foreground font-mono">
										SHA256: {f.sha256.substring(0, 16)}...
									</p>
								{/if}
							{:else if f.status === 'error'}
								<p class="mt-1 text-xs text-destructive">{f.error}</p>
							{/if}
						</div>

						<div class="flex items-center gap-2">
							{#if f.status === 'completed'}
								<svg class="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
							{:else if f.status === 'error'}
								<svg class="h-5 w-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							{/if}

							{#if f.status === 'uploading' || f.status === 'hashing'}
								<button
									class="rounded p-1 hover:bg-muted transition-colors cursor-pointer"
									title="Cancel upload"
									onclick={() => cancelUpload(f)}
								>
									<svg class="h-4 w-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
									</svg>
								</button>
							{:else if f.status === 'pending' || f.status === 'error'}
								<button
									class="rounded p-1 hover:bg-muted transition-colors cursor-pointer"
									onclick={() => removeFile(i)}
								>
									<svg class="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>

	{/if}

	<!-- Footer row -->
	<div class="mt-4 flex items-center justify-between">
		<div>
			{@render children?.()}
		</div>
		{#if hasFiles}
			<Button onclick={uploadAll} disabled={!hasPending || isUploading}>
				{#if isUploading}
					Uploading...
				{:else}
					Upload {files.filter((f) => f.status === 'pending' || f.status === 'error').length} File{files.filter((f) => f.status === 'pending' || f.status === 'error').length !== 1 ? 's' : ''}
				{/if}
			</Button>
		{/if}
	</div>
</div>
