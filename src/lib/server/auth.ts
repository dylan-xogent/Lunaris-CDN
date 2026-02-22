import { eq } from 'drizzle-orm';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { apiKey, twoFactor } from 'better-auth/plugins';
import { passkey } from '@better-auth/passkey';
import { createDb } from './db/index.js';
import { user } from './db/schema.js';
import { sendEmail } from './email.js';
import { welcomeEmail } from './email-templates.js';
import { generateUnsubscribeToken } from './unsubscribe.js';

// Blocklist of known disposable/temporary email providers (anti-abuse)
const DISPOSABLE_EMAIL_DOMAINS = new Set([
	'tempmail.com', 'throwaway.email', 'guerrillamail.com', 'guerrillamail.net',
	'sharklasers.com', 'grr.la', 'guerrillamailblock.com', 'pokemail.net',
	'spam4.me', 'bccto.me', 'chacuo.net', 'discard.email', 'discardmail.com',
	'discardmail.de', 'disposableemailaddresses.emailmiser.com', 'drdrb.net',
	'emailisvalid.com', 'emailondeck.com', 'emailsensei.com', 'fakeinbox.com',
	'fastacura.com', 'filzmail.com', 'fixmail.tk', 'flitafir.de',
	'get2mail.fr', 'getairmail.com', 'gishpuppy.com', 'goemailgo.com',
	'gotmail.net', 'gowikibooks.com', 'great-host.in', 'greensloth.com',
	'haltospam.com', 'hotpop.com', 'ichimail.com', 'imstations.com',
	'inboxalias.com', 'jetable.com', 'jetable.net', 'jetable.org',
	'junk1.com', 'koszmail.pl', 'kurzepost.de', 'lhsdv.com',
	'lol.ovpn.to', 'lookugly.com', 'lortemail.dk', 'lr78.com',
	'mailcatch.com', 'maildrop.cc', 'mailexpire.com', 'mailforspam.com',
	'mailin8r.com', 'mailinator.com', 'mailinator2.com', 'mailincubator.com',
	'mailme.lv', 'mailnesia.com', 'mailnull.com', 'mailshell.com',
	'mailsiphon.com', 'mailslite.com', 'mailzilla.com', 'mintemail.com',
	'mobi.web.id', 'mt2015.com', 'mytemp.email', 'mytrashmail.com',
	'nobulk.com', 'noclickemail.com', 'nogmailspam.info', 'nomail.xl.cx',
	'nomail2me.com', 'nospam.ze.tc', 'notmailinator.com', 'notsharingmy.info',
	'nowmymail.com', 'objectmail.com', 'obobbo.com', 'onewaymail.com',
	'otherinbox.com', 'owlpic.com', 'pjjkp.com', 'politikerclub.de',
	'pookmail.com', 'proxymail.eu', 'putthisinyouremail.com', 'qq.com',
	'quickinbox.com', 'rcpt.at', 'reallymymail.com', 'recode.me',
	'regbypass.com', 'rhyta.com', 'rklips.com', 'rmqkr.net',
	'royal.net', 'rtrtr.com', 's0ny.net', 'safe-mail.net',
	'safersignup.de', 'safetymail.info', 'sandelf.de', 'saynotospams.com',
	'selfdestructingmail.com', 'shieldedmail.com', 'shortmail.net',
	'sibmail.com', 'skeefmail.com', 'slaskpost.se', 'slipry.net',
	'slopsbox.com', 'smashmail.de', 'soodonims.com', 'spam.la',
	'spamavert.com', 'spambob.net', 'spambog.com', 'spambog.de',
	'spambog.ru', 'spambox.us', 'spamcero.com', 'spamday.com',
	'spamex.com', 'spamfree24.com', 'spamfree24.de', 'spamfree24.eu',
	'spamfree24.info', 'spamfree24.net', 'spamfree24.org', 'spamgourmet.com',
	'spamherelots.com', 'spamhereplease.com', 'spamhole.com', 'spamify.com',
	'spaminator.de', 'spamkill.info', 'spaml.com', 'spaml.de',
	'spammotel.com', 'spamobox.com', 'spamoff.de', 'spamslicer.com',
	'spamspot.com', 'spamstack.net', 'spamthis.co.uk', 'spamtrail.com',
	'superrito.com', 'suremail.info', 'teleworm.us', 'temp-mail.org',
	'temp-mail.ru', 'tempail.com', 'tempalias.com', 'tempe4mail.com',
	'tempemail.co.za', 'tempemail.net', 'tempinbox.com', 'tempinbox.co.uk',
	'tempmail.eu', 'tempmail.it', 'tempmail2.com', 'tempmaildemo.com',
	'tempmailer.com', 'tempomail.fr', 'temporarily.de', 'temporarioemail.com.br',
	'temporaryemail.net', 'temporaryforwarding.com', 'temporaryinbox.com',
	'temporarymailaddress.com', 'thankyou2010.com', 'thisisnotmyrealemail.com',
	'throwawayemailaddress.com', 'tittbit.in', 'tradermail.info',
	'trash-amil.com', 'trash-mail.at', 'trash-mail.com', 'trash-mail.de',
	'trash2009.com', 'trashemail.de', 'trashmail.at', 'trashmail.com',
	'trashmail.de', 'trashmail.me', 'trashmail.net', 'trashmail.org',
	'trashmailer.com', 'trashymail.com', 'trashymail.net', 'turual.com',
	'twinmail.de', 'tyldd.com', 'uggsrock.com', 'upliftnow.com',
	'uplipht.com', 'venompen.com', 'veryreallybad.com', 'viditag.com',
	'viewcastmedia.com', 'viewcastmedia.net', 'viewcastmedia.org',
	'vomoto.com', 'vpn.st', 'vsimcard.com', 'vubby.com',
	'wasteland.rfc822.org', 'webemail.me', 'weg-werf-email.de',
	'wegwerfadresse.de', 'wegwerfemail.com', 'wegwerfemail.de',
	'wegwerfmail.de', 'wegwerfmail.net', 'wegwerfmail.org',
	'wh4f.org', 'whyspam.me', 'wickmail.net', 'wilemail.com',
	'willhackforfood.biz', 'willselfdestruct.com', 'winemaven.info',
	'wronghead.com', 'wuzup.net', 'wuzupmail.net', 'wwwnew.eu',
	'xagloo.com', 'xemaps.com', 'xents.com', 'xjoi.com',
	'xmaily.com', 'xoxy.net', 'yapped.net', 'yeah.net',
	'yep.it', 'yogamaven.com', 'yopmail.com', 'yopmail.fr',
	'yuurok.com', 'zehnminutenmail.de', 'zippymail.info', 'zoaxe.com',
	'zoemail.org', '10minutemail.com', '10minutemail.co.za', 'binkmail.com',
	'bobmail.info', 'chammy.info', 'devnullmail.com', 'dispostable.com',
	'emailigo.de', 'emailtemporario.com.br', 'ephemail.net', 'etranquil.com',
	'garbagemail.org', 'kasmail.com', 'mailblocks.com', 'mailcatch.com',
	'mailscrap.com', 'meltmail.com', 'nospamfor.us', 'recursor.net',
	'shitmail.me', 'spamfighter.cf', 'spamfighter.ga', 'spamfighter.gq',
	'spamfighter.ml', 'spamfighter.tk', 'trashdevil.com', 'trashdevil.de',
	'yomail.info'
]);

