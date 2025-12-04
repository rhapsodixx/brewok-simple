/**
 * Tetsu Kasuya 4:6 Brewing Calculator
 *
 * Implements the 4:6 method where:
 * - First 40% of water controls sweetness/acidity balance
 * - Final 60% of water controls strength/body
 */

import type {
	BrewRecipe,
	BrewInputs,
	AdvancedOptions,
	PourData,
	BrewSpeed,
	Phase40Distribution
} from '$lib/types/brewing';
import {
	RATIO_CONSTANTS,
	PHASE_CONSTANTS,
	SIMPLE_MODE_POURS,
	TIMING_PATTERNS,
	TEMPERATURE_RECOMMENDATIONS,
	GRIND_RECOMMENDATIONS,
	PHASE_40_DISTRIBUTION
} from '$lib/constants/brewing';

/**
 * Calculate total water needed based on bean weight and ratio
 */
export function calculateTotalWater(beanWeight: number, ratio: number): number {
	return Math.round(beanWeight * ratio);
}

/**
 * Calculate water distribution for the 40% phase
 */
export function calculatePhase40Pours(
	totalWater: number,
	pourCount: 1 | 2,
	distribution: Phase40Distribution
): number[] {
	const phase40Water = Math.round(totalWater * PHASE_CONSTANTS.PHASE_40_PERCENT);

	if (pourCount === 1) {
		return [phase40Water];
	}

	// Two pours - apply distribution logic
	let firstPour: number;
	let secondPour: number;

	switch (distribution) {
		case 'sweet-leaning':
			firstPour = Math.round(phase40Water * PHASE_40_DISTRIBUTION.SWEET_LEANING.FIRST_POUR);
			secondPour = Math.round(phase40Water * PHASE_40_DISTRIBUTION.SWEET_LEANING.SECOND_POUR);
			break;
		case 'acidity-leaning':
			firstPour = Math.round(phase40Water * PHASE_40_DISTRIBUTION.ACIDITY_LEANING.FIRST_POUR);
			secondPour = Math.round(phase40Water * PHASE_40_DISTRIBUTION.ACIDITY_LEANING.SECOND_POUR);
			break;
		case 'equal':
		default:
			firstPour = Math.round(phase40Water * PHASE_40_DISTRIBUTION.EQUAL.FIRST_POUR);
			secondPour = Math.round(phase40Water * PHASE_40_DISTRIBUTION.EQUAL.SECOND_POUR);
			break;
	}

	// Adjust second pour to ensure exact total
	const diff = phase40Water - (firstPour + secondPour);
	secondPour += diff;

	return [firstPour, secondPour];
}

/**
 * Calculate water distribution for the 60% phase
 */
export function calculatePhase60Pours(totalWater: number, pourCount: number): number[] {
	const phase60Water = Math.round(totalWater * PHASE_CONSTANTS.PHASE_60_PERCENT);
	const pourAmount = Math.round(phase60Water / pourCount);

	const pours = Array(pourCount).fill(pourAmount);

	// Adjust last pour to ensure exact total
	const currentTotal = pours.reduce((sum, amount) => sum + amount, 0);
	const diff = phase60Water - currentTotal;
	pours[pours.length - 1] += diff;

	return pours;
}

/**
 * Generate timestamps for each pour based on brew speed
 */
export function generatePourTimestamps(pourCount: number, brewSpeed: BrewSpeed): number[] {
	const interval = TIMING_PATTERNS[brewSpeed].interval;
	const timestamps: number[] = [];

	for (let i = 0; i < pourCount; i++) {
		timestamps.push(i * interval);
	}

	return timestamps;
}

/**
 * Generate pour-specific purpose description
 */
function generatePourPurpose(
	pourIndex: number,
	isPhase40: boolean,
	phase40Count: number,
	phase60Count: number,
	distribution?: Phase40Distribution
): string {
	if (isPhase40) {
		if (phase40Count === 1) {
			return 'Bloom & sweetness/acidity foundation';
		}

		if (pourIndex === 0) {
			return 'Bloom & initial extraction';
		}

		// Second pour of phase 40
		if (distribution === 'sweet-leaning') {
			return 'Acidity balance (sweet-leaning recipe)';
		} else if (distribution === 'acidity-leaning') {
			return 'Acidity emphasis';
		}
		return 'Acidity development';
	}

	// Phase 60% pours
	const pourInPhase = pourIndex - phase40Count;

	if (pourInPhase === 0) {
		return 'Body foundation';
	}

	if (pourInPhase === phase60Count - 1) {
		return 'Strength & clarity';
	}

	return 'Body building';
}

/**
 * Build complete recipe for Simple Mode
 */
