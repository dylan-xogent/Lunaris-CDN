<script lang="ts">
	import { authClient } from '$lib/auth-client.js';
	import Input from '$lib/components/ui/input.svelte';
	import Label from '$lib/components/ui/label.svelte';
	import OAuthButtons from '$lib/components/auth/OAuthButtons.svelte';

	import { onMount } from 'svelte';

	// Capture ?redirect param once on mount — only allow local paths to prevent open redirect
	let redirectUrl = $state('/dashboard');

	onMount(() => {
		const param = new URLSearchParams(window.location.search).get('redirect');
		if (param && param.startsWith('/')) redirectUrl = param;
	});

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	// 2FA challenge state
	let twoFactorRequired = $state(false);
	let twoFactorMethod = $state<'email' | 'totp'>('email');
	let verifyCode = $state('');
	let twoFactorLoading = $state(false);
	let otpSending = $state(false);
	let otpSent = $state(false);

	// Passkey state
	let passkeyLoading = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			const result = await authClient.signIn.email({
				email,
				password
			});

			if (result.error) {
				error = result.error.message || 'Failed to sign in. Please check your credentials.';
			} else if (result.data?.twoFactorRedirect) {
				twoFactorRequired = true;
				// Auto-send email OTP
				await sendEmailOtp();
			} else {
				window.location.href = redirectUrl;
			}
		} catch (err) {
			error = 'An unexpected error occurred. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function sendEmailOtp() {
		otpSending = true;
		error = '';
		try {
			const result = await authClient.twoFactor.sendOtp();
			if (result.error) {
				error = result.error.message || 'Failed to send verification code.';
			} else {
				otpSent = true;
			}
		} catch {
			error = 'Failed to send verification code.';
		} finally {
			otpSending = false;
		}
	}

	async function handleVerify(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		twoFactorLoading = true;

		try {
			let result;
			if (twoFactorMethod === 'totp') {
				result = await authClient.twoFactor.verifyTOTP({ code: verifyCode });
			} else {
				result = await authClient.twoFactor.verifyOtp({ code: verifyCode });
			}

			if (result.error) {
				error = result.error.message || 'Invalid verification code.';
			} else {
				window.location.href = redirectUrl;
			}
		} catch (err) {
			error = 'An unexpected error occurred. Please try again.';
		} finally {
			twoFactorLoading = false;
		}
	}

	function switchToTotp() {
		twoFactorMethod = 'totp';
		verifyCode = '';
		error = '';
	}

	function switchToEmail() {
		twoFactorMethod = 'email';
		verifyCode = '';
		error = '';
		if (!otpSent) sendEmailOtp();
	}

	async function handlePasskeySignIn() {
		error = '';
		passkeyLoading = true;

		try {
			const result = await authClient.signIn.passkey();

			if (result?.error) {
				if (result.error.code === 'AUTH_CANCELLED') return;
				error = result.error.message || 'Passkey authentication failed.';
			} else {
				window.location.href = redirectUrl;
			}
		} catch (err) {
			error = 'Passkey authentication failed. Please try again.';
		} finally {
			passkeyLoading = false;
		}
	}

	function backToLogin() {
		twoFactorRequired = false;
		twoFactorMethod = 'email';
		verifyCode = '';
		otpSent = false;
		error = '';
	}
</script>

<svelte:head>
	<title>Sign In - Lunaris CDN</title>
</svelte:head>