// Workers-compatible password hashing using PBKDF2 via Web Crypto API
// (scrypt exceeds Workers CPU limits)
const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
		'deriveBits'
	]);
	const derivedBits = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
		keyMaterial,
		KEY_LENGTH * 8
	);
	const saltHex = [...salt].map((b) => b.toString(16).padStart(2, '0')).join('');
	const hashHex = [...new Uint8Array(derivedBits)].map((b) => b.toString(16).padStart(2, '0')).join('');
	return `pbkdf2:${saltHex}:${hashHex}`;
}

async function verifyPassword({ hash, password }: { hash: string; password: string }): Promise<boolean> {
	const parts = hash.split(':');
	// Support new PBKDF2 format: "pbkdf2:salt:hash"
	if (parts[0] === 'pbkdf2' && parts.length === 3) {
		const salt = new Uint8Array(parts[1].match(/.{2}/g)!.map((b) => parseInt(b, 16)));
		const encoder = new TextEncoder();
		const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
			'deriveBits'
		]);
		const derivedBits = await crypto.subtle.deriveBits(
			{ name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
			keyMaterial,
			KEY_LENGTH * 8
		);
		const derivedHex = [...new Uint8Array(derivedBits)]
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');
		return derivedHex === parts[2];
	}
	// Reject old scrypt hashes — user must reset password
	return false;
}

function generateUsername(name: string, email: string): string {
	const slug = name
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_]+/g, '-')
		.replace(/^-+|-+$/g, '');
	if (slug.length >= 2) return slug;
	return email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '') || 'user';
}

