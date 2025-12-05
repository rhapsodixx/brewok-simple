<script lang="ts">
	import { modeStore } from '$lib/stores/modeStore';
	import { inputStore } from '$lib/stores/inputStore';
	import { recipeStore } from '$lib/stores/recipeStore';
	import ModeSelector from '$lib/components/ModeSelector.svelte';
	import SimpleInputForm from '$lib/components/SimpleInputForm.svelte';
	import AdvancedInputForm from '$lib/components/AdvancedInputForm.svelte';
	import RecipeDisplay from '$lib/components/RecipeDisplay.svelte';
	import TastePrediction from '$lib/components/TastePrediction.svelte';
	import RecipeExplanation from '$lib/components/RecipeExplanation.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { BrewMode } from '$lib/types/brewing';
	import posthog from 'posthog-js';

	// State management
	let currentMode: BrewMode | null = null;
	let showResults = false;

	// Subscribe to stores
	$: recipe = $recipeStore.recipe;
	$: tastePrediction = $recipeStore.tastePrediction;
	$: isGenerating = $recipeStore.isGenerating;
	$: isGeneratingTaste = $recipeStore.isGeneratingTaste;
	$: error = $recipeStore.error;

	// Mode selection handler
	function handleModeSelected(mode: BrewMode) {
		currentMode = mode;
		if (mode === 'simple') {
			modeStore.setSimple();
		} else {
			modeStore.setAdvanced();
		}
	}

	// Recipe generation success - show results
	$: if (recipe && !isGenerating) {
		showResults = true;
	}

	// New recipe handler
	function handleNewRecipe() {
		currentMode = null;
		showResults = false;
		modeStore.reset();
		inputStore.reset();
		recipeStore.reset();

		// Track event
		if (typeof window !== 'undefined') {
			posthog.capture('recipe_reset');
		}
	}
</script>

<svelte:head>
	<title>Brewok Simple - V60 Brewing Assistant</title>
	<meta name="description" content="Generate perfect V60 pour-over coffee recipes using the Tetsu Kasuya 4:6 method with AI-powered taste predictions" />
</svelte:head>

<main class="container mx-auto px-4 py-8 max-w-7xl">
	{#if !currentMode && !showResults}
		<!-- Step 1: Mode Selection -->
		<ModeSelector onModeSelected={handleModeSelected} />
	{:else if currentMode && !showResults}
		<!-- Step 2: Input Form -->
		<div class="mb-6">
			<Button variant="ghost" on:click={handleNewRecipe}>
				← Back to Mode Selection
			</Button>
		</div>

		{#if currentMode === 'simple'}
			<SimpleInputForm />
		{:else}
			<AdvancedInputForm />
		{/if}
	{:else if showResults && recipe}
		<!-- Step 3: Results Display -->
		<div class="mb-6 flex items-center justify-between">
			<h1 class="text-3xl font-bold">Your V60 Recipe</h1>
			<Button on:click={handleNewRecipe}>
				New Recipe
			</Button>
		</div>

		<div class="grid lg:grid-cols-2 gap-6 mb-6">
			<!-- Left Column: Recipe Details -->
			<div class="space-y-6">
				<RecipeDisplay {recipe} {isGenerating} />
				<RecipeExplanation {recipe} />
			</div>

			<!-- Right Column: Taste Prediction -->
			<div>
				<TastePrediction {tastePrediction} isGenerating={isGeneratingTaste} {error} />
			</div>
		</div>
	{/if}
</main>

<!-- Footer -->
<footer class="border-t mt-12 py-6">
	<div class="container mx-auto px-4 text-center text-sm text-muted-foreground">
		<p>
			Built with SvelteKit • Powered by the
			<a
				href="https://connorraikar.wordpress.com/2021/05/02/the-tetsu-kasuya-method-and-getting-out-of-a-slump/"
				target="_blank"
				rel="noopener noreferrer"
				class="text-primary hover:underline"
			>
				Tetsu Kasuya 4:6 Method
			</a>
		</p>
		<p class="mt-2">
			Taste predictions powered by AI •
			<a href="https://github.com" class="text-primary hover:underline">View Source</a>
		</p>
	</div>
</footer>
