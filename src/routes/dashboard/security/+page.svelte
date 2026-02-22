<script lang="ts">
	import { authClient } from '$lib/auth-client.js';
	import Card from '$lib/components/ui/card.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import Alert from '$lib/components/ui/alert.svelte';

	interface Passkey {
		id: string;
		name: string | null;
		createdAt: Date;
	}

	interface Props {
		data: {
			user: {
				id: string;
				name: string;
				username: string;
				email: string;
				twoFactorEnabled?: boolean;
			};
		};
	}

	let { data }: Props = $props();

	// ─── QR Code SVG generator (simplified alphanumeric/binary QR) ───────────
	// We use a simple approach: render the TOTP URI as a data matrix via
	// a lightweight QR encoding. Since importing a full qr library adds weight,
	// we call a public API to fetch an SVG QR code image via fetch on the client.
	// Actually we'll use qrcode-svg-generator approach inline.

	// ─── TOTP section ──────────────────────────────────────────────────────────
	let totpEnabled = $state(data.user.twoFactorEnabled ?? false);
	let totpStep = $state<'idle' | 'setup' | 'verify' | 'backup'>('idle');
	let totpUri = $state('');
	let totpSecret = $state('');
	let totpQrSvg = $state('');
	let totpCode = $state('');
	let totpBackupCodes = $state<string[]>([]);
	let totpLoading = $state(false);
	let totpMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);
	let totpDisableCode = $state('');
	let totpDisabling = $state(false);
	let totpPassword = $state('');
	let copiedBackup = $state(false);

	// ─── Email 2FA section ─────────────────────────────────────────────────────
	let emailStep = $state<'idle' | 'sending' | 'verify'>('idle');
	let emailCode = $state('');
	let emailLoading = $state(false);
	let emailMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// ─── Passkeys section ──────────────────────────────────────────────────────
	let passkeys = $state<Passkey[]>([]);
	let passkeysLoading = $state(true);
	let passkeysError = $state<string | null>(null);
	let addingPasskey = $state(false);
	let showPasskeyNameInput = $state(false);
	let passkeyName = $state('');
	let passkeyMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);
	let deletingPasskeyId = $state<string | null>(null);

	// ─── QR helpers ────────────────────────────────────────────────────────────
	function extractSecretFromUri(uri: string): string {
		try {
			const url = new URL(uri);
			return url.searchParams.get('secret') ?? '';
		} catch {
			return '';
		}
	}

	// Generate a simple QR code by calling the Google Charts API
	// (client-side only; harmless for TOTP URIs which are already in the user's session)
	function buildQrImageUrl(uri: string): string {
		return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}&format=svg&bgcolor=0a0a0f&color=ffffff&margin=2`;
	}

	// ─── TOTP actions ──────────────────────────────────────────────────────────
	async function enableTotp() {
		totpLoading = true;
		totpMessage = null;
		try {
			const result = await authClient.twoFactor.enable({
				password: totpPassword
			});
			if (result.error) {
				totpMessage = { type: 'error', text: result.error.message ?? 'Failed to start TOTP setup.' };
				return;
			}
			if (result.data?.totpURI) {
				totpUri = result.data.totpURI;
				totpSecret = extractSecretFromUri(totpUri);
				totpStep = 'setup';
			}
		} catch (e) {
			totpMessage = { type: 'error', text: e instanceof Error ? e.message : 'Failed to start TOTP setup.' };
		} finally {
			totpLoading = false;
		}
	}

	async function verifyTotp() {
		if (totpCode.length !== 6) return;
		totpLoading = true;
		totpMessage = null;
		try {
			const result = await authClient.twoFactor.verifyTotp({
				code: totpCode
			});
			if (result.error) {
				totpMessage = { type: 'error', text: result.error.message ?? 'Invalid code. Try again.' };
				return;
			}
			// Fetch backup codes
			const backupResult = await authClient.twoFactor.viewBackupCodes();
			if (backupResult.data?.backupCodes) {
				totpBackupCodes = backupResult.data.backupCodes;
			}
			totpEnabled = true;
			totpStep = 'backup';
			totpCode = '';
		} catch (e) {
			totpMessage = { type: 'error', text: e instanceof Error ? e.message : 'Verification failed.' };
		} finally {
			totpLoading = false;
		}
	}

	async function disableTotp() {
		if (!totpDisableCode) return;
		totpDisabling = true;
		totpMessage = null;
		try {
			const result = await authClient.twoFactor.disable({
				password: totpDisableCode
			});
			if (result.error) {
				totpMessage = { type: 'error', text: result.error.message ?? 'Failed to disable TOTP.' };
				return;
			}
			totpEnabled = false;
			totpStep = 'idle';
			totpDisableCode = '';
			totpPassword = '';
			totpMessage = { type: 'success', text: 'TOTP authenticator has been disabled.' };
		} catch (e) {
			totpMessage = { type: 'error', text: e instanceof Error ? e.message : 'Failed to disable TOTP.' };
		} finally {
			totpDisabling = false;
		}
	}

	function copyBackupCodes() {
		navigator.clipboard.writeText(totpBackupCodes.join('\n'));
		copiedBackup = true;
		setTimeout(() => (copiedBackup = false), 2000);
	}

	function finishTotpSetup() {
		totpStep = 'idle';
		totpUri = '';
		totpSecret = '';
		totpPassword = '';
	}

	function cancelTotpSetup() {
		totpStep = 'idle';
		totpUri = '';
		totpSecret = '';
		totpCode = '';
		totpPassword = '';
		totpMessage = null;
	}

	// ─── Email 2FA actions ─────────────────────────────────────────────────────
	async function sendEmailCode() {
		emailLoading = true;
		emailMessage = null;
		try {
			const result = await authClient.twoFactor.sendOtp();
			if (result.error) {
				emailMessage = { type: 'error', text: result.error.message ?? 'Failed to send email code.' };
				return;
			}
			emailStep = 'verify';
			emailMessage = { type: 'success', text: `A 6-digit code was sent to ${data.user.email}.` };
		} catch (e) {
			emailMessage = { type: 'error', text: e instanceof Error ? e.message : 'Failed to send email code.' };
		} finally {
			emailLoading = false;
		}
	}

	async function verifyEmailCode() {
		if (emailCode.length !== 6) return;
		emailLoading = true;
		emailMessage = null;
		try {
			const result = await authClient.twoFactor.verifyOtp({
				code: emailCode
			});
			if (result.error) {
				emailMessage = { type: 'error', text: result.error.message ?? 'Invalid code. Try again.' };
				return;
			}
			emailStep = 'idle';
			emailCode = '';
			emailMessage = { type: 'success', text: 'Email 2FA verified successfully.' };
		} catch (e) {
			emailMessage = { type: 'error', text: e instanceof Error ? e.message : 'Verification failed.' };
		} finally {
			emailLoading = false;
		}
	}

	function cancelEmailVerify() {
		emailStep = 'idle';
		emailCode = '';
		emailMessage = null;
	}

	// ─── Passkey actions ───────────────────────────────────────────────────────
	async function loadPasskeys() {
		passkeysLoading = true;
		passkeysError = null;
		try {
			const result = await authClient.passkey.listUserPasskeys();
			if (result.error) {
				passkeysError = result.error.message ?? 'Failed to load passkeys.';
				return;
			}
			passkeys = (result.data ?? []) as Passkey[];
		} catch (e) {
			passkeysError = e instanceof Error ? e.message : 'Failed to load passkeys.';
		} finally {
			passkeysLoading = false;
		}
	}

	function startAddPasskey() {
		showPasskeyNameInput = true;
		passkeyName = '';
		passkeyMessage = null;
	}

	function cancelAddPasskey() {
		showPasskeyNameInput = false;
		passkeyName = '';
	}

	async function addPasskey() {
		addingPasskey = true;
		passkeyMessage = null;
		try {
			const result = await authClient.passkey.addPasskey({
				name: passkeyName.trim() || undefined
			});
			if (result?.error) {
				passkeyMessage = { type: 'error', text: result.error.message ?? 'Failed to register passkey.' };
				return;
			}
			passkeyName = '';
			showPasskeyNameInput = false;
			passkeyMessage = { type: 'success', text: 'Passkey registered successfully.' };
			await loadPasskeys();
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Failed to register passkey.';
			if (msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('abort') || msg.toLowerCase().includes('not allowed')) {
				passkeyMessage = { type: 'error', text: 'Passkey registration was cancelled.' };
			} else {
				passkeyMessage = { type: 'error', text: msg };
			}
		} finally {
			addingPasskey = false;
		}
	}

	async function deletePasskey(id: string) {
		try {
			const result = await authClient.passkey.deletePasskey({ id });
			if (result?.error) {
				passkeyMessage = { type: 'error', text: result.error.message ?? 'Failed to delete passkey.' };
				return;
			}
			passkeys = passkeys.filter((p) => p.id !== id);
			deletingPasskeyId = null;
			passkeyMessage = { type: 'success', text: 'Passkey removed.' };
		} catch (e) {
			passkeyMessage = { type: 'error', text: e instanceof Error ? e.message : 'Failed to delete passkey.' };
		}
	}

	function formatDate(date: Date | string): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Load passkeys on mount
	$effect(() => {
		loadPasskeys();
	});
</script>

<svelte:head>
	<title>Security - Lunaris CDN</title>
</svelte:head>

<div>
	<div class="mb-8">
		<h1 class="text-2xl font-bold">Security</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Manage two-factor authentication and passkeys for your account.
		</p>
	</div>

	<!-- ─── TOTP Authenticator App ─────────────────────────────────────────── -->
	<Card class="p-6 mb-6">
		<div class="flex items-start justify-between mb-1">
			<div>
				<h2 class="text-lg font-semibold">Authenticator App (TOTP)</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Use an authenticator app like Google Authenticator, Authy, or 1Password to generate time-based one-time codes.
				</p>
			</div>
			{#if totpEnabled}
				<span class="mt-1 shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
					Enabled
				</span>
			{:else}
				<span class="mt-1 shrink-0 rounded-full bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-muted-foreground">
					Disabled
				</span>
			{/if}
		</div>

		{#if totpMessage}
			<Alert variant={totpMessage.type === 'success' ? 'success' : 'destructive'} class="mt-4">
				{totpMessage.text}
			</Alert>
		{/if}

		{#if totpStep === 'idle'}
			{#if totpEnabled}
				<!-- Disable flow -->
				<div class="mt-4 space-y-3">
					<p class="text-sm text-muted-foreground">
						To disable TOTP, enter your account password to confirm.
					</p>
					<div class="flex items-end gap-3">
						<div class="flex-1">
							<Label for="totp-disable-code">Account Password</Label>
							<Input
								id="totp-disable-code"
								type="password"
								bind:value={totpDisableCode}
								placeholder="Your current password"
								class="mt-1.5"
							/>
						</div>
						<Button
							variant="destructive"
							disabled={totpDisabling || !totpDisableCode}
							onclick={disableTotp}
						>
							{totpDisabling ? 'Disabling...' : 'Disable TOTP'}
						</Button>
					</div>
				</div>
			{:else}
				<!-- Enable flow: prompt for password -->
				<div class="mt-4 space-y-3">
					<p class="text-sm text-muted-foreground">
						Enter your account password to begin TOTP setup.
					</p>
					<div class="flex items-end gap-3">
						<div class="flex-1">
							<Label for="totp-password">Account Password</Label>
							<Input
								id="totp-password"
								type="password"
								bind:value={totpPassword}
								placeholder="Your current password"
								class="mt-1.5"
							/>
						</div>
						<Button
							disabled={totpLoading || !totpPassword}
							onclick={enableTotp}
						>
							{totpLoading ? 'Loading...' : 'Enable TOTP'}
						</Button>
					</div>
				</div>
			{/if}

		{:else if totpStep === 'setup'}
			<!-- Show QR code and manual secret -->
			<div class="mt-4 space-y-4">
				<p class="text-sm text-muted-foreground">
					Scan the QR code below with your authenticator app, or enter the secret key manually.
				</p>

				<div class="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
					<!-- QR Code -->
					<div class="shrink-0 rounded-xl border border-white/[0.06] bg-white p-3">
						<img
							src={buildQrImageUrl(totpUri)}
							alt="TOTP QR Code"
							width="200"
							height="200"
							class="block"
						/>
					</div>

					<div class="flex-1 space-y-3 min-w-0">
						<div>
							<p class="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Manual Entry Secret</p>
							<div class="flex items-center gap-2">
								<code class="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 font-mono text-sm break-all min-w-0">
									{totpSecret}
								</code>
								<Button
									size="sm"
									variant="secondary"
									onclick={() => { navigator.clipboard.writeText(totpSecret); }}
								>
									Copy
								</Button>
							</div>
						</div>

						<Alert>
							<p class="text-xs text-muted-foreground">
								Open your authenticator app, tap "Add account" or "+", then scan the QR code or enter the secret above.
							</p>
						</Alert>
					</div>
				</div>

				<div class="space-y-2">
					<Label for="totp-verify-code">Verify — Enter the 6-digit code from your app</Label>
					<div class="flex items-center gap-3">
						<Input
							id="totp-verify-code"
							type="text"
							inputmode="numeric"
							bind:value={totpCode}
							placeholder="000000"
							maxlength={6}
							class="mt-0 w-40 font-mono tracking-widest text-center"
						/>
						<Button
							disabled={totpLoading || totpCode.length !== 6}
							onclick={verifyTotp}
						>
							{totpLoading ? 'Verifying...' : 'Verify & Enable'}
						</Button>
						<Button variant="ghost" onclick={cancelTotpSetup}>
							Cancel
						</Button>
					</div>
				</div>
			</div>

		{:else if totpStep === 'backup'}
			<!-- Show backup codes -->
			<div class="mt-4 space-y-4">
				<Alert variant="success">
					<p class="font-medium">TOTP enabled successfully!</p>
					<p class="mt-1 text-xs">Save your backup codes below. Each code can be used once if you lose access to your authenticator app.</p>
				</Alert>

				{#if totpBackupCodes.length > 0}
					<div>
						<div class="flex items-center justify-between mb-2">
							<p class="text-sm font-medium">Backup Codes</p>
							<Button size="sm" variant="secondary" onclick={copyBackupCodes}>
								{copiedBackup ? 'Copied!' : 'Copy All'}
							</Button>
						</div>
						<div class="grid grid-cols-2 gap-2">
							{#each totpBackupCodes as code}
								<code class="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 font-mono text-sm text-center">
									{code}
								</code>
							{/each}
						</div>
						<p class="mt-2 text-xs text-muted-foreground">
							Store these in a secure location such as a password manager. They will not be shown again.
						</p>
					</div>
				{/if}

				<Button onclick={finishTotpSetup}>
					I've saved my backup codes
				</Button>
			</div>
		{/if}
	</Card>

	<!-- ─── Email 2FA ──────────────────────────────────────────────────────── -->
	<Card class="p-6 mb-6">
		<div class="mb-1">
			<h2 class="text-lg font-semibold">Email Verification Code</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Receive a one-time 6-digit code at <span class="text-foreground font-medium">{data.user.email}</span> for additional sign-in verification.
			</p>
		</div>

		{#if emailMessage}
			<Alert variant={emailMessage.type === 'success' ? 'success' : 'destructive'} class="mt-4">
				{emailMessage.text}
			</Alert>
		{/if}

		{#if emailStep === 'idle'}
			<div class="mt-4">
				<Button
					variant="secondary"
					disabled={emailLoading}
					onclick={sendEmailCode}
				>
					{emailLoading ? 'Sending...' : 'Send Test Code'}
				</Button>
				<p class="mt-2 text-xs text-muted-foreground">
					Email 2FA is automatically used during sign-in when TOTP is not set up. Use this to verify your email delivery works correctly.
				</p>
			</div>

		{:else if emailStep === 'sending'}
			<div class="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
				<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
				</svg>
				Sending code...
			</div>

		{:else if emailStep === 'verify'}
			<div class="mt-4 space-y-3">
				<p class="text-sm text-muted-foreground">
					Enter the 6-digit code sent to your email address.
				</p>
				<div class="flex items-center gap-3">
					<Input
						type="text"
						inputmode="numeric"
						bind:value={emailCode}
						placeholder="000000"
						maxlength={6}
						class="w-40 font-mono tracking-widest text-center"
					/>
					<Button
						disabled={emailLoading || emailCode.length !== 6}
						onclick={verifyEmailCode}
					>
						{emailLoading ? 'Verifying...' : 'Verify'}
					</Button>
					<Button variant="ghost" onclick={cancelEmailVerify}>
						Cancel
					</Button>
				</div>
				<button
					type="button"
					class="text-xs text-primary hover:underline cursor-pointer"
					onclick={sendEmailCode}
				>
					Resend code
				</button>
			</div>
		{/if}
	</Card>

	<!-- ─── Passkeys ───────────────────────────────────────────────────────── -->
	<Card class="p-6">
		<div class="flex items-start justify-between mb-1">
			<div>
				<h2 class="text-lg font-semibold">Passkeys</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Use biometrics or a hardware security key to sign in without a password.
				</p>
			</div>
			{#if !showPasskeyNameInput}
				<Button
					size="sm"
					disabled={addingPasskey}
					onclick={startAddPasskey}
				>
					Add Passkey
				</Button>
			{/if}
		</div>

		{#if showPasskeyNameInput}
			<div class="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
				<div class="space-y-2">
					<Label for="passkey-name">Passkey name</Label>
					<Input
						id="passkey-name"
						type="text"
						bind:value={passkeyName}
						placeholder='e.g. "MacBook Touch ID" or "YubiKey"'
					/>
					<p class="text-xs text-muted-foreground">Give it a name so you remember which device or key it belongs to.</p>
				</div>
				<div class="flex items-center gap-2">
					<Button
						size="sm"
						disabled={addingPasskey}
						onclick={addPasskey}
					>
						{addingPasskey ? 'Registering...' : 'Register Passkey'}
					</Button>
					<Button size="sm" variant="ghost" onclick={cancelAddPasskey}>
						Cancel
					</Button>
				</div>
			</div>
		{/if}

		{#if passkeyMessage}
			<Alert variant={passkeyMessage.type === 'success' ? 'success' : 'destructive'} class="mt-4">
				{passkeyMessage.text}
			</Alert>
		{/if}

		<div class="mt-4">
			{#if passkeysLoading}
				<div class="py-6 text-center text-sm text-muted-foreground">Loading passkeys...</div>

			{:else if passkeysError}
				<Alert variant="destructive">{passkeysError}</Alert>

			{:else if passkeys.length === 0}
				<div class="rounded-xl border border-dashed border-white/[0.08] py-8 text-center">
					<div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04]">
						<svg class="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
						</svg>
					</div>
					<p class="text-sm font-medium">No passkeys registered</p>
					<p class="mt-1 text-xs text-muted-foreground">Add a passkey to enable biometric or hardware key sign-in.</p>
					<Button class="mt-4" size="sm" disabled={addingPasskey} onclick={startAddPasskey}>
						Add Your First Passkey
					</Button>
				</div>

			{:else}
				<div class="divide-y divide-white/[0.04]">
					{#each passkeys as pk (pk.id)}
						<div class="flex items-center justify-between py-3 first:pt-0 last:pb-0">
							<div class="flex items-center gap-3 min-w-0">
								<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
									<svg class="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
										<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
									</svg>
								</div>
								<div class="min-w-0">
									<p class="text-sm font-medium truncate">{pk.name ?? 'Passkey'}</p>
									<p class="text-xs text-muted-foreground">Registered {formatDate(pk.createdAt)}</p>
								</div>
							</div>
							<div class="ml-4 shrink-0">
								{#if deletingPasskeyId === pk.id}
									<div class="flex items-center gap-2">
										<span class="text-xs text-muted-foreground">Delete?</span>
										<Button size="sm" variant="destructive" onclick={() => deletePasskey(pk.id)}>
											Confirm
										</Button>
										<Button size="sm" variant="ghost" onclick={() => (deletingPasskeyId = null)}>
											Cancel
										</Button>
									</div>
								{:else}
									<Button size="sm" variant="ghost" onclick={() => (deletingPasskeyId = pk.id)}>
										Remove
									</Button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Info block -->
		<div class="mt-6 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
			<p class="text-xs text-muted-foreground leading-relaxed">
				<span class="font-medium text-foreground">How passkeys work:</span> When you add a passkey, your device creates a cryptographic key pair. The private key never leaves your device. On sign-in, your browser prompts for biometrics (Face ID, Touch ID, Windows Hello) or a hardware security key to authenticate.
			</p>
		</div>
	</Card>
</div>
