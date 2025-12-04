/**
 * Unit tests for brewing calculator
 */

import { describe, it, expect } from 'vitest';
import {
	calculateTotalWater,
	calculatePhase40Pours,
	calculatePhase60Pours,
	generatePourTimestamps,
	buildSimpleRecipe,
	buildAdvancedRecipe
} from '$lib/services/brewingCalculator';
import type { BrewInputs, AdvancedOptions } from '$lib/types/brewing';

describe('brewingCalculator', () => {
	describe('calculateTotalWater', () => {
		it('calculates water with default ratio 1:15', () => {
			expect(calculateTotalWater(20, 15)).toBe(300);
		});

		it('handles minimum ratio 1:14', () => {
			expect(calculateTotalWater(20, 14)).toBe(280);
		});

		it('handles maximum ratio 1:17', () => {
			expect(calculateTotalWater(20, 17)).toBe(340);
		});

		it('rounds to nearest gram', () => {
			expect(calculateTotalWater(13, 15)).toBe(195);
		});

		it('handles edge case: minimum bean weight', () => {
			expect(calculateTotalWater(10, 15)).toBe(150);
		});

		it('handles edge case: maximum bean weight', () => {
			expect(calculateTotalWater(30, 15)).toBe(450);
		});
	});

	describe('calculatePhase40Pours', () => {
		it('splits 40% equally for 2 pours', () => {
			const result = calculatePhase40Pours(300, 2, 'equal');
			expect(result).toHaveLength(2);
			expect(result[0]).toBe(60);
			expect(result[1]).toBe(60);
			expect(result.reduce((a, b) => a + b, 0)).toBe(120); // 40% of 300
		});

		it('handles sweet-leaning distribution', () => {
			const result = calculatePhase40Pours(300, 2, 'sweet-leaning');
			expect(result).toHaveLength(2);
			expect(result[0]).toBeGreaterThan(result[1]); // More water in first pour
			expect(result.reduce((a, b) => a + b, 0)).toBe(120);
		});

		it('handles acidity-leaning distribution', () => {
			const result = calculatePhase40Pours(300, 2, 'acidity-leaning');
			expect(result).toHaveLength(2);
			expect(result[0]).toBeLessThan(result[1]); // More water in second pour
			expect(result.reduce((a, b) => a + b, 0)).toBe(120);
		});

		it('handles single pour for 40%', () => {
			const result = calculatePhase40Pours(300, 1, 'equal');
			expect(result).toHaveLength(1);
			expect(result[0]).toBe(120);
		});

		it('ensures sum equals exactly 40% of total water', () => {
			const totalWater = 250;
			const result = calculatePhase40Pours(totalWater, 2, 'equal');
			const sum = result.reduce((a, b) => a + b, 0);
			expect(sum).toBe(Math.round(totalWater * 0.4));
		});
	});

	describe('calculatePhase60Pours', () => {
		it('splits 60% into 3 equal pours', () => {
			const result = calculatePhase60Pours(300, 3);
			expect(result).toHaveLength(3);
			expect(result.reduce((a, b) => a + b, 0)).toBe(180); // 60% of 300
		});

		it('handles rounding for uneven division', () => {
			const result = calculatePhase60Pours(250, 3);
			expect(result).toHaveLength(3);
			const sum = result.reduce((a, b) => a + b, 0);
			expect(sum).toBe(150); // 60% of 250
		});

		it('handles 1 pour for 60%', () => {
			const result = calculatePhase60Pours(300, 1);
			expect(result).toHaveLength(1);
			expect(result[0]).toBe(180);
		});

		it('handles 2 pours for 60%', () => {
			const result = calculatePhase60Pours(300, 2);
			expect(result).toHaveLength(2);
			expect(result.reduce((a, b) => a + b, 0)).toBe(180);
		});

		it('handles 4 pours for 60%', () => {
			const result = calculatePhase60Pours(300, 4);
			expect(result).toHaveLength(4);
			expect(result.reduce((a, b) => a + b, 0)).toBe(180);
		});

		it('ensures sum equals exactly 60% of total water', () => {
			const totalWater = 275;
			const result = calculatePhase60Pours(totalWater, 3);
			const sum = result.reduce((a, b) => a + b, 0);
			expect(sum).toBe(Math.round(totalWater * 0.6));
		});
	});

	describe('generatePourTimestamps', () => {
		it('generates timestamps for traditional timing', () => {
			const result = generatePourTimestamps(5, 'traditional');
			expect(result).toEqual([0, 45, 90, 135, 180]);
		});

		it('generates timestamps for fast timing', () => {
			const result = generatePourTimestamps(5, 'fast');
			expect(result).toEqual([0, 35, 70, 105, 140]);
		});

		it('generates timestamps for slow timing', () => {
			const result = generatePourTimestamps(5, 'slow');
			expect(result).toEqual([0, 55, 110, 165, 220]);
		});

		it('handles different pour counts', () => {
			const result = generatePourTimestamps(3, 'traditional');
			expect(result).toEqual([0, 45, 90]);
		});

		it('first timestamp is always 0', () => {
			expect(generatePourTimestamps(5, 'traditional')[0]).toBe(0);
			expect(generatePourTimestamps(3, 'fast')[0]).toBe(0);
			expect(generatePourTimestamps(7, 'slow')[0]).toBe(0);
		});
	});

	describe('buildSimpleRecipe', () => {
		const mockInputs: BrewInputs = {
			beanOrigin: 'Ethiopia',
			roastProfile: 'light',
			beanWeight: 20,
			mode: 'simple'
		};

		it('generates complete simple recipe', () => {
			const recipe = buildSimpleRecipe(mockInputs);

			expect(recipe.totalWater).toBe(300); // 20 * 15
			expect(recipe.ratio).toBe(15);
			expect(recipe.beanWeight).toBe(20);
			expect(recipe.pours).toHaveLength(5); // 2 + 3 pours
			expect(recipe.temperature).toBe(92); // light roast
			expect(recipe.grindSize).toContain('Coarse');
			expect(recipe.methodology).toBeTruthy();
		});

		it('validates 40/60 split', () => {
			const recipe = buildSimpleRecipe(mockInputs);

			const phase40Total = recipe.pours
				.filter((p) => p.phase === '40%')
				.reduce((sum, p) => sum + p.waterAmount, 0);

			const phase60Total = recipe.pours
				.filter((p) => p.phase === '60%')
				.reduce((sum, p) => sum + p.waterAmount, 0);

			expect(phase40Total).toBe(120); // 40% of 300
			expect(phase60Total).toBe(180); // 60% of 300
			expect(phase40Total + phase60Total).toBe(300);
		});

		it('has 2 pours for phase 40%', () => {
			const recipe = buildSimpleRecipe(mockInputs);
			const phase40Pours = recipe.pours.filter((p) => p.phase === '40%');
			expect(phase40Pours).toHaveLength(2);
		});

		it('has 3 pours for phase 60%', () => {
			const recipe = buildSimpleRecipe(mockInputs);
			const phase60Pours = recipe.pours.filter((p) => p.phase === '60%');
			expect(phase60Pours).toHaveLength(3);
		});

		it('uses traditional timing', () => {
			const recipe = buildSimpleRecipe(mockInputs);
			const timestamps = recipe.pours.map((p) => p.timestamp);
			expect(timestamps).toEqual([0, 45, 90, 135, 180]);
		});

		it('cumulative water is correct', () => {
			const recipe = buildSimpleRecipe(mockInputs);
			let expectedCumulative = 0;

			recipe.pours.forEach((pour) => {
				expectedCumulative += pour.waterAmount;
				expect(pour.cumulativeWater).toBe(expectedCumulative);
			});

			expect(expectedCumulative).toBe(300);
		});

		it('adjusts temperature for different roasts', () => {
			const lightRoast = buildSimpleRecipe({ ...mockInputs, roastProfile: 'light' });
			const darkRoast = buildSimpleRecipe({ ...mockInputs, roastProfile: 'dark' });

			expect(lightRoast.temperature).toBeGreaterThan(darkRoast.temperature);
		});

		it('all pours have purpose descriptions', () => {
			const recipe = buildSimpleRecipe(mockInputs);
			recipe.pours.forEach((pour) => {
				expect(pour.purpose).toBeTruthy();
				expect(pour.purpose.length).toBeGreaterThan(0);
			});
		});
	});

	describe('buildAdvancedRecipe', () => {
		const mockInputs: BrewInputs = {
			beanOrigin: 'Kenya',
			roastProfile: 'medium',
			beanWeight: 15,
			mode: 'advanced'
		};

		const mockOptions: AdvancedOptions = {
			ratio: 16,
			phase40Pours: 2,
			phase40Distribution: 'equal',
			phase60Pours: 3,
			brewTimeTarget: 'fast',
			tastePreferences: {}
		};

		it('generates recipe with custom ratio', () => {
			const recipe = buildAdvancedRecipe(mockInputs, mockOptions);

			expect(recipe.totalWater).toBe(240); // 15 * 16
			expect(recipe.ratio).toBe(16);
			expect(recipe.pours).toHaveLength(5); // 2 + 3
		});

		it('respects custom pour counts', () => {
			const customOptions: AdvancedOptions = {
				...mockOptions,
				phase40Pours: 1,
				phase60Pours: 4
			};

			const recipe = buildAdvancedRecipe(mockInputs, customOptions);

			const phase40Pours = recipe.pours.filter((p) => p.phase === '40%');
			const phase60Pours = recipe.pours.filter((p) => p.phase === '60%');

			expect(phase40Pours).toHaveLength(1);
			expect(phase60Pours).toHaveLength(4);
		});

		it('uses fast timing when specified', () => {
			const recipe = buildAdvancedRecipe(mockInputs, mockOptions);
			const timestamps = recipe.pours.map((p) => p.timestamp);
			expect(timestamps).toEqual([0, 35, 70, 105, 140]); // 35s intervals
		});

		it('adjusts temperature for acidity preference', () => {
			const baseRecipe = buildAdvancedRecipe(mockInputs, mockOptions);
			const acidityRecipe = buildAdvancedRecipe(mockInputs, {
				...mockOptions,
				tastePreferences: { acidity: true }
			});

			expect(acidityRecipe.temperature).toBeGreaterThan(baseRecipe.temperature);
		});

		it('adjusts temperature for sweetness preference', () => {
			const baseRecipe = buildAdvancedRecipe(mockInputs, mockOptions);
			const sweetnessRecipe = buildAdvancedRecipe(mockInputs, {
				...mockOptions,
				tastePreferences: { sweetness: true }
			});

			expect(sweetnessRecipe.temperature).toBeLessThan(baseRecipe.temperature);
		});

		it('uses custom water temperature when provided', () => {
			const customTemp = 88;
			const recipe = buildAdvancedRecipe(mockInputs, {
				...mockOptions,
				waterTemperature: customTemp
			});

			expect(recipe.temperature).toBe(customTemp);
		});

		it('clamps temperature to safe range', () => {
			const hotOptions: AdvancedOptions = {
				...mockOptions,
				waterTemperature: 100, // Too hot
				tastePreferences: { acidity: true, clarity: true }
			};

			const recipe = buildAdvancedRecipe(mockInputs, hotOptions);
			expect(recipe.temperature).toBeLessThanOrEqual(96);
		});

		it('validates 40/60 split with custom ratio', () => {
			const recipe = buildAdvancedRecipe(mockInputs, mockOptions);

			const phase40Total = recipe.pours
				.filter((p) => p.phase === '40%')
				.reduce((sum, p) => sum + p.waterAmount, 0);

			const phase60Total = recipe.pours
				.filter((p) => p.phase === '60%')
				.reduce((sum, p) => sum + p.waterAmount, 0);

			const totalWater = recipe.totalWater;
			const expected40 = Math.round(totalWater * 0.4);
			const expected60 = Math.round(totalWater * 0.6);

			expect(phase40Total).toBe(expected40);
			expect(phase60Total).toBe(expected60);
		});

		it('handles sweet-leaning distribution in advanced mode', () => {
			const recipe = buildAdvancedRecipe(mockInputs, {
				...mockOptions,
				phase40Distribution: 'sweet-leaning'
			});

			const phase40Pours = recipe.pours.filter((p) => p.phase === '40%');
			expect(phase40Pours[0].waterAmount).toBeGreaterThan(phase40Pours[1].waterAmount);
		});

		it('handles slow brew time target', () => {
			const recipe = buildAdvancedRecipe(mockInputs, {
				...mockOptions,
				brewTimeTarget: 'slow'
			});

			expect(recipe.grindSize).toContain('coarser');
			expect(recipe.pours[1].timestamp).toBe(55); // 55s interval for slow
		});
	});
});
