import { createAuthClient } from 'better-auth/svelte';
import { apiKeyClient, twoFactorClient } from 'better-auth/client/plugins';
import { passkeyClient } from '@better-auth/passkey/client';

export const authClient = createAuthClient({
	baseURL: 'https://lunaris.win',
	plugins: [apiKeyClient(), twoFactorClient(), passkeyClient()]
});