export function buildSimpleRecipe(inputs: BrewInputs): BrewRecipe {
	const ratio = RATIO_CONSTANTS.DEFAULT;
	const totalWater = calculateTotalWater(inputs.beanWeight, ratio);

	// Calculate phase pours
	const phase40Pours = calculatePhase40Pours(totalWater, SIMPLE_MODE_POURS.PHASE_40, 'equal');
	const phase60Pours = calculatePhase60Pours(totalWater, SIMPLE_MODE_POURS.PHASE_60);

	const allPourAmounts = [...phase40Pours, ...phase60Pours];
	const totalPours = allPourAmounts.length;

	// Generate timestamps
	const timestamps = generatePourTimestamps(totalPours, 'traditional');

	// Build pour data
	let cumulativeWater = 0;
	const pours: PourData[] = allPourAmounts.map((amount, index) => {
		cumulativeWater += amount;
		const isPhase40 = index < phase40Pours.length;

		return {
			pourNumber: index + 1,
			waterAmount: amount,
			timestamp: timestamps[index],
			cumulativeWater,
			phase: isPhase40 ? '40%' : '60%',
			purpose: generatePourPurpose(
				index,
				isPhase40,
				phase40Pours.length,
				phase60Pours.length,
				'equal'
			)
		};
	});

	// Get temperature and grind recommendations
	const temperature = TEMPERATURE_RECOMMENDATIONS[inputs.roastProfile];
	const grindSize = GRIND_RECOMMENDATIONS.traditional;

	// Calculate total brew time (last pour + drawdown)
	const lastPourTime = timestamps[timestamps.length - 1];
	const drawdownTime = 30; // estimated 30 seconds for drawdown
	const totalBrewTime = lastPourTime + drawdownTime;

	return {
		totalWater,
		beanWeight: inputs.beanWeight,
		ratio,
		pours,
		totalBrewTime,
		temperature,
		grindSize,
		methodology: generateMethodologyExplanation(pours, 'simple', inputs.roastProfile)
	};
}

/**
 * Build complete recipe for Advanced Mode
 */
export function buildAdvancedRecipe(inputs: BrewInputs, options: AdvancedOptions): BrewRecipe {
	const totalWater = calculateTotalWater(inputs.beanWeight, options.ratio);

	// Calculate phase pours
	const phase40Pours = calculatePhase40Pours(
		totalWater,
		options.phase40Pours,
		options.phase40Distribution
	);
	const phase60Pours = calculatePhase60Pours(totalWater, options.phase60Pours);

	const allPourAmounts = [...phase40Pours, ...phase60Pours];
	const totalPours = allPourAmounts.length;

	// Generate timestamps
	const timestamps = generatePourTimestamps(totalPours, options.brewTimeTarget);

	// Build pour data
	let cumulativeWater = 0;
	const pours: PourData[] = allPourAmounts.map((amount, index) => {
		cumulativeWater += amount;
		const isPhase40 = index < phase40Pours.length;

		return {
			pourNumber: index + 1,
			waterAmount: amount,
			timestamp: timestamps[index],
			cumulativeWater,
			phase: isPhase40 ? '40%' : '60%',
			purpose: generatePourPurpose(
				index,
				isPhase40,
				phase40Pours.length,
				phase60Pours.length,
				options.phase40Distribution
			)
		};
	});

	// Get temperature (use custom or recommended)
	let temperature =
		options.waterTemperature ?? TEMPERATURE_RECOMMENDATIONS[inputs.roastProfile];

	// Adjust temperature for taste preferences
	if (options.tastePreferences.acidity) temperature += 1;
	if (options.tastePreferences.clarity) temperature += 1;
	if (options.tastePreferences.sweetness) temperature -= 1;
	if (options.tastePreferences.body) temperature -= 1;

	// Clamp temperature to safe range
	temperature = Math.max(85, Math.min(96, temperature));

	const grindSize = GRIND_RECOMMENDATIONS[options.brewTimeTarget];

	// Calculate total brew time
	const lastPourTime = timestamps[timestamps.length - 1];
	const drawdownTime = 30;
	const totalBrewTime = lastPourTime + drawdownTime;

	return {
		totalWater,
		beanWeight: inputs.beanWeight,
		ratio: options.ratio,
		pours,
		totalBrewTime,
		temperature,
		grindSize,
		methodology: generateMethodologyExplanation(
			pours,
			'advanced',
			inputs.roastProfile,
			options
		)
	};
}

/**
 * Generate explanation of the brewing methodology
 */
export function generateMethodologyExplanation(
	pours: PourData[],
	mode: 'simple' | 'advanced',
	roastProfile: string,
	options?: AdvancedOptions
): string {
	const phase40Pours = pours.filter((p) => p.phase === '40%');
	const phase60Pours = pours.filter((p) => p.phase === '60%');

	const phase40Water = phase40Pours.reduce((sum, p) => sum + p.waterAmount, 0);
	const phase60Water = phase60Pours.reduce((sum, p) => sum + p.waterAmount, 0);

	let explanation = `This recipe follows the Tetsu Kasuya 4:6 method:\n\n`;

	explanation += `**Phase 1 (40% - ${phase40Water}g):** `;
	explanation += `${phase40Pours.length} pour${phase40Pours.length > 1 ? 's' : ''} `;
	explanation += `controlling sweetness and acidity balance. `;

	if (options?.phase40Distribution === 'sweet-leaning') {
		explanation += `More water in the first pour emphasizes sweetness.\n\n`;
	} else if (options?.phase40Distribution === 'acidity-leaning') {
		explanation += `More water in the second pour emphasizes acidity.\n\n`;
	} else {
		explanation += `Equal distribution creates balanced sweetness and acidity.\n\n`;
	}

	explanation += `**Phase 2 (60% - ${phase60Water}g):** `;
	explanation += `${phase60Pours.length} pour${phase60Pours.length > 1 ? 's' : ''} `;
	explanation += `building body and strength. `;

	if (phase60Pours.length <= 2) {
		explanation += `Fewer pours create a heavier body.\n\n`;
	} else if (phase60Pours.length >= 4) {
		explanation += `More pours create a cleaner, lighter body.\n\n`;
	} else {
		explanation += `Standard pour count for balanced body.\n\n`;
	}

	explanation += `The ${roastProfile} roast profile pairs well with this water temperature `;
	explanation += `to extract optimal flavors without bitterness.`;

	return explanation;
}
