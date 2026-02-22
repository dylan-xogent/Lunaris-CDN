import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

// ─── BETTER AUTH CORE TABLES ───────────────────────────────────

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	username: text('username').notNull().unique(),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
	image: text('image'),
	role: text('role').notNull().default('user'),
	registrationIp: text('registration_ip'),
	twoFactorEnabled: integer('two_factor_enabled', { mode: 'boolean' }).default(false),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	token: text('token').notNull().unique(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const account = sqliteTable('account', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
	refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
	scope: text('scope'),
	idToken: text('id_token'),
	password: text('password'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const verification = sqliteTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
});

export const apikey = sqliteTable('apikey', {
	id: text('id').primaryKey(),
	name: text('name'),
	start: text('start'),
	prefix: text('prefix'),
	key: text('key').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	refillInterval: integer('refill_interval'),
	refillAmount: integer('refill_amount'),
	lastRefillAt: integer('last_refill_at', { mode: 'timestamp' }),
	enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
	rateLimitEnabled: integer('rate_limit_enabled', { mode: 'boolean' }).notNull().default(false),
	rateLimitTimeWindow: integer('rate_limit_time_window'),
	rateLimitMax: integer('rate_limit_max'),
	requestCount: integer('request_count').notNull().default(0),
	remaining: integer('remaining'),
	lastRequest: integer('last_request', { mode: 'timestamp' }),
	expiresAt: integer('expires_at', { mode: 'timestamp' }),
	permissions: text('permissions'),
	metadata: text('metadata'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// ─── APPLICATION TABLES ────────────────────────────────────────

export const project = sqliteTable(
	'project',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		slug: text('slug').notNull(),
		description: text('description'),
		isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(true),
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
	},
	(table) => [uniqueIndex('project_user_slug_idx').on(table.userId, table.slug)]
);

export const version = sqliteTable(
	'version',
	{
		id: text('id').primaryKey(),
		projectId: text('project_id')
			.notNull()
			.references(() => project.id, { onDelete: 'cascade' }),
		tag: text('tag').notNull(),
		isLatest: integer('is_latest', { mode: 'boolean' }).notNull().default(false),
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
	},
	(table) => [uniqueIndex('version_project_tag_idx').on(table.projectId, table.tag)]
);

export const file = sqliteTable('file', {
	id: text('id').primaryKey(),
	versionId: text('version_id')
		.notNull()
		.references(() => version.id, { onDelete: 'cascade' }),
	projectId: text('project_id')
		.notNull()
		.references(() => project.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	fileName: text('file_name').notNull(),
	filePath: text('file_path').notNull(),
	r2Key: text('r2_key').notNull().unique(),
	sizeBytes: integer('size_bytes').notNull(),
	mimeType: text('mime_type'),
	sha256: text('sha256').notNull(),
	downloadCount: integer('download_count').notNull().default(0),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const uploadSession = sqliteTable('upload_session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	projectId: text('project_id')
		.notNull()
		.references(() => project.id),
	versionId: text('version_id')
		.notNull()
		.references(() => version.id),
	fileName: text('file_name').notNull(),
	filePath: text('file_path').notNull(),
	r2Key: text('r2_key').notNull(),
	r2UploadId: text('r2_upload_id').notNull(),
	totalSize: integer('total_size').notNull(),
	partSize: integer('part_size').notNull(),
	totalParts: integer('total_parts').notNull(),
	uploadedParts: text('uploaded_parts').notNull().default('[]'),
	status: text('status').notNull().default('in_progress'),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const userQuota = sqliteTable('user_quota', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id, { onDelete: 'cascade' }),
	storageLimitBytes: integer('storage_limit_bytes').notNull().default(107_374_182_400),
	storageUsedBytes: integer('storage_used_bytes').notNull().default(0),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const quotaRequest = sqliteTable('quota_request', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	requestedBytes: integer('requested_bytes').notNull(),
	reason: text('reason').notNull(),
	status: text('status').notNull().default('pending'),
	adminNote: text('admin_note'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	resolvedAt: integer('resolved_at', { mode: 'timestamp' })
});

export const downloadLog = sqliteTable('download_log', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	fileId: text('file_id')
		.notNull()
		.references(() => file.id, { onDelete: 'cascade' }),
	ipHash: text('ip_hash'),
	userAgent: text('user_agent'),
	referer: text('referer'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

// ─── WEBHOOK TABLES ────────────────────────────────────────────

export const webhook = sqliteTable('webhook', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	projectId: text('project_id').references(() => project.id, { onDelete: 'cascade' }),
	url: text('url').notNull(),
	secret: text('secret').notNull(),
	events: text('events').notNull().default('[]'),
	enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const webhookDelivery = sqliteTable('webhook_delivery', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	webhookId: text('webhook_id')
		.notNull()
		.references(() => webhook.id, { onDelete: 'cascade' }),
	event: text('event').notNull(),
	payload: text('payload').notNull(),
	statusCode: integer('status_code'),
	response: text('response'),
	success: integer('success', { mode: 'boolean' }).notNull().default(false),
	attemptCount: integer('attempt_count').notNull().default(1),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

// ─── COLLABORATION TABLES ──────────────────────────────────────

export const projectMember = sqliteTable(
	'project_member',
	{
		id: text('id').primaryKey(),
		projectId: text('project_id')
			.notNull()
			.references(() => project.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		role: text('role').notNull().default('viewer'),
		invitedBy: text('invited_by').references(() => user.id),
		createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
	},
	(table) => [uniqueIndex('project_member_unique_idx').on(table.projectId, table.userId)]
);

export const projectInvitation = sqliteTable('project_invitation', {
	id: text('id').primaryKey(),
	projectId: text('project_id')
		.notNull()
		.references(() => project.id, { onDelete: 'cascade' }),
	email: text('email').notNull(),
	role: text('role').notNull().default('viewer'),
	invitedBy: text('invited_by')
		.notNull()
		.references(() => user.id),
	status: text('status').notNull().default('pending'),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

// ─── BETTER AUTH PLUGIN TABLES ────────────────────────────────

export const passkey = sqliteTable('passkey', {
	id: text('id').primaryKey(),
	name: text('name'),
	publicKey: text('public_key').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	credentialID: text('credential_id').notNull(),
	counter: integer('counter').notNull(),
	deviceType: text('device_type').notNull(),
	backedUp: integer('backed_up', { mode: 'boolean' }).notNull(),
	transports: text('transports'),
	createdAt: integer('created_at', { mode: 'timestamp' }),
	aaguid: text('aaguid')
});

export const twoFactor = sqliteTable('two_factor', {
	id: text('id').primaryKey(),
	secret: text('secret').notNull(),
	backupCodes: text('backup_codes').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' })
});
