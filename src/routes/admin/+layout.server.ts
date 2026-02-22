import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({ parent }) => {
	const { user } = await parent();

	if (!user) {
		throw redirect(302, '/auth/login');
	}

	if (user.role !== 'admin') {
		throw redirect(302, '/dashboard');
	}

	return { user };
};
