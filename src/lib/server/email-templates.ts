// ─── Shared layout helpers ─────────────────────────────────────────────────

function baseLayout(content: string, unsubscribeUrl?: string): string {
	const footer = unsubscribeUrl
		? `
		<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 20px;" />
		<p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.6;">
			&copy; ${new Date().getFullYear()} Lunaris CDN &mdash; lunaris.win<br />
			<a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe from these emails</a>
		</p>`
		: `
		<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 20px;" />
		<p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Lunaris CDN &mdash; lunaris.win</p>`;

	return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin: 0; padding: 0; background: #f9fafb; font-family: sans-serif;">
	<div style="max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
		<div style="background: #6d28d9; padding: 28px 32px;">
			<span style="color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">Lunaris CDN</span>
		</div>
		<div style="padding: 32px;">
			${content}
			${footer}
		</div>
	</div>
</body>
</html>`;
}

function btn(label: string, href: string): string {
	return `<a href="${href}" style="display: inline-block; padding: 12px 24px; background: #6d28d9; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; margin: 8px 0;">${label}</a>`;
}

function formatBytes(bytes: number): string {
	if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
	if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
	if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(1)} KB`;
	return `${bytes} B`;
}

// ─── Welcome Email ─────────────────────────────────────────────────────────

export function welcomeEmail(
	name: string,
	username: string,
	unsubscribeToken: string
): { subject: string; html: string } {
	const unsubscribeUrl = `https://lunaris.win/api/v1/email/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;

	const content = `
		<h2 style="color: #111827; margin: 0 0 8px; font-size: 22px; font-weight: 700;">Welcome to Lunaris CDN!</h2>
		<p style="color: #374151; margin: 0 0 20px; line-height: 1.6;">Hi ${escapeHtml(name)}, you're all set. Your username is <strong>@${escapeHtml(username)}</strong>. Here's how to get started:</p>

		<div style="background: #f5f3ff; border-left: 4px solid #6d28d9; border-radius: 0 6px 6px 0; padding: 16px 20px; margin: 0 0 24px;">
			<ol style="margin: 0; padding: 0 0 0 20px; color: #374151; line-height: 2;">
				<li><strong>Create a project</strong> &mdash; organise your releases by app or library</li>
				<li><strong>Upload files</strong> &mdash; drop in your binaries, zips, or any asset</li>
				<li><strong>Share via CDN URL</strong> &mdash; every file gets a permanent, fast CDN link</li>
			</ol>
		</div>

		<p style="color: #374151; margin: 0 0 6px; line-height: 1.6;">Your CDN URLs follow this pattern:</p>
		<code style="display: block; background: #f3f4f6; padding: 10px 14px; border-radius: 6px; font-size: 13px; color: #111827; margin: 0 0 24px; word-break: break-all;">https://cdn.lunaris.win/<em>username</em>/<em>project</em>/<em>version</em>/<em>file</em></code>

		<div style="display: flex; gap: 12px; flex-wrap: wrap;">
			${btn('Go to Dashboard', 'https://lunaris.win/dashboard')}
			<a href="https://lunaris.win/docs" style="display: inline-block; padding: 12px 24px; background: transparent; color: #6d28d9; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; margin: 8px 0; border: 2px solid #6d28d9;">View Docs</a>
		</div>

		<p style="color: #6b7280; font-size: 14px; margin: 24px 0 0; line-height: 1.6;">If you have any questions, reply to this email or reach us at <a href="mailto:support@lunaris.win" style="color: #6d28d9;">support@lunaris.win</a>.</p>`;

	return {
		subject: 'Welcome to Lunaris CDN!',
		html: baseLayout(content, unsubscribeUrl)
	};
}

// ─── Quota Warning Email ────────────────────────────────────────────────────

export function quotaWarningEmail(
	name: string,
	usedPct: number,
	usedBytes: number,
	limitBytes: number,
	unsubscribeToken: string
): { subject: string; html: string } {
	const unsubscribeUrl = `https://lunaris.win/api/v1/email/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
	const isCritical = usedPct >= 95;
	const accentColor = isCritical ? '#dc2626' : '#d97706';
	const badgeBg = isCritical ? '#fef2f2' : '#fffbeb';
	const severity = isCritical ? 'Critical' : 'Warning';

	const content = `
		<h2 style="color: #111827; margin: 0 0 8px; font-size: 22px; font-weight: 700;">Storage Quota ${severity}</h2>
		<p style="color: #374151; margin: 0 0 20px; line-height: 1.6;">Hi ${escapeHtml(name)},</p>

		<div style="background: ${badgeBg}; border-left: 4px solid ${accentColor}; border-radius: 0 6px 6px 0; padding: 16px 20px; margin: 0 0 24px;">
			<p style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: ${accentColor};">${usedPct}% used</p>
			<p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.5;">
				You've used <strong>${formatBytes(usedBytes)}</strong> of your <strong>${formatBytes(limitBytes)}</strong> storage limit.
			</p>
		</div>

		${
			isCritical
				? `<p style="color: #374151; margin: 0 0 20px; line-height: 1.6;">
				Your account is almost full. Uploads will be blocked once you hit 100%. Delete old files or request additional storage to keep things running.
			</p>`
				: `<p style="color: #374151; margin: 0 0 20px; line-height: 1.6;">
				You're approaching your storage limit. Consider cleaning up old files or requesting more quota before you run out.
			</p>`
		}

		<div style="display: flex; gap: 12px; flex-wrap: wrap; margin: 0 0 24px;">
			${btn('Request More Quota', 'https://lunaris.win/dashboard/quota')}
			<a href="https://lunaris.win/dashboard" style="display: inline-block; padding: 12px 24px; background: transparent; color: #6d28d9; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; margin: 8px 0; border: 2px solid #6d28d9;">Manage Files</a>
		</div>

		<p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.6;">Need help? Contact us at <a href="mailto:support@lunaris.win" style="color: #6d28d9;">support@lunaris.win</a>.</p>`;

	const subject = isCritical
		? `Action required: You've used ${usedPct}% of your Lunaris CDN storage`
		: `Heads up: You've used ${usedPct}% of your Lunaris CDN storage`;

	return { subject, html: baseLayout(content, unsubscribeUrl) };
}

// ─── Account Deleted Email ──────────────────────────────────────────────────

export function accountDeletedEmail(name: string): { subject: string; html: string } {
	const content = `
		<h2 style="color: #111827; margin: 0 0 8px; font-size: 22px; font-weight: 700;">Account Deleted</h2>
		<p style="color: #374151; margin: 0 0 20px; line-height: 1.6;">Hi ${escapeHtml(name)},</p>

		<p style="color: #374151; margin: 0 0 16px; line-height: 1.6;">
			Your Lunaris CDN account has been permanently deleted. All associated data has been removed, including:
		</p>

		<ul style="color: #374151; margin: 0 0 24px; padding: 0 0 0 20px; line-height: 2;">
			<li>Your profile and account settings</li>
			<li>All projects and uploaded files</li>
			<li>Storage quota and API keys</li>
			<li>Download analytics and logs</li>
		</ul>

		<p style="color: #374151; margin: 0 0 24px; line-height: 1.6;">
			CDN URLs that previously pointed to your files will no longer work.
		</p>

		<p style="color: #6b7280; font-size: 14px; margin: 0; line-height: 1.6;">
			If you believe this was a mistake or have questions, contact us at <a href="mailto:support@lunaris.win" style="color: #6d28d9;">support@lunaris.win</a> within 30 days.
		</p>`;

	return {
		subject: 'Your Lunaris CDN account has been deleted',
		html: baseLayout(content)
	};
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
