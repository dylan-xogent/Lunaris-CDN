import { lt, eq } from 'drizzle-orm';
import type { Database } from './db/index.js';
import { uploadSession } from './db/schema.js';

/**
 * Clean up expired upload sessions.
 *
 * For each expired session:
 *  1. Abort the in-progress R2 multipart upload so the partial parts are freed.
 *  2. Delete the session row from D1.
 *
 * This function is designed to be called opportunistically when new uploads are
 * initiated (piggyback cleanup) so that stale sessions never accumulate. It is
 * safe to call concurrently and does not throw — individual failures are logged
 * and skipped so one bad session does not block the rest.
 *
 * @param db  - Drizzle database instance
 * @param r2  - Cloudflare R2 bucket binding
 */
export async function cleanupExpiredSessions(db: Database, r2: R2Bucket): Promise<void> {
	const now = new Date();

	// Fetch all sessions that have passed their expiry date
	const expired = await db.query.uploadSession.findMany({
		where: lt(uploadSession.expiresAt, now)
	});

	if (expired.length === 0) return;

	await Promise.all(
		expired.map(async (session) => {
			try {
				// Only abort in-progress multipart uploads — completed/cancelled ones
				// no longer have live multipart state in R2.
				if (session.status === 'in_progress') {
					const multipart = r2.resumeMultipartUpload(session.r2Key, session.r2UploadId);
					await multipart.abort();
				}
			} catch (err) {
				// The upload may have already been aborted or completed; log and continue.
				console.warn(
					`Failed to abort R2 multipart upload for session ${session.id} (key: ${session.r2Key}):`,
					err
				);
			}

			try {
				await db.delete(uploadSession).where(eq(uploadSession.id, session.id));
			} catch (err) {
				console.error(`Failed to delete expired upload session ${session.id} from D1:`, err);
			}
		})
	);
}
