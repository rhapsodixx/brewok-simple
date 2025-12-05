<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { initPostHog, posthog } from '$lib/posthog';
	import { setupErrorTracking } from '$lib/errorHandler';
	import '../app.postcss';

	onMount(() => {
		// Initialize PostHog
		initPostHog();

		// Setup global error tracking
		setupErrorTracking();
	});

	// Track page views
	$: if ($page.url.pathname && typeof window !== 'undefined') {
		posthog.capture('$pageview', {
			$current_url: $page.url.href,
			$pathname: $page.url.pathname
		});
	}
</script>

<div class="min-h-screen bg-background text-foreground">
	<slot />
</div>