export function createAuth(d1: D1Database, env: App.Platform['env'], clientIp?: string) {
	const db = createDb(d1);

	return betterAuth({
		baseURL: 'https://lunaris.win',
		secret: env.BETTER_AUTH_SECRET,
		database: drizzleAdapter(db, { provider: 'sqlite' }),
		user: {
			additionalFields: {
				username: {
					type: 'string',
					required: true,
					unique: true,
					input: true
				},
				registrationIp: {
					type: 'string',
					required: false,
					input: false
				}
			}
		},
		databaseHooks: {
			user: {
				create: {
					before: async (userData) => {
						// Block disposable email providers
						const emailDomain = userData.email?.split('@')[1]?.toLowerCase();
						if (emailDomain && DISPOSABLE_EMAIL_DOMAINS.has(emailDomain)) {
							throw new Error('Registration with disposable email addresses is not allowed. Please use a permanent email.');
						}

						// Auto-generate temporary username for OAuth signups (no username provided)
						// Prefixed with ~ so we can detect it and prompt the user to choose one
						if (!userData.username) {
							const rand = Math.random().toString(36).slice(2, 8);
							userData.username = `~${rand}`;
						}
						// All users have 2FA enforced — email OTP by default,
						// upgradeable to TOTP or passkeys
						userData.twoFactorEnabled = true;
						// Track the IP address used during registration (admin visibility)
						if (clientIp) {
							userData.registrationIp = clientIp;
						}
						return userData;
					},
					after: async (userData) => {
						// Send welcome email — fire-and-forget, never block sign-up
						try {
							const token = await generateUnsubscribeToken(userData.id, 'marketing', env.BETTER_AUTH_SECRET);
							const { subject, html } = welcomeEmail(userData.name, userData.username as string, token);
							void sendEmail(env.RESEND_API_KEY, { to: userData.email, subject, html });
						} catch {
							// Swallow all errors so user creation is never affected
						}
					}
				}
			}
		},
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			password: {
				hash: hashPassword,
				verify: verifyPassword
			},
			sendResetPassword: async ({ user, url }) => {
				await sendEmail(env.RESEND_API_KEY, {
					to: user.email,
					subject: 'Reset your Lunaris CDN password',
					html: `
						<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
							<h2>Password Reset</h2>
							<p>Hi ${user.name},</p>
							<p>Click the link below to reset your password. This link expires in 1 hour.</p>
							<a href="${url}" style="display: inline-block; padding: 12px 24px; background: #6d28d9; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a>
							<p style="color: #666; font-size: 14px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
						</div>
					`
				});
			}
		},
		emailVerification: {
			autoSignInAfterVerification: true,
			sendVerificationEmail: async ({ user, url }) => {
				const verificationUrl = new URL(url);
				verificationUrl.searchParams.set('callbackURL', '/auth/verified');
				const redirectUrl = verificationUrl.toString();
				await sendEmail(env.RESEND_API_KEY, {
					to: user.email,
					subject: 'Verify your Lunaris CDN email',
					html: `
						<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
							<h2>Email Verification</h2>
							<p>Hi ${user.name},</p>
							<p>Click the link below to verify your email address.</p>
							<a href="${redirectUrl}" style="display: inline-block; padding: 12px 24px; background: #6d28d9; color: white; text-decoration: none; border-radius: 6px;">Verify Email</a>
							<p style="color: #666; font-size: 14px; margin-top: 24px;">If you didn't create an account, you can safely ignore this email.</p>
						</div>
					`
				});
			}
		},
		socialProviders: {
			github: {
				clientId: env.GITHUB_CLIENT_ID,
				clientSecret: env.GITHUB_CLIENT_SECRET
			},
			google: {
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET
			}
		},
		session: {
			expiresIn: 60 * 60 * 24 * 30, // 30 days
			updateAge: 60 * 60 * 24 // update session every 24 hours
		},
		plugins: [
			apiKey(),
			twoFactor({
				issuer: 'Lunaris CDN',
				otpOptions: {
					digits: 6,
					async sendOTP({ user, otp }) {
						await sendEmail(env.RESEND_API_KEY, {
							to: user.email,
							subject: 'Your Lunaris CDN verification code',
							html: `
								<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
									<h2>Verification Code</h2>
									<p>Hi ${user.name},</p>
									<p>Your one-time verification code is:</p>
									<div style="margin: 24px 0; padding: 16px; background: #1a1a2e; border-radius: 8px; text-align: center;">
										<span style="font-size: 32px; font-weight: bold; letter-spacing: 0.3em; color: #ffffff; font-family: monospace;">${otp}</span>
									</div>
									<p style="color: #666; font-size: 14px;">This code expires in 3 minutes. If you didn't request this, you can safely ignore it.</p>
								</div>
							`
						});
					}
				}
			}),
			passkey({
				rpID: 'lunaris.win',
				rpName: 'Lunaris CDN',
				origin: 'https://lunaris.win'
			})
		]
	});
}

export type Auth = ReturnType<typeof createAuth>;
