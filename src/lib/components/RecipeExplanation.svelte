<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { BrewRecipe } from '$lib/types/brewing';

	export let recipe: BrewRecipe | null;
</script>

{#if recipe}
	<Card>
		<CardHeader>
			<CardTitle>Why This Recipe Works</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="space-y-4">
				<!-- Method Explanation -->
				<div>
					<p class="text-sm text-muted-foreground leading-relaxed">
						{recipe.methodology}
					</p>
				</div>

				<!-- Key Principles -->
				<div>
					<h4 class="font-semibold mb-3">Key Principles of the 4:6 Method</h4>
					<ul class="space-y-2 text-sm text-muted-foreground">
						<li class="flex gap-2">
							<span class="text-primary">•</span>
							<span>
								<strong>40% Phase (First Pours):</strong> Controls sweetness vs. acidity balance.
								Equal distribution creates balance; adjust ratios to emphasize one over the other.
							</span>
						</li>
						<li class="flex gap-2">
							<span class="text-primary">•</span>
							<span>
								<strong>60% Phase (Final Pours):</strong> Controls strength and body. More pours =
								lighter body, fewer pours = fuller body.
							</span>
						</li>
						<li class="flex gap-2">
							<span class="text-primary">•</span>
							<span>
								<strong>Consistent Pour Intervals:</strong> Regular timing ensures even extraction
								and predictable results.
							</span>
						</li>
						<li class="flex gap-2">
							<span class="text-primary">•</span>
							<span>
								<strong>Temperature Matters:</strong> Lighter roasts need higher temps (92-94°C)
								for proper extraction; darker roasts work well at lower temps (88-90°C).
							</span>
						</li>
					</ul>
				</div>

				<!-- Tips -->
				<div class="rounded-lg bg-muted p-4">
					<h4 class="font-semibold mb-2">Brewing Tips</h4>
					<ul class="space-y-1 text-sm text-muted-foreground">
						<li>• Start your timer when you begin the first pour</li>
						<li>• Pour in a circular motion from center outward</li>
						<li>• Wait for the water level to drop before each pour</li>
						<li>• Adjust grind size if brew time is significantly off</li>
						<li>• Use filtered water for best results</li>
						<li>• Preheat your V60 and carafe</li>
					</ul>
				</div>

				<!-- External Resource -->
				<div class="text-center pt-2">
					<a
						href="https://connorraikar.wordpress.com/2021/05/02/the-tetsu-kasuya-method-and-getting-out-of-a-slump/"
						target="_blank"
						rel="noopener noreferrer"
						class="text-sm text-primary hover:underline"
					>
						Learn more about the Tetsu Kasuya 4:6 method →
					</a>
				</div>
			</div>
		</CardContent>
	</Card>
{/if}
