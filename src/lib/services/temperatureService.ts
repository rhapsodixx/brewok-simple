/**
 * Temperature recommendation service
 * Provides temperature guidance based on roast profile and taste preferences
 */

import type { RoastProfile, TastePreferences } from '$lib/types/brewing';
import { TEMPERATURE_RECOMMENDATIONS, VALIDATION_BOUNDS } from '$lib/constants/brewing';

/**
 * Get recommended temperature for a roast profile
 */
export function getRecommendedTemperature(roastProfile: RoastProfile): number {
	return TEMPERATURE_RECOMMENDATIONS[roastProfile];
}

/**
 * Adjust temperature based on taste preferences
 *
 * Higher temperature → more extraction → more acidity & clarity
 * Lower temperature → gentler extraction → more sweetness & body
 */
export function adjustTemperatureForPreference(
	baseTemp: number,
	preferences: TastePreferences
): number {
	let adjustment = 0;

	// Increase temperature for acidity and clarity
	if (preferences.acidity) adjustment += 1;
	if (preferences.clarity) adjustment += 1;

	// Decrease temperature for sweetness and body
	if (preferences.sweetness) adjustment -= 1;
	if (preferences.body) adjustment -= 1;

	const adjustedTemp = baseTemp + adjustment;

	// Clamp to safe brewing range
	return Math.max(
		VALIDATION_BOUNDS.TEMPERATURE.MIN,
		Math.min(VALIDATION_BOUNDS.TEMPERATURE.MAX, adjustedTemp)
	);
}

/**
 * Get temperature adjustment explanation
 */
export function getTemperatureExplanation(
	baseTemp: number,
	adjustedTemp: number,
	preferences: TastePreferences
): string {
	if (baseTemp === adjustedTemp) {
		return `Using recommended ${baseTemp}°C for optimal extraction.`;
	}

	const diff = adjustedTemp - baseTemp;
	const direction = diff > 0 ? 'increased' : 'decreased';
	const amount = Math.abs(diff);

	let reason = `Temperature ${direction} by ${amount}°C`;

	const reasons: string[] = [];
	if (preferences.acidity) reasons.push('more acidity');
	if (preferences.clarity) reasons.push('more clarity');
	if (preferences.sweetness) reasons.push('more sweetness');
	if (preferences.body) reasons.push('more body');

	if (reasons.length > 0) {
		reason += ` to emphasize ${reasons.join(' and ')}.`;
	} else {
		reason += '.';
	}

	return reason;
}
