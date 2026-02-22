import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({ parent }) => {
	const { user } = await parent();

	if (!user) {
		throw redirect(302, '/auth/login');
	}

	// OAuth users with temporary username need to choose one first
	if (user.username?.startsWith('~')) {
		throw redirect(302, '/auth/choose-username');
	}

	return { user };
};
