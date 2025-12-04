/**
 * Unit tests for grind service
 */

import { describe, it, expect } from 'vitest';
import {
	getRecommendedGrindSize,
	getGrindAdjustmentTips,
	getGrindTroubleshooting
} from '$lib/services/grindService';
import type { BrewRecipe } from '$lib/types/brewing';

describe('grindService', () => {
	describe('getRecommendedGrindSize', () => {
		it('returns correct grind for fast brew', () => {
			const result = getRecommendedGrindSize('fast');
			expect(result).toContain('Medium-coarse');
			expect(result).toContain('finer');
		});

		it('returns correct grind for traditional brew', () => {
			const result = getRecommendedGrindSize('traditional');
			expect(result).toContain('Coarse');
			expect(result).toContain('Standard Kasuya');
		});

		it('returns correct grind for slow brew', () => {
			const result = getRecommendedGrindSize('slow');
			expect(result).toContain('Coarse');
			expect(result).toContain('coarser');
		});

		it('all recommendations are non-empty strings', () => {
			expect(getRecommendedGrindSize('fast')).toBeTruthy();
			expect(getRecommendedGrindSize('traditional')).toBeTruthy();
			expect(getRecommendedGrindSize('slow')).toBeTruthy();
		});
	});

	describe('getGrindAdjustmentTips', () => {
		const mockRecipe: BrewRecipe = {
			totalWater: 300,
			beanWeight: 20,
			ratio: 15,
			pours: [],
			totalBrewTime: 210,
			temperature: 90,
			grindSize: 'Coarse',
			methodology: 'Test'
		};

		it('provides tip for fast brew time', () => {
			const recipe = { ...mockRecipe, totalBrewTime: 150 }; // 2:30
			const tips = getGrindAdjustmentTips(recipe);
			expect(tips.some((tip) => tip.includes('quickly'))).toBe(true);
			expect(tips.some((tip) => tip.includes('finer'))).toBe(true);
		});

		it('provides tip for slow brew time', () => {
			const recipe = { ...mockRecipe, totalBrewTime: 270 }; // 4:30
			const tips = getGrindAdjustmentTips(recipe);
			expect(tips.some((tip) => tip.includes('long'))).toBe(true);
			expect(tips.some((tip) => tip.includes('coarser'))).toBe(true);
		});

		it('provides tip for high temperature', () => {
			const recipe = { ...mockRecipe, temperature: 92 };
			const tips = getGrindAdjustmentTips(recipe);
			expect(tips.some((tip) => tip.includes('High temperature'))).toBe(true);
			expect(tips.some((tip) => tip.includes('Coarser'))).toBe(true);
		});

		it('provides tip for low temperature', () => {
			const recipe = { ...mockRecipe, temperature: 88 };
			const tips = getGrindAdjustmentTips(recipe);
			expect(tips.some((tip) => tip.includes('Lower temperature'))).toBe(true);
			expect(tips.some((tip) => tip.includes('finer'))).toBe(true);
		});

		it('provides tip for few pours', () => {
			const recipe = {
				...mockRecipe,
				pours: [
					{
						pourNumber: 1,
						waterAmount: 150,
						timestamp: 0,
						cumulativeWater: 150,
						phase: '40%' as const,
						purpose: 'test'
					},
					{
						pourNumber: 2,
						waterAmount: 150,
						timestamp: 45,
						cumulativeWater: 300,
						phase: '60%' as const,
						purpose: 'test'
					}
				]
			};
			const tips = getGrindAdjustmentTips(recipe);
			expect(tips.some((tip) => tip.includes('Fewer pours'))).toBe(true);
			expect(tips.some((tip) => tip.includes('clogging'))).toBe(true);
		});

		it('provides tip for many pours', () => {
			const recipe = {
				...mockRecipe,
				pours: Array(7)
					.fill(null)
					.map((_, i) => ({
						pourNumber: i + 1,
						waterAmount: 43,
						timestamp: i * 30,
						cumulativeWater: (i + 1) * 43,
						phase: i < 2 ? ('40%' as const) : ('60%' as const),
						purpose: 'test'
					}))
			};
			const tips = getGrindAdjustmentTips(recipe);
			expect(tips.some((tip) => tip.includes('frequent'))).toBe(true);
			expect(tips.some((tip) => tip.includes('finer'))).toBe(true);
		});

		it('always includes Kasuya method guideline', () => {
			const tips = getGrindAdjustmentTips(mockRecipe);
			expect(tips.some((tip) => tip.includes('Kasuya method'))).toBe(true);
		});

		it('returns non-empty array', () => {
			const tips = getGrindAdjustmentTips(mockRecipe);
			expect(tips.length).toBeGreaterThan(0);
		});

		it('all tips are non-empty strings', () => {
			const tips = getGrindAdjustmentTips(mockRecipe);
			tips.forEach((tip) => {
				expect(tip).toBeTruthy();
				expect(tip.length).toBeGreaterThan(0);
			});
		});
	});

	describe('getGrindTroubleshooting', () => {
		const troubleshooting = getGrindTroubleshooting();

		it('provides solutions for too fast brewing', () => {
			expect(troubleshooting.tooFast).toBeInstanceOf(Array);
			expect(troubleshooting.tooFast.length).toBeGreaterThan(0);
			expect(troubleshooting.tooFast.some((s) => s.includes('finer'))).toBe(true);
		});

		it('provides solutions for too slow brewing', () => {
			expect(troubleshooting.tooSlow).toBeInstanceOf(Array);
			expect(troubleshooting.tooSlow.length).toBeGreaterThan(0);
			expect(troubleshooting.tooSlow.some((s) => s.includes('coarser'))).toBe(true);
		});

		it('provides solutions for bitter coffee', () => {
			expect(troubleshooting.bitter).toBeInstanceOf(Array);
			expect(troubleshooting.bitter.length).toBeGreaterThan(0);
			expect(troubleshooting.bitter.some((s) => s.includes('coarser'))).toBe(true);
		});

		it('provides solutions for weak coffee', () => {
			expect(troubleshooting.weak).toBeInstanceOf(Array);
			expect(troubleshooting.weak.length).toBeGreaterThan(0);
			expect(troubleshooting.weak.some((s) => s.includes('finer'))).toBe(true);
		});

		it('all solutions are actionable', () => {
			Object.values(troubleshooting).forEach((solutions) => {
				solutions.forEach((solution) => {
					expect(solution).toBeTruthy();
					expect(solution.length).toBeGreaterThan(0);
				});
			});
		});

		it('has multiple solutions for each problem', () => {
			expect(troubleshooting.tooFast.length).toBeGreaterThanOrEqual(2);
			expect(troubleshooting.tooSlow.length).toBeGreaterThanOrEqual(2);
			expect(troubleshooting.bitter.length).toBeGreaterThanOrEqual(2);
			expect(troubleshooting.weak.length).toBeGreaterThanOrEqual(2);
		});
	});
});
