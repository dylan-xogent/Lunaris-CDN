/**
 * Sanitize a user-supplied file path to prevent path traversal and injection attacks.
 *
 * Rules applied:
 *  - Reject paths containing null bytes
 *  - Reject paths with Windows-style backslash traversal sequences
 *  - Strip leading slashes so the path is always relative
 *  - Collapse consecutive slashes into a single slash
 *  - Resolve and reject any remaining ../ or .. segments
 *  - Reject absolute paths (after stripping leading slashes, a path must not
 *    start with a drive letter on Windows-style inputs)
 *
 * Throws an error if the path is invalid; returns the sanitized path otherwise.
 */
export function sanitizePath(path: string): string {
	// Reject null bytes
	if (path.includes('\0')) {
		throw new Error('File path contains invalid characters (null byte)');
	}

	// Reject backslashes entirely — they are unambiguously dangerous on all platforms
	if (path.includes('\\')) {
		throw new Error('File path must use forward slashes only');
	}

	// Strip leading slashes to make the path relative
	let sanitized = path.replace(/^\/+/, '');

	// Collapse consecutive slashes
	sanitized = sanitized.replace(/\/\/+/g, '/');

	// Reject Windows-style absolute paths (e.g. C:/...)
	if (/^[a-zA-Z]:/.test(sanitized)) {
		throw new Error('Absolute file paths are not allowed');
	}

	// Split into segments and resolve ../ traversal
	const segments = sanitized.split('/');
	const resolved: string[] = [];

	for (const segment of segments) {
		if (segment === '..') {
			// Attempting to traverse above root
			throw new Error('File path must not contain path traversal sequences (..)');
		}
		if (segment === '.') {
			// Current-directory references are harmless but unnecessary — skip them
			continue;
		}
		if (segment === '') {
			// Skip empty segments (trailing slash, etc.)
			continue;
		}
		resolved.push(segment);
	}

	if (resolved.length === 0) {
		throw new Error('File path must not be empty after sanitization');
	}

	return resolved.join('/');
}

/**
 * Parse and clamp pagination query parameters.
 *
 * @param searchParams - URL search params from the request
 * @param defaultLimit - default page size (default: 20)
 * @param maxLimit     - maximum allowed page size (default: 100)
 */
export function parsePagination(
	searchParams: URLSearchParams,
	defaultLimit = 20,
	maxLimit = 100
): { page: number; limit: number; offset: number } {
	const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
	const limit = Math.min(
		maxLimit,
		Math.max(1, parseInt(searchParams.get('limit') ?? String(defaultLimit), 10) || defaultLimit)
	);
	const offset = (page - 1) * limit;
	return { page, limit, offset };
}
