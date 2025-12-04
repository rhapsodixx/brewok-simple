/**
 * Unit tests for validation service
 */

import { describe, it, expect } from 'vitest';
import {
	validateBeanOrigin,
	validateRoastProfile,
	validateBeanWeight,
	validateRatio,
	validateTemperature,
	validateAdvancedOptions,
	validateBrewInputs
} from '$lib/services/validationService';
import type { AdvancedOptions } from '$lib/types/brewing';

describe('validationService', () => {
	describe('validateBeanOrigin', () => {
		it('accepts valid bean origin', () => {
			const result = validateBeanOrigin('Ethiopia');
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('rejects empty string', () => {
			const result = validateBeanOrigin('');
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Bean origin is required');
		});

		it('rejects whitespace-only string', () => {
			const result = validateBeanOrigin('   ');
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Bean origin is required');
		});

		it('rejects string that is too long', () => {
			const longString = 'a'.repeat(101);
			const result = validateBeanOrigin(longString);
			expect(result.valid).toBe(false);
			expect(result.errors[0]).toContain('100 characters or less');
		});

		it('accepts string at max length', () => {
			const maxString = 'a'.repeat(100);
			const result = validateBeanOrigin(maxString);
			expect(result.valid).toBe(true);
		});
	});

	describe('validateRoastProfile', () => {
		it('accepts valid roast profiles', () => {
			const profiles = ['light', 'light-medium', 'medium', 'medium-dark', 'dark'];
			profiles.forEach((profile) => {
				const result = validateRoastProfile(profile);
				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
			});
		});

		it('rejects invalid roast profile', () => {
			const result = validateRoastProfile('extra-dark');
			expect(result.valid).toBe(false);
			expect(result.errors[0]).toContain('must be one of');
		});

		it('rejects empty string', () => {
			const result = validateRoastProfile('');
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Roast profile is required');
		});

		it('is case-sensitive', () => {
			const result = validateRoastProfile('Light');
			expect(result.valid).toBe(false);
		});
	});

	describe('validateBeanWeight', () => {
		it('accepts valid bean weight', () => {
			const result = validateBeanWeight(20);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('accepts minimum weight (10g)', () => {
			const result = validateBeanWeight(10);
			expect(result.valid).toBe(true);
		});

		it('accepts maximum weight (30g)', () => {
			const result = validateBeanWeight(30);
			expect(result.valid).toBe(true);
		});

		it('rejects weight below minimum', () => {
			const result = validateBeanWeight(9);
			expect(result.valid).toBe(false);
			expect(result.errors[0]).toContain('at least 10g');
		});

		it('rejects weight above maximum', () => {
			const result = validateBeanWeight(31);
			expect(result.valid).toBe(false);
			expect(result.errors[0]).toContain('at most 30g');
		});

		it('rejects non-numeric values', () => {
			const result = validateBeanWeight(NaN);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Bean weight must be a valid number');
		});

		it('rejects string as number', () => {
			const result = validateBeanWeight('20' as any);
			expect(result.valid).toBe(false);
		});
	});

	describe('validateRatio', () => {
		it('accepts valid ratio', () => {
			const result = validateRatio(15);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('accepts minimum ratio (14)', () => {
			const result = validateRatio(14);
			expect(result.valid).toBe(true);
		});

		it('accepts maximum ratio (17)', () => {
			const result = validateRatio(17);
			expect(result.valid).toBe(true);
		});

		it('rejects ratio below minimum', () => {
			const result = validateRatio(13);
			expect(result.valid).toBe(false);
			expect(result.errors[0]).toContain('at least 14');
		});

		it('rejects ratio above maximum', () => {
			const result = validateRatio(18);
			expect(result.valid).toBe(false);
			expect(result.errors[0]).toContain('at most 17');
		});

		it('rejects non-numeric values', () => {
			const result = validateRatio(NaN);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Ratio must be a valid number');
		});
	});

	describe('validateTemperature', () => {
		it('accepts valid temperature', () => {
			const result = validateTemperature(92);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('accepts minimum temperature (85°C)', () => {
			const result = validateTemperature(85);
			expect(result.valid).toBe(true);
		});

		it('accepts maximum temperature (96°C)', () => {
			const result = validateTemperature(96);
			expect(result.valid).toBe(true);
		});

		it('rejects temperature below minimum', () => {
			const result = validateTemperature(84);
			expect(result.valid).toBe(false);
			expect(result.errors[0]).toContain('at least 85°C');
		});

		it('rejects temperature above maximum', () => {
			const result = validateTemperature(97);
			expect(result.valid).toBe(false);
			expect(result.errors[0]).toContain('at most 96°C');
		});

		it('rejects non-numeric values', () => {
			const result = validateTemperature(NaN);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Temperature must be a valid number');
		});
	});

	describe('validateAdvancedOptions', () => {
		const validOptions: AdvancedOptions = {
			ratio: 15,
			phase40Pours: 2,
			phase40Distribution: 'equal',
			phase60Pours: 3,
			brewTimeTarget: 'traditional',
			tastePreferences: {}
		};

		it('accepts valid options', () => {
			const result = validateAdvancedOptions(validOptions);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('rejects invalid ratio', () => {
			const result = validateAdvancedOptions({ ...validOptions, ratio: 18 });
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('rejects invalid phase40Pours', () => {
			const result = validateAdvancedOptions({ ...validOptions, phase40Pours: 3 as any });
			expect(result.valid).toBe(false);
			expect(result.errors[0]).toContain('Phase 40% pours must be 1 or 2');
		});

		it('rejects invalid phase60Pours (too low)', () => {
			const result = validateAdvancedOptions({ ...validOptions, phase60Pours: 0 as any });
			expect(result.valid).toBe(false);
			expect(result.errors[0]).toContain('Phase 60% pours must be between 1 and 4');
		});

		it('rejects invalid phase60Pours (too high)', () => {
			const result = validateAdvancedOptions({ ...validOptions, phase60Pours: 5 as any });
			expect(result.valid).toBe(false);
			expect(result.errors[0]).toContain('Phase 60% pours must be between 1 and 4');
		});

		it('validates custom water temperature', () => {
			const result = validateAdvancedOptions({
				...validOptions,
				waterTemperature: 100
			});
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('96°C'))).toBe(true);
		});

		it('accepts valid custom water temperature', () => {
			const result = validateAdvancedOptions({
				...validOptions,
				waterTemperature: 90
			});
			expect(result.valid).toBe(true);
		});

		it('rejects invalid brewTimeTarget', () => {
			const result = validateAdvancedOptions({
				...validOptions,
				brewTimeTarget: 'super-fast' as any
			});
			expect(result.valid).toBe(false);
			expect(result.errors[0]).toContain('fast, traditional, or slow');
		});

		it('rejects invalid phase40Distribution', () => {
			const result = validateAdvancedOptions({
				...validOptions,
				phase40Distribution: 'extra-sweet' as any
			});
			expect(result.valid).toBe(false);
			expect(result.errors[0]).toContain('equal, sweet-leaning, or acidity-leaning');
		});

		it('collects multiple errors', () => {
			const result = validateAdvancedOptions({
				ratio: 20,
				phase40Pours: 5 as any,
				phase40Distribution: 'invalid' as any,
				phase60Pours: 0 as any,
				brewTimeTarget: 'invalid' as any,
				tastePreferences: {}
			});
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(3);
		});
	});

	describe('validateBrewInputs', () => {
		it('accepts valid inputs', () => {
			const result = validateBrewInputs('Ethiopia', 'light', 20);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('collects errors from all validations', () => {
			const result = validateBrewInputs('', 'invalid-roast', 5);
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBe(3); // One error from each validator
		});

		it('validates bean origin', () => {
			const result = validateBrewInputs('', 'light', 20);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('origin'))).toBe(true);
		});

		it('validates roast profile', () => {
			const result = validateBrewInputs('Ethiopia', 'invalid', 20);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('Roast profile'))).toBe(true);
		});

		it('validates bean weight', () => {
			const result = validateBrewInputs('Ethiopia', 'light', 100);
			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('weight'))).toBe(true);
		});
	});
});
