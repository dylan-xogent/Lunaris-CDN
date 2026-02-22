import { z } from 'zod';
import { jsonError } from './middleware.js';

// ─── Schemas ──────────────────────────────────────────────────

export const createProjectSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'Project name is required')
		.max(100, 'Project name must be 100 characters or less'),
	description: z.string().trim().max(500).optional(),
	isPublic: z.boolean().optional().default(true)
});

export const updateProjectSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'Project name is required')
		.max(100, 'Project name must be 100 characters or less')
		.optional(),
	description: z.string().trim().max(500).nullish(),
	isPublic: z.boolean().optional()
});

export const createVersionSchema = z.object({
	tag: z
		.string()
		.trim()
		.min(1, 'Version tag is required')
		.max(64, 'Version tag must be 64 characters or less')
		.regex(
			/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/,
			'Version tag must start with a letter or number and contain only letters, numbers, dots, hyphens, and underscores'
		)
});

export const initiateUploadSchema = z.object({
	projectSlug: z.string().trim().min(1, 'Project slug is required'),
	versionTag: z.string().trim().min(1, 'Version tag is required'),
	fileName: z
		.string()
		.trim()
		.min(1, 'File name is required')
		.max(255, 'File name must be 255 characters or less'),
	filePath: z.string().trim().max(1024).optional(),
	totalSize: z
		.number()
		.int()
		.positive('File size must be greater than 0')
		.max(5 * 1024 * 1024 * 1024, 'File size exceeds maximum of 5 GB')
});

export const completeUploadSchema = z.object({
	uploadSessionId: z.string().trim().min(1, 'Upload session ID is required'),
	sha256: z
		.string()
		.trim()
		.regex(/^[a-f0-9]{64}$/, 'Invalid SHA256 hash format')
});

export const quotaRequestSchema = z.object({
	requestedGB: z
		.number()
		.int()
		.min(1, 'Minimum request is 1 GB')
		.max(10000, 'Maximum request is 10,000 GB'),
	reason: z
		.string()
		.trim()
		.min(1, 'Reason is required')
		.max(1000, 'Reason must be 1000 characters or less')
});

// ─── Helper ───────────────────────────────────────────────────

export async function parseBody<T>(
	request: Request,
	schema: z.ZodType<T>
): Promise<{ data: T } | { error: Response }> {
	let raw: unknown;
	try {
		raw = await request.json();
	} catch {
		return { error: jsonError('Invalid JSON body', 400) };
	}

	const result = schema.safeParse(raw);
	if (!result.success) {
		const message = result.error.errors.map((e) => e.message).join('; ');
		return { error: jsonError(message, 400) };
	}

	return { data: result.data };
}
