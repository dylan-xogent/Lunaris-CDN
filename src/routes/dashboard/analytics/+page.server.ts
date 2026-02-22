import { eq } from 'drizzle-orm';
import { createDb } from '$lib/server/db/index.js';
import { project } from '$lib/server/db/schema.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ parent, platform }) => {
	const { user } = await parent();

	if (!platform) {
		return { projects: [] };
	}

	const db = createDb(platform.env.DB);

	const projects = await db
		.select({ id: project.id, name: project.name, slug: project.slug })
		.from(project)
		.where(eq(project.userId, user.id))
		.orderBy(project.name);

	return { projects };
};