<div class="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
	<!-- Background -->
	<div class="pointer-events-none absolute inset-0 grid-bg"></div>
	<div class="pointer-events-none absolute top-1/4 left-1/2 h-[400px] w-[500px] -translate-x-1/2 rounded-full bg-primary/6 blur-[100px]"></div>

	<div class="relative w-full max-w-md">
		<div class="mb-8 text-center">
			{#if twoFactorRequired}
				<h1 class="text-2xl font-bold">Verify your identity</h1>
				{#if twoFactorMethod === 'email'}
					<p class="mt-2 text-sm text-muted-foreground">We sent a code to <span class="text-foreground">{email}</span></p>
				{:else}
					<p class="mt-2 text-sm text-muted-foreground">Enter the code from your authenticator app</p>
				{/if}
			{:else}
				<h1 class="text-2xl font-bold">Welcome back</h1>
				<p class="mt-2 text-sm text-muted-foreground">Sign in to your account</p>
			{/if}
		</div>

		<!-- Card -->
		<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm">
			{#if twoFactorRequired}
				<!-- 2FA verification -->
				{#if error}
					<div class="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-red-400">
						{error}
					</div>
				{/if}

				{#if otpSending}
					<div class="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
						<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
						</svg>
						Sending verification code...
					</div>
				{/if}

				<form onsubmit={handleVerify} class="space-y-4">
					<div class="space-y-2">
						<Label for="verify-code">
							{twoFactorMethod === 'email' ? 'Email verification code' : 'Authenticator code'}
						</Label>
						<Input
							type="text"
							id="verify-code"
							name="verify-code"
							placeholder="000000"
							bind:value={verifyCode}
							required
							autocomplete="one-time-code"
							class="text-center text-lg tracking-[0.3em] font-mono"
						/>
					</div>

					<button
						type="submit"
						class="btn-gradient inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg text-sm font-medium text-white disabled:pointer-events-none disabled:opacity-50"
						disabled={twoFactorLoading || verifyCode.length < 6}
					>
						{#if twoFactorLoading}
							<svg class="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
								<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25" />
								<path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" class="opacity-75" />
							</svg>
							Verifying...
						{:else}
							Verify
						{/if}
					</button>
				</form>

				<div class="mt-4 space-y-2 text-center">
					{#if twoFactorMethod === 'email'}
						<button
							onclick={sendEmailOtp}
							disabled={otpSending}
							class="text-sm text-primary hover:underline cursor-pointer disabled:opacity-50"
						>
							Resend code
						</button>
						<div>
							<button
								onclick={switchToTotp}
								class="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
							>
								Use authenticator app instead
							</button>
						</div>
					{:else}
						<button
							onclick={switchToEmail}
							class="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
						>
							Send code to email instead
						</button>
					{/if}

					<div>
						<button
							onclick={backToLogin}
							class="text-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
						>
							Back to sign in
						</button>
					</div>
				</div>
			{:else}
				<!-- Normal login form -->
				<OAuthButtons callbackURL={redirectUrl} />

				<!-- Passkey sign-in -->
				<div class="mt-3">
					<button
						onclick={handlePasskeySignIn}
						disabled={passkeyLoading}
						class="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] text-sm font-medium text-foreground transition-all hover:bg-white/[0.06] hover:border-white/[0.1] disabled:pointer-events-none disabled:opacity-50"
					>
						{#if passkeyLoading}
							<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
								<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25" />
								<path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" class="opacity-75" />
							</svg>
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
								<circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
							</svg>
						{/if}
						Sign in with passkey
					</button>
				</div>

				<div class="my-6 flex items-center gap-3">
					<div class="h-px flex-1 bg-white/[0.06]"></div>
					<span class="text-xs text-muted-foreground/60">or continue with email</span>
					<div class="h-px flex-1 bg-white/[0.06]"></div>
				</div>

				{#if error}
					<div class="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-red-400">
						{error}
					</div>
				{/if}

				<form onsubmit={handleSubmit} class="space-y-4">
					<div class="space-y-2">
						<Label for="email">Email</Label>
						<Input
							type="email"
							id="email"
							name="email"
							placeholder="you@example.com"
							bind:value={email}
							required
							autocomplete="email"
						/>
					</div>

					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<Label for="password">Password</Label>
							<a href="/auth/forgot-password" class="text-xs text-muted-foreground transition-colors hover:text-primary">
								Forgot password?
							</a>
						</div>
						<Input
							type="password"
							id="password"
							name="password"
							placeholder="Enter your password"
							bind:value={password}
							required
							autocomplete="current-password"
						/>
					</div>

					<button
						type="submit"
						class="btn-gradient inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg text-sm font-medium text-white disabled:pointer-events-none disabled:opacity-50"
						disabled={loading}
					>
						{#if loading}
							<svg class="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
								<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25" />
								<path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" class="opacity-75" />
							</svg>
							Signing in...
						{:else}
							Sign in
						{/if}
					</button>
				</form>
			{/if}
		</div>

		{#if !twoFactorRequired}
			<p class="mt-6 text-center text-sm text-muted-foreground">
				Don't have an account?
				<a href="/auth/register" class="text-foreground transition-colors hover:text-primary">Create one</a>
			</p>
		{/if}
	</div>
</div>
