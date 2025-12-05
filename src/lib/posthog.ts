/**
 * PostHog client-side initialization and utilities
 */

import posthog from 'posthog-js';
import { browser } from '$app/environment';

export function initPostHog() {
	if (browser) {
		const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
		const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

		if (posthogKey) {
			posthog.init(posthogKey, {
				api_host: posthogHost,
				capture_pageview: false, // We'll handle this manually
				capture_pageleave: true,
				autocapture: false, // We'll capture events manually for better control
				session_recording: {
					recordCrossOriginIframes: false
				},
				// Disable in development to avoid noise
				disable_session_recording: import.meta.env.DEV,
				loaded: (ph) => {
					if (import.meta.env.DEV) {
						console.log('[PostHog] Initialized (session recording disabled in dev)');
					}
				}
			});
		} else if (import.meta.env.DEV) {
			console.warn('[PostHog] No API key found. Set VITE_PUBLIC_POSTHOG_KEY in .env');
		}
	}

	return posthog;
}

export { posthog };
