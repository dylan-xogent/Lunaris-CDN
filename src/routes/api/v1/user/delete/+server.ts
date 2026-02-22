import { eq } from 'drizzle-orm';
import { getAuthenticatedUser, jsonError, jsonSuccess } from '$lib/server/middleware.js';
import { createDb } from '$lib/server/db/index.js';
import { account, file, project, uploadSession, user, userQuota } from '$lib/server/db/schema.js';
import type { RequestHandler } from './$types.js';

export const POST: RequestHandler = async (event) => {
	const authUser = await getAuthenticatedUser(event.request, event.platform!);
	if (!authUser) return jsonError('Unauthorized', 401);

	let body: Record<string, unknown>;
	try {
		body = await event.request.json();
	} catch {
		return jsonError('Invalid request body', 400);
	}

	const db = createDb(event.platform!.env.DB);

	// Determine whether this user has a password-based account
	const accounts = await db.query.account.findMany({
		where: eq(account.userId, authUser.id)
	});

	const passwordAccount = accounts.find((a) => a.providerId === 'credential' && a.password);

	if (passwordAccount) {
		// Email+password user — require password confirmation
		const password = body.password;
		if (typeof password !== 'string' || !password) {
			return jsonError('Password is required to delete your account', 400);
		}

		// Verify the password using PBKDF2 (same algorithm as auth.ts)
		const storedHash = passwordAccount.password!;
		const valid = await verifyPbkdf2(storedHash, password);
		if (!valid) {
			return jsonError('Incorrect password', 403);
		}
	} else {
		// OAuth-only user — require explicit confirmation flag
		if (body.confirm !== true) {
			return jsonError('Please confirm account deletion', 400);
		}
	}

	// ── Step 1: Collect all R2 keys for user files ─────────────────────────
	const userFiles = await db.query.file.findMany({
		where: eq(file.userId, authUser.id),
		columns: { r2Key: true }
	});

	// Also collect any avatar objects
	const avatarObjects = await event.platform!.env.R2.list({ prefix: `avatars/${authUser.id}.` });
	const avatarKeys = avatarObjects.objects.map((o) => o.key);

	// ── Step 2: Delete R2 objects (files + avatar) ─────────────────────────
	const r2Keys = userFiles.map((f) => f.r2Key).concat(avatarKeys);

	// R2 delete in batches of 1000 (Workers R2 limit per delete call)
	for (let i = 0; i < r2Keys.length; i += 1000) {
		const batch = r2Keys.slice(i, i + 1000);
		if (batch.length === 1) {
			await event.platform!.env.R2.delete(batch[0]);
		} else if (batch.length > 1) {
			await event.platform!.env.R2.delete(batch);
		}
	}

	// ── Step 3: Delete orphaned upload session records ─────────────────────
	// (no cascade from user, so delete manually)
	await db.delete(uploadSession).where(eq(uploadSession.userId, authUser.id));

	// ── Step 4: Delete quota record ────────────────────────────────────────
	// (has onDelete cascade but drizzle-sqlite may not enforce it for the same tx)
	await db.delete(userQuota).where(eq(userQuota.userId, authUser.id));

	// ── Step 5: Delete all projects (cascades to versions, files, members) ─
	await db.delete(project).where(eq(project.userId, authUser.id));

	// ── Step 6: Delete the user record ────────────────────────────────────
	// Sessions, accounts, apikeys cascade via FK onDelete: 'cascade'
	await db.delete(user).where(eq(user.id, authUser.id));

	return jsonSuccess({ success: true });
};

// ── PBKDF2 verification (mirrors auth.ts implementation) ────────────────────
const PBKDF2_ITERATIONS = 100_000;
const KEY_LENGTH = 32;

async function verifyPbkdf2(hash: string, password: string): Promise<boolean> {
	const parts = hash.split(':');
	if (parts[0] !== 'pbkdf2' || parts.length !== 3) return false;

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
	const derivedHex = [...new Uint8Array(derivedBits)].map((b) => b.toString(16).padStart(2, '0')).join('');
	return derivedHex === parts[2];
}
