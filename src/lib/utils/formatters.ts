/**
 * Formatting utilities for displaying brew data
 */

/**
 * Format seconds into MM:SS format
 */
export function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format weight with unit
 */
export function formatWeight(grams: number): string {
	return `${grams}g`;
}

/**
 * Format temperature with unit
 */
export function formatTemperature(celsius: number): string {
	return `${celsius}°C`;
}

/**
 * Format ratio as 1:X
 */
export function formatRatio(ratio: number): string {
	return `1:${ratio}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
	return `${Math.round(value * 100)}%`;
}
