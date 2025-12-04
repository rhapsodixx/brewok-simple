/**
 * Brewing constants for the Tetsu Kasuya 4:6 method
 */

import type { RoastProfile, BrewSpeed } from '$lib/types/brewing';

/**
 * Coffee-to-water ratio constants
 */
export const RATIO_CONSTANTS = {
	DEFAULT: 15,
	MIN: 14,
	MAX: 17
} as const;

/**
 * Phase distribution constants (4:6 method)
 */
export const PHASE_CONSTANTS = {
	PHASE_40_PERCENT: 0.4,
	PHASE_60_PERCENT: 0.6
} as const;

/**
 * Simple mode default pour configuration
 */
export const SIMPLE_MODE_POURS = {
	PHASE_40: 2, // Two pours for 40% phase
	PHASE_60: 3 // Three pours for 60% phase
} as const;

/**
 * Timing patterns for different brew speeds (in seconds)
 */
export const TIMING_PATTERNS: Record<
	BrewSpeed,
	{
		interval: number; // seconds between pours
		total: number; // expected total brew time
	}
> = {
	fast: {
		interval: 35,
		total: 150 // 2:30
	},
	traditional: {
		interval: 45,
		total: 210 // 3:30
	},
	slow: {
		interval: 55,
		total: 240 // 4:00
	}
} as const;

/**
 * Temperature recommendations by roast profile (in celsius)
 */
export const TEMPERATURE_RECOMMENDATIONS: Record<RoastProfile, number> = {
	light: 92,
	'light-medium': 91,
	medium: 90,
	'medium-dark': 89,
	dark: 88
} as const;

/**
 * Grind size recommendations by brew speed
 */
export const GRIND_RECOMMENDATIONS: Record<BrewSpeed, string> = {
	fast: 'Medium-coarse (Kasuya method, slightly finer for faster extraction)',
	traditional: 'Coarse (Standard Kasuya method)',
	slow: 'Coarse (Standard Kasuya method, slightly coarser for slower extraction)'
} as const;

/**
 * Validation bounds
 */
export const VALIDATION_BOUNDS = {
	BEAN_WEIGHT: {
		MIN: 10, // grams
		MAX: 30 // grams
	},
	TEMPERATURE: {
		MIN: 85, // celsius
		MAX: 96 // celsius
	},
	BEAN_ORIGIN_MAX_LENGTH: 100
} as const;

/**
 * Phase 40% distribution multipliers
 */
export const PHASE_40_DISTRIBUTION = {
	SWEET_LEANING: {
		FIRST_POUR: 0.6,
		SECOND_POUR: 0.4
	},
	ACIDITY_LEANING: {
		FIRST_POUR: 0.4,
		SECOND_POUR: 0.6
	},
	EQUAL: {
		FIRST_POUR: 0.5,
		SECOND_POUR: 0.5
	}
} as const;
