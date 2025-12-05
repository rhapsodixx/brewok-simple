<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Select } from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
	import { inputStore } from '$lib/stores/inputStore';
	import { recipeStore } from '$lib/stores/recipeStore';
	import { validateBrewInputs, validateAdvancedOptions } from '$lib/services/validationService';
	import { buildAdvancedRecipe } from '$lib/services/brewingCalculator';
	import type {
		BrewInputs,
		RoastProfile,
		AdvancedOptions,
		Phase40Distribution,
		BrewSpeed
	} from '$lib/types/brewing';
	import posthog from 'posthog-js';

	// Basic inputs
	let beanOrigin = '';
	let roastProfile: RoastProfile = 'medium';
	let beanWeight = 20;

	// Advanced options
	let ratio = 15;
	let phase40Pours: 1 | 2 = 2;
	let phase40Distribution: Phase40Distribution = 'equal';
	let phase60Pours: 1 | 2 | 3 | 4 = 3;
	let waterTemperature: number | undefined = undefined;
	let brewTimeTarget: BrewSpeed = 'traditional';

	let activeTab = 'basic';
	let error = '';
	let isSubmitting = false;

	const roastOptions: { value: RoastProfile; label: string }[] = [
		{ value: 'light', label: 'Light' },
		{ value: 'light-medium', label: 'Light-Medium' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'medium-dark', label: 'Medium-Dark' },
		{ value: 'dark', label: 'Dark' }
	];

	const distributionOptions: { value: Phase40Distribution; label: string }[] = [
		{ value: 'equal', label: 'Equal (Balanced)' },
		{ value: 'sweet-leaning', label: 'Sweet-leaning (60/40)' },
		{ value: 'acidity-leaning', label: 'Acidity-leaning (40/60)' }
	];

	const brewSpeedOptions: { value: BrewSpeed; label: string }[] = [
		{ value: 'fast', label: 'Fast (35s intervals)' },
		{ value: 'traditional', label: 'Traditional (45s)' },
		{ value: 'slow', label: 'Slow (55s intervals)' }
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
				mode: 'advanced'
			};

			const advancedOptions: AdvancedOptions = {
				ratio,
				phase40Pours,
				phase40Distribution,
				phase60Pours,
				waterTemperature,
				brewTimeTarget,
				tastePreferences: {}
			};

			// Validate basic inputs
			const basicValidation = validateBrewInputs(inputs);
			if (!basicValidation.valid) {
				error = basicValidation.errors.join(', ');
				isSubmitting = false;
				return;
			}

			// Validate advanced options
			const advancedValidation = validateAdvancedOptions(advancedOptions);
			if (!advancedValidation.valid) {
				error = advancedValidation.errors.join(', ');
				isSubmitting = false;
				return;
			}

			// Store inputs
			inputStore.setBasicInputs(inputs);
			inputStore.setAdvancedOptions(advancedOptions);

			// Generate recipe
			const recipe = buildAdvancedRecipe(inputs, advancedOptions);
			recipeStore.setRecipe(recipe);

			// Track event
			if (typeof window !== 'undefined') {
				posthog.capture('advanced_recipe_generated', {
					mode: 'advanced',
					bean_weight: beanWeight,
					roast_profile: roastProfile,
					ratio: ratio,
					phase40_pours: phase40Pours,
					phase60_pours: phase60Pours,
					brew_speed: brewTimeTarget
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

<div class="container max-w-3xl mx-auto px-4 py-8">
	<Card>
		<CardHeader>
			<CardTitle>Advanced Brew Configuration</CardTitle>
		</CardHeader>
		<CardContent>
			<form on:submit|preventDefault={handleSubmit} class="space-y-6">
				{#if error}
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				{/if}

				<Tabs bind:value={activeTab}>
					<TabsList class="grid w-full grid-cols-3">
						<TabsTrigger value="basic">Basic</TabsTrigger>
						<TabsTrigger value="recipe">Recipe</TabsTrigger>
						<TabsTrigger value="brewing">Brewing</TabsTrigger>
					</TabsList>

					<!-- Basic Tab -->
					<TabsContent value="basic" class="space-y-4">
						<!-- Bean Origin -->
						<div class="space-y-2">
							<Label for="adv-beanOrigin">Bean Origin</Label>
							<Input
								id="adv-beanOrigin"
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
							<Label for="adv-roastProfile">Roast Profile</Label>
							<Select id="adv-roastProfile" bind:value={roastProfile} disabled={isSubmitting}>
								{#each roastOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</Select>
							<p class="text-xs text-muted-foreground">Select your coffee's roast level</p>
						</div>

						<!-- Bean Weight -->
						<div class="space-y-2">
							<Label for="adv-beanWeight">Bean Weight (grams)</Label>
							<Input
								id="adv-beanWeight"
								type="number"
								min="10"
								max="30"
								step="0.5"
								bind:value={beanWeight}
								required
								disabled={isSubmitting}
							/>
							<p class="text-xs text-muted-foreground">Recommended range: 10-30g</p>
						</div>
					</TabsContent>

					<!-- Recipe Tab -->
					<TabsContent value="recipe" class="space-y-4">
						<!-- Ratio -->
						<div class="space-y-2">
							<Label for="ratio">Water to Coffee Ratio</Label>
							<Input
								id="ratio"
								type="number"
								min="14"
								max="17"
								step="0.5"
								bind:value={ratio}
								required
								disabled={isSubmitting}
							/>
							<p class="text-xs text-muted-foreground">
								1:{ratio} (standard is 1:15, range 1:14-1:17)
							</p>
						</div>

						<!-- Phase 40% Pours -->
						<div class="space-y-2">
							<Label for="phase40Pours">40% Phase Pours</Label>
							<Select id="phase40Pours" bind:value={phase40Pours} disabled={isSubmitting}>
								<option value={1}>1 pour</option>
								<option value={2}>2 pours</option>
							</Select>
							<p class="text-xs text-muted-foreground">Number of pours in first 40% (sweetness/acidity)</p>
						</div>

						<!-- Phase 40% Distribution -->
						<div class="space-y-2">
							<Label for="phase40Distribution">40% Phase Distribution</Label>
							<Select
								id="phase40Distribution"
								bind:value={phase40Distribution}
								disabled={isSubmitting}
							>
								{#each distributionOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</Select>
							<p class="text-xs text-muted-foreground">
								How to split water between 40% pours
							</p>
						</div>

						<!-- Phase 60% Pours -->
						<div class="space-y-2">
							<Label for="phase60Pours">60% Phase Pours</Label>
							<Select id="phase60Pours" bind:value={phase60Pours} disabled={isSubmitting}>
								<option value={1}>1 pour</option>
								<option value={2}>2 pours</option>
								<option value={3}>3 pours</option>
								<option value={4}>4 pours</option>
							</Select>
							<p class="text-xs text-muted-foreground">Number of pours in final 60% (strength/body)</p>
						</div>
					</TabsContent>

					<!-- Brewing Tab -->
					<TabsContent value="brewing" class="space-y-4">
						<!-- Water Temperature -->
						<div class="space-y-2">
							<Label for="waterTemperature">Water Temperature (°C)</Label>
							<Input
								id="waterTemperature"
								type="number"
								min="85"
								max="96"
								step="1"
								bind:value={waterTemperature}
								placeholder="Auto (based on roast)"
								disabled={isSubmitting}
							/>
							<p class="text-xs text-muted-foreground">
								Leave empty for automatic recommendation based on roast level (85-96°C)
							</p>
						</div>

						<!-- Brew Time Target -->
						<div class="space-y-2">
							<Label for="brewTimeTarget">Brew Speed Target</Label>
							<Select id="brewTimeTarget" bind:value={brewTimeTarget} disabled={isSubmitting}>
								{#each brewSpeedOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</Select>
							<p class="text-xs text-muted-foreground">
								Pour interval timing (affects grind size recommendation)
							</p>
						</div>
					</TabsContent>
				</Tabs>

				<!-- Submit Button -->
				<Button type="submit" class="w-full" disabled={isSubmitting}>
					{isSubmitting ? 'Generating Recipe...' : 'Generate Advanced Recipe'}
				</Button>
			</form>
		</CardContent>
	</Card>
</div>
