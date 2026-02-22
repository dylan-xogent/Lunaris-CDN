import { json } from '@sveltejs/kit';
import { eq, and, gte, lt, sql, desc, inArray } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { downloadLog, file, project } from '$lib/server/db/schema.js';
import { getAuthenticatedUser, jsonError } from '$lib/server/middleware.js';
import type { RequestHandler } from './$types.js';

function parseBrowser(userAgent: string | null): string {
	if (!userAgent) return 'Unknown';
	const ua = userAgent.toLowerCase();
	if (ua.includes('edg/') || ua.includes('edge/')) return 'Edge';
	if (ua.includes('opr/') || ua.includes('opera')) return 'Opera';
	if (ua.includes('chrome') && !ua.includes('chromium')) return 'Chrome';
	if (ua.includes('chromium')) return 'Chromium';
	if (ua.includes('firefox')) return 'Firefox';
	if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
	if (ua.includes('curl')) return 'curl';
	if (ua.includes('wget')) return 'wget';
	return 'Other';
}

function getReferrerDomain(referer: string | null): string {
	if (!referer || referer.trim() === '') return 'Direct';
	try {
		const url = new URL(referer);
		return url.hostname || 'Direct';
	} catch {
		return 'Direct';
	}
}

export const GET: RequestHandler = async ({ request, platform, url }) => {
	if (!platform) return jsonError('Platform not available', 500);

	const user = await getAuthenticatedUser(request, platform);
	if (!user) return jsonError('Unauthorized', 401);

	const range = url.searchParams.get('range') ?? '30d';
	const projectId = url.searchParams.get('projectId') ?? null;

	const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;

	const now = new Date();
	const rangeStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
	const prevRangeStart = new Date(rangeStart.getTime() - days * 24 * 60 * 60 * 1000);

	const db = createDb(platform.env.DB);

	// Get user's files (scoped to project if filter applied)
	const fileConditions = projectId
		? and(eq(file.userId, user.id), eq(file.projectId, projectId))
		: eq(file.userId, user.id);

	const userFiles = await db
		.select({ id: file.id, fileName: file.fileName, projectId: file.projectId })
		.from(file)
		.where(fileConditions);

	// Build empty daily array helper
	const buildEmptyDaily = () =>
		Array.from({ length: days }, (_, i) => {
			const d = new Date(rangeStart.getTime() + i * 24 * 60 * 60 * 1000);
			return { date: d.toISOString().slice(0, 10), count: 0 };
		});

	if (userFiles.length === 0) {
		return json({
			totalDownloads: 0,
			previousPeriodDownloads: 0,
			dailyDownloads: buildEmptyDaily(),
			topFiles: [],
			topReferrers: [],
			browserStats: [],
			uniqueFiles: 0,
			topProject: null
		});
	}

	const fileIds = userFiles.map((f) => f.id);

	// Total downloads in current range
	const totalResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(downloadLog)
		.where(and(inArray(downloadLog.fileId, fileIds), gte(downloadLog.createdAt, rangeStart)));

	// Previous period total (for trend comparison)
	const prevTotalResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(downloadLog)
		.where(
			and(
				inArray(downloadLog.fileId, fileIds),
				gte(downloadLog.createdAt, prevRangeStart),
				lt(downloadLog.createdAt, rangeStart)
			)
		);

	// Daily downloads for chart — group by date string
	const dailyResult = await db
		.select({
			date: sql<string>`date(${downloadLog.createdAt}, 'unixepoch')`,
			count: sql<number>`count(*)`
		})
		.from(downloadLog)
		.where(and(inArray(downloadLog.fileId, fileIds), gte(downloadLog.createdAt, rangeStart)))
		.groupBy(sql`date(${downloadLog.createdAt}, 'unixepoch')`)
		.orderBy(sql`date(${downloadLog.createdAt}, 'unixepoch')`);

	// Fill in zeros for days with no downloads
	const dailyMap = new Map<string, number>();
	for (const row of dailyResult) {
		dailyMap.set(row.date, row.count);
	}
	const dailyDownloads = buildEmptyDaily().map((entry) => ({
		date: entry.date,
		count: dailyMap.get(entry.date) ?? 0
	}));

	// Top files by download count in range
	const topFilesResult = await db
		.select({
			fileId: downloadLog.fileId,
			count: sql<number>`count(*)`
		})
		.from(downloadLog)
		.where(and(inArray(downloadLog.fileId, fileIds), gte(downloadLog.createdAt, rangeStart)))
		.groupBy(downloadLog.fileId)
		.orderBy(desc(sql`count(*)`))
		.limit(10);

	// Fetch project names for lookup
	const userProjects = await db
		.select({ id: project.id, name: project.name })
		.from(project)
		.where(eq(project.userId, user.id));

	const projectMap = new Map(userProjects.map((p) => [p.id, p.name]));
	const fileMap = new Map(userFiles.map((f) => [f.id, f]));

	const topFiles = topFilesResult.map((row) => {
		const f = fileMap.get(row.fileId);
		return {
			fileId: row.fileId,
			fileName: f?.fileName ?? 'Unknown',
			projectName: f ? (projectMap.get(f.projectId) ?? 'Unknown') : 'Unknown',
			count: row.count
		};
	});

	// Top referrers — fetch raw, then aggregate by domain in JS
	const referrerResult = await db
		.select({
			referer: downloadLog.referer,
			count: sql<number>`count(*)`
		})
		.from(downloadLog)
		.where(and(inArray(downloadLog.fileId, fileIds), gte(downloadLog.createdAt, rangeStart)))
		.groupBy(downloadLog.referer)
		.orderBy(desc(sql`count(*)`))
		.limit(200);

	const referrerDomainMap = new Map<string, number>();
	for (const row of referrerResult) {
		const domain = getReferrerDomain(row.referer);
		referrerDomainMap.set(domain, (referrerDomainMap.get(domain) ?? 0) + row.count);
	}
	const topReferrers = Array.from(referrerDomainMap.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, 10)
		.map(([referrer, count]) => ({ referrer, count }));

	// Browser stats — fetch raw user agents, aggregate in JS
	const uaResult = await db
		.select({
			userAgent: downloadLog.userAgent,
			count: sql<number>`count(*)`
		})
		.from(downloadLog)
		.where(and(inArray(downloadLog.fileId, fileIds), gte(downloadLog.createdAt, rangeStart)))
		.groupBy(downloadLog.userAgent);

	const browserMap = new Map<string, number>();
	for (const row of uaResult) {
		const browser = parseBrowser(row.userAgent);
		browserMap.set(browser, (browserMap.get(browser) ?? 0) + row.count);
	}
	const browserStats = Array.from(browserMap.entries())
		.sort((a, b) => b[1] - a[1])
		.map(([browser, count]) => ({ browser, count }));

	// Unique files downloaded in range
	const uniqueFilesResult = await db
		.select({ count: sql<number>`count(distinct ${downloadLog.fileId})` })
		.from(downloadLog)
		.where(and(inArray(downloadLog.fileId, fileIds), gte(downloadLog.createdAt, rangeStart)));

	// Top project by download count in range
	const perFileResult = await db
		.select({
			fileId: downloadLog.fileId,
			count: sql<number>`count(*)`
		})
		.from(downloadLog)
		.where(and(inArray(downloadLog.fileId, fileIds), gte(downloadLog.createdAt, rangeStart)))
		.groupBy(downloadLog.fileId);

	const projectDownloads = new Map<string, number>();
	for (const row of perFileResult) {
		const f = fileMap.get(row.fileId);
		if (f) {
			projectDownloads.set(f.projectId, (projectDownloads.get(f.projectId) ?? 0) + row.count);
		}
	}
	let topProject: string | null = null;
	let topProjectCount = 0;
	for (const [pid, count] of projectDownloads.entries()) {
		if (count > topProjectCount) {
			topProjectCount = count;
			topProject = projectMap.get(pid) ?? null;
		}
	}

	return json({
		totalDownloads: totalResult[0]?.count ?? 0,
		previousPeriodDownloads: prevTotalResult[0]?.count ?? 0,
		dailyDownloads,
		topFiles,
		topReferrers,
		browserStats,
		uniqueFiles: uniqueFilesResult[0]?.count ?? 0,
		topProject
	});
};
