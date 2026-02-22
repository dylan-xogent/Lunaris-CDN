<svelte:head>
	<title>Privacy Policy - Lunaris CDN</title>
	<meta name="description" content="Privacy policy for Lunaris CDN. Learn how we handle your data." />
	<link rel="canonical" href="https://lunaris.win/privacy" />
</svelte:head>

<div class="relative">
	<div class="pointer-events-none absolute inset-0 grid-bg"></div>
	<div class="pointer-events-none absolute -top-32 left-1/2 h-[400px] w-[500px] -translate-x-1/2 rounded-full bg-primary/5 blur-[100px]"></div>

	<div class="relative mx-auto max-w-3xl px-4 pt-28 pb-20 sm:px-6 lg:px-8">
		<div class="mb-12">
			<p class="text-sm font-medium uppercase tracking-widest text-primary">Legal</p>
			<h1 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
			<p class="mt-3 text-muted-foreground">Last updated: February 21, 2026</p>
		</div>

		<div class="space-y-8 text-sm leading-relaxed text-muted-foreground [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mb-2 [&_h3]:font-medium [&_h3]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">

			<section>
				<h2>1. Introduction</h2>
				<p>
					Lunaris CDN ("we", "us", "our") operates the website lunaris.win and the cdn.lunaris.win content delivery service. This Privacy Policy explains how we collect, use, and protect your information when you use our services.
				</p>
			</section>

			<section>
				<h2>2. Information We Collect</h2>

				<h3>Account Information</h3>
				<p>When you create an account, we collect:</p>
				<ul>
					<li>Name and username</li>
					<li>Email address</li>
					<li>Password (stored as a secure hash, never in plain text)</li>
					<li>OAuth profile information (if you sign in with GitHub or Google), including your profile picture and email</li>
				</ul>

				<h3>Usage Data</h3>
				<p>When you use our services, we automatically collect:</p>
				<ul>
					<li>IP address (hashed for download logs, not stored in plain text)</li>
					<li>User agent string</li>
					<li>Referrer URL</li>
					<li>File download timestamps</li>
				</ul>

				<h3>Uploaded Content</h3>
				<p>
					Files you upload are stored on Cloudflare R2 object storage. We store file metadata including file names, sizes, SHA256 checksums, and MIME types. We do not inspect, analyze, or scan the content of your uploaded files.
				</p>
			</section>

			<section>
				<h2>3. How We Use Your Information</h2>
				<p>We use your information to:</p>
				<ul>
					<li>Provide and maintain the Lunaris CDN service</li>
					<li>Authenticate your identity and manage your account</li>
					<li>Send email verification and password reset emails</li>
					<li>Display download statistics for your projects</li>
					<li>Enforce storage quotas and rate limits</li>
					<li>Prevent abuse and maintain service integrity</li>
				</ul>
				<p class="mt-3">
					We do <strong class="text-foreground">not</strong> sell, rent, or share your personal information with third parties for marketing purposes. We do not serve advertisements. We do not use your data for AI training.
				</p>
			</section>

			<section>
				<h2>4. Third-Party Services</h2>
				<p>We use the following third-party services to operate Lunaris CDN:</p>
				<ul>
					<li><strong class="text-foreground">Cloudflare</strong> — hosting, CDN, DNS, D1 database, and R2 object storage. Subject to <a href="https://www.cloudflare.com/privacypolicy/" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Cloudflare's Privacy Policy</a>.</li>
					<li><strong class="text-foreground">Resend</strong> — transactional emails (verification, password reset). Subject to <a href="https://resend.com/legal/privacy-policy" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Resend's Privacy Policy</a>.</li>
					<li><strong class="text-foreground">GitHub / Google</strong> — OAuth authentication (only if you choose to sign in with these providers). Subject to their respective privacy policies.</li>
				</ul>
			</section>

			<section>
				<h2>5. Data Storage and Security</h2>
				<p>
					Your data is stored on Cloudflare's global infrastructure. We implement security measures including:
				</p>
				<ul>
					<li>HTTPS/TLS encryption for all data in transit</li>
					<li>Secure password hashing (scrypt)</li>
					<li>HTTP security headers (HSTS, CSP, X-Frame-Options)</li>
					<li>API key hashing (keys are not stored in plain text)</li>
					<li>IP address hashing in download logs</li>
				</ul>
			</section>

			<section>
				<h2>6. Data Retention</h2>
				<ul>
					<li><strong class="text-foreground">Account data</strong> — retained until you delete your account</li>
					<li><strong class="text-foreground">Uploaded files</strong> — retained until you delete them or your account</li>
					<li><strong class="text-foreground">Download logs</strong> — retained for analytics purposes; IP addresses are hashed and cannot be reversed</li>
					<li><strong class="text-foreground">Session data</strong> — automatically expires and is cleaned up</li>
				</ul>
			</section>

			<section>
				<h2>7. Your Rights</h2>
				<p>You have the right to:</p>
				<ul>
					<li>Access the personal data we hold about you</li>
					<li>Update or correct your account information</li>
					<li>Delete your uploaded files at any time</li>
					<li>Delete your account and all associated data</li>
					<li>Export your data</li>
				</ul>
				<p class="mt-3">
					To exercise any of these rights, contact us at <a href="mailto:privacy@lunaris.win" class="text-primary hover:underline">privacy@lunaris.win</a>.
				</p>
			</section>

			<section>
				<h2>8. Cookies</h2>
				<p>
					We use session cookies to keep you signed in. These are essential for the service to function and cannot be opted out of while using an account. We do not use tracking cookies, analytics cookies, or advertising cookies.
				</p>
			</section>

			<section>
				<h2>9. Children's Privacy</h2>
				<p>
					Lunaris CDN is not directed at children under 13 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us.
				</p>
			</section>

			<section>
				<h2>10. Changes to This Policy</h2>
				<p>
					We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last updated" date. Continued use of the service after changes constitutes acceptance of the updated policy.
				</p>
			</section>

			<section>
				<h2>11. Contact</h2>
				<p>
					If you have questions about this Privacy Policy, contact us at <a href="mailto:privacy@lunaris.win" class="text-primary hover:underline">privacy@lunaris.win</a>.
				</p>
			</section>
		</div>
	</div>
</div>
