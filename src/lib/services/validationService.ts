/**
 * Input validation service
 * Validates all user inputs for brewing parameters
 */

import type { RoastProfile, AdvancedOptions } from '$lib/types/brewing';
import type { ValidationResult } from '$lib/types/validation';
import { VALIDATION_BOUNDS, RATIO_CONSTANTS } from '$lib/constants/brewing';

/**
 * Valid roast profile values
 */
const VALID_ROAST_PROFILES: RoastProfile[] = [
	'light',
	'light-medium',
	'medium',
	'medium-dark',
	'dark'
];

/**
 * Validate bean origin string
 */
export function validateBeanOrigin(origin: string): ValidationResult {
	const errors: string[] = [];

	if (!origin || origin.trim().length === 0) {
		errors.push('Bean origin is required');
	} else if (origin.length > VALIDATION_BOUNDS.BEAN_ORIGIN_MAX_LENGTH) {
		errors.push(
			`Bean origin must be ${VALIDATION_BOUNDS.BEAN_ORIGIN_MAX_LENGTH} characters or less`
		);
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * Validate roast profile
 */
export function validateRoastProfile(roast: string): ValidationResult {
	const errors: string[] = [];

	if (!roast) {
		errors.push('Roast profile is required');
	} else if (!VALID_ROAST_PROFILES.includes(roast as RoastProfile)) {
		errors.push(
			`Roast profile must be one of: ${VALID_ROAST_PROFILES.join(', ')}`
		);
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * Validate bean weight
 */
export function validateBeanWeight(weight: number): ValidationResult {
	const errors: string[] = [];

	if (typeof weight !== 'number' || isNaN(weight)) {
		errors.push('Bean weight must be a valid number');
	} else if (weight < VALIDATION_BOUNDS.BEAN_WEIGHT.MIN) {
		errors.push(`Bean weight must be at least ${VALIDATION_BOUNDS.BEAN_WEIGHT.MIN}g`);
	} else if (weight > VALIDATION_BOUNDS.BEAN_WEIGHT.MAX) {
		errors.push(`Bean weight must be at most ${VALIDATION_BOUNDS.BEAN_WEIGHT.MAX}g`);
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * Validate coffee-to-water ratio
 */
export function validateRatio(ratio: number): ValidationResult {
	const errors: string[] = [];

	if (typeof ratio !== 'number' || isNaN(ratio)) {
		errors.push('Ratio must be a valid number');
	} else if (ratio < RATIO_CONSTANTS.MIN) {
		errors.push(`Ratio must be at least ${RATIO_CONSTANTS.MIN} (1:${RATIO_CONSTANTS.MIN})`);
	} else if (ratio > RATIO_CONSTANTS.MAX) {
		errors.push(`Ratio must be at most ${RATIO_CONSTANTS.MAX} (1:${RATIO_CONSTANTS.MAX})`);
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * Validate water temperature
 */
export function validateTemperature(temp: number): ValidationResult {
	const errors: string[] = [];

	if (typeof temp !== 'number' || isNaN(temp)) {
		errors.push('Temperature must be a valid number');
	} else if (temp < VALIDATION_BOUNDS.TEMPERATURE.MIN) {
		errors.push(`Temperature must be at least ${VALIDATION_BOUNDS.TEMPERATURE.MIN}°C`);
	} else if (temp > VALIDATION_BOUNDS.TEMPERATURE.MAX) {
		errors.push(`Temperature must be at most ${VALIDATION_BOUNDS.TEMPERATURE.MAX}°C`);
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * Validate advanced options (composite validation)
 */
export function validateAdvancedOptions(options: AdvancedOptions): ValidationResult {
	const errors: string[] = [];

	// Validate ratio
	const ratioResult = validateRatio(options.ratio);
	if (!ratioResult.valid) {
		errors.push(...ratioResult.errors);
	}

	// Validate phase 40 pours
	if (options.phase40Pours !== 1 && options.phase40Pours !== 2) {
		errors.push('Phase 40% pours must be 1 or 2');
	}

	// Validate phase 60 pours
	if (
		options.phase60Pours < 1 ||
		options.phase60Pours > 4 ||
		!Number.isInteger(options.phase60Pours)
	) {
		errors.push('Phase 60% pours must be between 1 and 4');
	}

	// Validate custom temperature if provided
	if (options.waterTemperature !== undefined) {
		const tempResult = validateTemperature(options.waterTemperature);
		if (!tempResult.valid) {
			errors.push(...tempResult.errors);
		}
	}

	// Validate brew time target
	if (!['fast', 'traditional', 'slow'].includes(options.brewTimeTarget)) {
		errors.push('Brew time target must be fast, traditional, or slow');
	}

	// Validate phase 40 distribution
	if (
		!['equal', 'sweet-leaning', 'acidity-leaning'].includes(options.phase40Distribution)
	) {
		errors.push('Phase 40% distribution must be equal, sweet-leaning, or acidity-leaning');
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * Validate complete brewing inputs
 */
export function validateBrewInputs(
	beanOrigin: string,
	roastProfile: string,
	beanWeight: number
): ValidationResult {
	const errors: string[] = [];

	const originResult = validateBeanOrigin(beanOrigin);
	if (!originResult.valid) errors.push(...originResult.errors);

	const roastResult = validateRoastProfile(roastProfile);
	if (!roastResult.valid) errors.push(...roastResult.errors);

	const weightResult = validateBeanWeight(beanWeight);
	if (!weightResult.valid) errors.push(...weightResult.errors);

	return {
		valid: errors.length === 0,
		errors
	};
}
