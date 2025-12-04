/**
 * Grind size recommendation service
 * Provides grind guidance based on brew parameters
 */

import type { BrewRecipe, BrewSpeed } from '$lib/types/brewing';
import { GRIND_RECOMMENDATIONS } from '$lib/constants/brewing';

/**
 * Get recommended grind size based on brew speed
 */
export function getRecommendedGrindSize(brewSpeed: BrewSpeed): string {
	return GRIND_RECOMMENDATIONS[brewSpeed];
}

/**
 * Get grind adjustment tips based on recipe parameters
 */
export function getGrindAdjustmentTips(recipe: BrewRecipe): string[] {
	const tips: string[] = [];

	// Tip based on brew time
	if (recipe.totalBrewTime < 180) {
		// Less than 3 minutes
		tips.push(
			'For faster extraction: If brew finishes too quickly, try grinding slightly finer.'
		);
	} else if (recipe.totalBrewTime > 240) {
		// More than 4 minutes
		tips.push(
			'For slower extraction: If brew takes too long, try grinding slightly coarser.'
		);
	}

	// Tip based on temperature
	if (recipe.temperature >= 92) {
		tips.push('High temperature extraction: Coarser grind helps prevent over-extraction.');
	} else if (recipe.temperature <= 88) {
		tips.push('Lower temperature extraction: Slightly finer grind helps extraction.');
	}

	// Tip based on pour count
	const totalPours = recipe.pours.length;
	if (totalPours <= 3) {
		tips.push(
			'Fewer pours with more water per pour: Ensure grind is coarse enough to prevent clogging.'
		);
	} else if (totalPours >= 6) {
		tips.push(
			'More frequent smaller pours: Allows for slightly finer grind without clogging risk.'
		);
	}

	// General Kasuya method tip
	tips.push(
		'Kasuya method guideline: Start with coarse grind (similar to French press) and adjust to taste.'
	);

	return tips;
}

/**
 * Get grind troubleshooting advice
 */
export function getGrindTroubleshooting(): {
	tooFast: string[];
	tooSlow: string[];
	bitter: string[];
	weak: string[];
} {
	return {
		tooFast: [
			'Grind finer to slow down water flow',
			'Ensure proper bloom time (45 seconds)',
			'Check that filter is properly rinsed and seated'
		],
		tooSlow: [
			'Grind coarser to speed up water flow',
			'Avoid agitation during pours',
			'Ensure dripper has proper drainage'
		],
		bitter: [
			'Grind coarser to reduce extraction',
			'Lower water temperature by 1-2°C',
			'Reduce contact time between pours'
		],
		weak: [
			'Grind finer to increase extraction',
			'Increase water temperature by 1-2°C',
			'Increase dose (more coffee grounds)'
		]
	};
}
