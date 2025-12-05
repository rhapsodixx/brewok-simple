/**
 * Global error handler for client-side errors
 */

import posthog from 'posthog-js';
import { browser } from '$app/environment';

export function setupErrorTracking() {
	if (!browser) return;

	// Handle unhandled errors
	window.addEventListener('error', (event) => {
		posthog.capture('$exception', {
			$exception_type: event.error?.name || 'Error',
			$exception_message: event.error?.message || event.message,
			$exception_stack: event.error?.stack,
			$exception_personURL: posthog.get_session_replay_url(),
			source: 'window.error'
		});
	});

	// Handle unhandled promise rejections
	window.addEventListener('unhandledrejection', (event) => {
		posthog.capture('$exception', {
			$exception_type: 'UnhandledPromiseRejection',
			$exception_message: event.reason?.message || String(event.reason),
			$exception_stack: event.reason?.stack,
			$exception_personURL: posthog.get_session_replay_url(),
			source: 'unhandledrejection'
		});
	});

	if (import.meta.env.DEV) {
		console.log('[ErrorHandler] Global error tracking enabled');
	}
}
