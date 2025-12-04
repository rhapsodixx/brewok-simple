/**
 * Unit tests for temperature service
 */

import { describe, it, expect } from 'vitest';
import {
	getRecommendedTemperature,
	adjustTemperatureForPreference,
	getTemperatureExplanation
} from '$lib/services/temperatureService';
import type { TastePreferences } from '$lib/types/brewing';

describe('temperatureService', () => {
	describe('getRecommendedTemperature', () => {
		it('returns correct temperature for light roast', () => {
			expect(getRecommendedTemperature('light')).toBe(92);
		});

		it('returns correct temperature for light-medium roast', () => {
			expect(getRecommendedTemperature('light-medium')).toBe(91);
		});

		it('returns correct temperature for medium roast', () => {
			expect(getRecommendedTemperature('medium')).toBe(90);
		});

		it('returns correct temperature for medium-dark roast', () => {
			expect(getRecommendedTemperature('medium-dark')).toBe(89);
		});

		it('returns correct temperature for dark roast', () => {
			expect(getRecommendedTemperature('dark')).toBe(88);
		});

		it('lighter roasts have higher temperatures', () => {
			const light = getRecommendedTemperature('light');
			const dark = getRecommendedTemperature('dark');
			expect(light).toBeGreaterThan(dark);
		});
	});

	describe('adjustTemperatureForPreference', () => {
		const baseTemp = 90;

		it('returns base temperature with no preferences', () => {
			const preferences: TastePreferences = {};
			const result = adjustTemperatureForPreference(baseTemp, preferences);
			expect(result).toBe(baseTemp);
		});

		it('increases temperature for acidity preference', () => {
			const preferences: TastePreferences = { acidity: true };
			const result = adjustTemperatureForPreference(baseTemp, preferences);
			expect(result).toBe(91);
		});

		it('increases temperature for clarity preference', () => {
			const preferences: TastePreferences = { clarity: true };
			const result = adjustTemperatureForPreference(baseTemp, preferences);
			expect(result).toBe(91);
		});

		it('decreases temperature for sweetness preference', () => {
			const preferences: TastePreferences = { sweetness: true };
			const result = adjustTemperatureForPreference(baseTemp, preferences);
			expect(result).toBe(89);
		});

		it('decreases temperature for body preference', () => {
			const preferences: TastePreferences = { body: true };
			const result = adjustTemperatureForPreference(baseTemp, preferences);
			expect(result).toBe(89);
		});

		it('handles multiple preferences', () => {
			const preferences: TastePreferences = {
				acidity: true,
				clarity: true
			};
			const result = adjustTemperatureForPreference(baseTemp, preferences);
			expect(result).toBe(92); // +1 for acidity, +1 for clarity
		});

		it('handles conflicting preferences', () => {
			const preferences: TastePreferences = {
				acidity: true, // +1
				sweetness: true // -1
			};
			const result = adjustTemperatureForPreference(baseTemp, preferences);
			expect(result).toBe(baseTemp); // Net zero adjustment
		});

		it('clamps to minimum temperature (85°C)', () => {
			const preferences: TastePreferences = {
				sweetness: true,
				body: true
			};
			const result = adjustTemperatureForPreference(86, preferences); // 86 - 2 = 84, clamped to 85
			expect(result).toBe(85);
		});

		it('clamps to maximum temperature (96°C)', () => {
			const preferences: TastePreferences = {
				acidity: true,
				clarity: true
			};
			const result = adjustTemperatureForPreference(95, preferences); // 95 + 2 = 97, clamped to 96
			expect(result).toBe(96);
		});

		it('handles all preferences enabled', () => {
			const preferences: TastePreferences = {
				acidity: true,
				clarity: true,
				sweetness: true,
				body: true
			};
			const result = adjustTemperatureForPreference(baseTemp, preferences);
			expect(result).toBe(baseTemp); // +2 and -2 cancel out
		});
	});

	describe('getTemperatureExplanation', () => {
		it('explains no change', () => {
			const explanation = getTemperatureExplanation(90, 90, {});
			expect(explanation).toContain('Using recommended 90°C');
			expect(explanation).toContain('optimal extraction');
		});

		it('explains temperature increase', () => {
			const preferences: TastePreferences = { acidity: true };
			const explanation = getTemperatureExplanation(90, 91, preferences);
			expect(explanation).toContain('increased by 1°C');
			expect(explanation).toContain('more acidity');
		});

		it('explains temperature decrease', () => {
			const preferences: TastePreferences = { sweetness: true };
			const explanation = getTemperatureExplanation(90, 89, preferences);
			expect(explanation).toContain('decreased by 1°C');
			expect(explanation).toContain('more sweetness');
		});

		it('explains multiple preferences', () => {
			const preferences: TastePreferences = {
				acidity: true,
				clarity: true
			};
			const explanation = getTemperatureExplanation(90, 92, preferences);
			expect(explanation).toContain('increased by 2°C');
			expect(explanation).toContain('more acidity');
			expect(explanation).toContain('more clarity');
		});

		it('handles large adjustments', () => {
			const preferences: TastePreferences = {
				sweetness: true,
				body: true
			};
			const explanation = getTemperatureExplanation(90, 88, preferences);
			expect(explanation).toContain('decreased by 2°C');
		});
	});
});
