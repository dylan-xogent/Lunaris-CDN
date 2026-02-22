declare global {
	namespace App {
		interface Platform {
			env: {
				DB: D1Database;
				R2: R2Bucket;
				GITHUB_CLIENT_ID: string;
				GITHUB_CLIENT_SECRET: string;
				GOOGLE_CLIENT_ID: string;
				GOOGLE_CLIENT_SECRET: string;
				RESEND_API_KEY: string;
				BETTER_AUTH_SECRET: string;
			};
			context: ExecutionContext;
		}
	}
}

export {};
