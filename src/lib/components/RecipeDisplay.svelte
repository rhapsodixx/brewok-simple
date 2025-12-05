<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { formatTime, formatWeight, formatTemperature, formatRatio } from '$lib/utils/formatters';
	import type { BrewRecipe } from '$lib/types/brewing';

	export let recipe: BrewRecipe | null;
	export let isLoading = false;
</script>

{#if isLoading}
	<Card>
		<CardHeader>
			<Skeleton class="h-8 w-48" />
		</CardHeader>
		<CardContent class="space-y-4">
			<Skeleton class="h-32 w-full" />
			<Skeleton class="h-24 w-full" />
		</CardContent>
	</Card>
{:else if recipe}
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<CardTitle>Your V60 Recipe</CardTitle>
				<div class="flex gap-2">
					<Badge>{formatRatio(recipe.ratio)}</Badge>
					<Badge variant="secondary">{formatTemperature(recipe.temperature)}</Badge>
					<Badge variant="secondary">{formatTime(recipe.totalBrewTime)}</Badge>
				</div>
			</div>
		</CardHeader>
		<CardContent class="space-y-6">
			<!-- Pour Schedule Table -->
			<div>
				<h3 class="text-lg font-semibold mb-3">Pour Schedule</h3>
				<div class="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Pour #</TableHead>
								<TableHead>Water</TableHead>
								<TableHead>Time</TableHead>
								<TableHead>Cumulative</TableHead>
								<TableHead>Phase</TableHead>
								<TableHead>Purpose</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each recipe.pours as pour}
								<TableRow>
									<TableCell class="font-medium">{pour.pourNumber}</TableCell>
									<TableCell>{formatWeight(pour.waterAmount)}</TableCell>
									<TableCell>{formatTime(pour.timestamp)}</TableCell>
									<TableCell>{formatWeight(pour.cumulativeWater)}</TableCell>
									<TableCell>
										<Badge variant={pour.phase === '40%' ? 'default' : 'secondary'}>
											{pour.phase}
										</Badge>
									</TableCell>
									<TableCell class="text-sm text-muted-foreground">{pour.purpose}</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</div>
				<div class="mt-2 text-sm text-muted-foreground">
					Total water: {formatWeight(recipe.totalWater)} | Bean dose: {formatWeight(recipe.beanWeight)}
				</div>
			</div>

			<!-- Brewing Details -->
			<div class="grid md:grid-cols-2 gap-4">
				<div class="space-y-2">
					<h4 class="font-semibold">Temperature</h4>
					<p class="text-sm text-muted-foreground">
						{formatTemperature(recipe.temperature)}
					</p>
				</div>

				<div class="space-y-2">
					<h4 class="font-semibold">Grind Size</h4>
					<p class="text-sm text-muted-foreground">
						{recipe.grindSize}
					</p>
				</div>

				<div class="space-y-2">
					<h4 class="font-semibold">Total Brew Time</h4>
					<p class="text-sm text-muted-foreground">
						{formatTime(recipe.totalBrewTime)}
					</p>
				</div>

				<div class="space-y-2">
					<h4 class="font-semibold">Ratio</h4>
					<p class="text-sm text-muted-foreground">
						{formatRatio(recipe.ratio)} ({recipe.beanWeight}g : {recipe.totalWater}g)
					</p>
				</div>
			</div>

			<!-- Methodology Note -->
			{#if recipe.methodology}
				<div class="rounded-lg bg-muted p-4">
					<h4 class="font-semibold mb-2">4:6 Method</h4>
					<p class="text-sm text-muted-foreground leading-relaxed">
						{recipe.methodology}
					</p>
				</div>
			{/if}
		</CardContent>
	</Card>
{/if}
