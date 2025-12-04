/**
 * PostHog server-side instance
 */

import { PostHog } from 'posthog-node';

export const posthog = new PostHog(process.env.POSTHOG_API_KEY || '', {
	host: process.env.POSTHOG_HOST || 'https://app.posthog.com'
});

// Graceful shutdown
if (typeof process !== 'undefined') {
	process.on('SIGTERM', async () => {
		await posthog.shutdown();
	});
}

export default posthog;
