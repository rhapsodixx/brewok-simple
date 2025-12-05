<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Select } from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { inputStore } from '$lib/stores/inputStore';
	import { recipeStore } from '$lib/stores/recipeStore';
	import { validateBrewInputs } from '$lib/services/validationService';
	import { buildSimpleRecipe } from '$lib/services/brewingCalculator';
	import type { BrewInputs, RoastProfile } from '$lib/types/brewing';
	import posthog from 'posthog-js';

	let beanOrigin = '';
	let roastProfile: RoastProfile = 'medium';
	let beanWeight = 20;
	let error = '';
	let isSubmitting = false;

	const roastOptions: { value: RoastProfile; label: string }[] = [
		{ value: 'light', label: 'Light' },
		{ value: 'light-medium', label: 'Light-Medium' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'medium-dark', label: 'Medium-Dark' },
		{ value: 'dark', label: 'Dark' }
	];

	async function handleSubmit() {
		error = '';
		isSubmitting = true;

		try {
			// Build inputs
			const inputs: BrewInputs = {
				beanOrigin: beanOrigin.trim(),
				roastProfile,
				beanWeight,
				mode: 'simple'
			};

			// Validate inputs
			const validation = validateBrewInputs(inputs);
			if (!validation.valid) {
				error = validation.errors.join(', ');
				isSubmitting = false;
				return;
			}

			// Store inputs
			inputStore.setBasicInputs(inputs);

			// Generate recipe
			const recipe = buildSimpleRecipe(inputs);
			recipeStore.setRecipe(recipe);

			// Track event
			if (typeof window !== 'undefined') {
				posthog.capture('recipe_generated', {
					mode: 'simple',
					bean_weight: beanWeight,
					roast_profile: roastProfile
				});
			}

			// Fetch taste prediction
			recipeStore.setGeneratingTaste(true);
			const response = await fetch('/api/taste-prediction', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ recipe, inputs })
			});

			if (!response.ok) {
				throw new Error('Failed to generate taste prediction');
			}

			const data = await response.json();
			recipeStore.setTastePrediction(data.tastePrediction);
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
			recipeStore.setError(error);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="container max-w-2xl mx-auto px-4 py-8">
	<Card>
		<CardHeader>
			<CardTitle>Simple Brew Inputs</CardTitle>
		</CardHeader>
		<CardContent>
			<form on:submit|preventDefault={handleSubmit} class="space-y-4">
				{#if error}
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				{/if}

				<!-- Bean Origin -->
				<div class="space-y-2">
					<Label for="beanOrigin">Bean Origin</Label>
					<Input
						id="beanOrigin"
						type="text"
						bind:value={beanOrigin}
						placeholder="e.g., Ethiopia, Colombia, Kenya"
						required
						disabled={isSubmitting}
					/>
					<p class="text-xs text-muted-foreground">
						Enter the origin or name of your coffee beans
					</p>
				</div>

				<!-- Roast Profile -->
				<div class="space-y-2">
					<Label for="roastProfile">Roast Profile</Label>
					<Select id="roastProfile" bind:value={roastProfile} disabled={isSubmitting}>
						{#each roastOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</Select>
					<p class="text-xs text-muted-foreground">
						Select your coffee's roast level
					</p>
				</div>

				<!-- Bean Weight -->
				<div class="space-y-2">
					<Label for="beanWeight">Bean Weight (grams)</Label>
					<Input
						id="beanWeight"
						type="number"
						min="10"
						max="30"
						step="0.5"
						bind:value={beanWeight}
						required
						disabled={isSubmitting}
					/>
					<p class="text-xs text-muted-foreground">
						Recommended range: 10-30g (20g is standard)
					</p>
				</div>

				<!-- Submit Button -->
				<Button type="submit" class="w-full" disabled={isSubmitting}>
					{isSubmitting ? 'Generating Recipe...' : 'Generate Recipe'}
				</Button>
			</form>
		</CardContent>
	</Card>
</div>
