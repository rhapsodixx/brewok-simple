<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { modeStore } from '$lib/stores/modeStore';
	import type { BrewMode } from '$lib/types/brewing';
	import posthog from 'posthog-js';

	export let onModeSelected: (mode: BrewMode) => void;

	function selectMode(mode: BrewMode) {
		modeStore.set(mode === 'simple' ? modeStore.setSimple() : modeStore.setAdvanced());

		// Track mode selection
		if (typeof window !== 'undefined') {
			posthog.capture('mode_selected', {
				mode: mode
			});
		}

		onModeSelected(mode);
	}
</script>

<div class="container max-w-4xl mx-auto px-4 py-8">
	<div class="text-center mb-8">
		<h1 class="text-4xl font-bold mb-2">Brewok Simple</h1>
		<p class="text-muted-foreground">Your 4:6 V60 brewing assistant</p>
	</div>

	<div class="grid md:grid-cols-2 gap-6">
		<!-- Simple Mode Card -->
		<Card class="hover:shadow-lg transition-shadow cursor-pointer" on:click={() => selectMode('simple')}>
			<CardHeader>
				<CardTitle>Simple Mode</CardTitle>
				<CardDescription>Quick and easy 4:6 brewing</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground mb-4">
					Perfect for beginners. We'll automatically generate a 5-pour V60 recipe using the
					traditional Tetsu Kasuya 4:6 method.
				</p>
				<ul class="text-sm space-y-2 mb-4">
					<li>• 1:15 ratio (default)</li>
					<li>• 2 pours for 40% (sweetness/acidity)</li>
					<li>• 3 pours for 60% (strength)</li>
					<li>• Traditional timing (45s intervals)</li>
				</ul>
				<Button class="w-full" on:click|stopPropagation={() => selectMode('simple')}>
					Choose Simple Mode
				</Button>
			</CardContent>
		</Card>

		<!-- Advanced Mode Card -->
		<Card class="hover:shadow-lg transition-shadow cursor-pointer" on:click={() => selectMode('advanced')}>
			<CardHeader>
				<CardTitle>Advanced Mode</CardTitle>
				<CardDescription>Full control over your brew</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground mb-4">
					For experienced brewers. Customize every aspect of your 4:6 recipe to match your
					preferences and bean characteristics.
				</p>
				<ul class="text-sm space-y-2 mb-4">
					<li>• Custom ratio (1:14 to 1:17)</li>
					<li>• Adjustable pour counts</li>
					<li>• 40% phase distribution control</li>
					<li>• Temperature and timing customization</li>
				</ul>
				<Button class="w-full" on:click|stopPropagation={() => selectMode('advanced')}>
					Choose Advanced Mode
				</Button>
			</CardContent>
		</Card>
	</div>
</div>
