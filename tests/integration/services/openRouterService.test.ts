/**
 * Integration tests for OpenRouter service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	buildTastePredictionPrompt,
	parseTastePrediction,
	getFallbackTastePrediction,
	getTastePrediction
} from '$lib/services/openRouterService';
import type { BrewRecipe, BrewInputs } from '$lib/types/brewing';
import * as openRouterClient from '$lib/server/openRouterClient';

// Mock the OpenRouter client
vi.mock('$lib/server/openRouterClient', () => ({
	callOpenRouter: vi.fn()
}));

describe('openRouterService', () => {
	const mockRecipe: BrewRecipe = {
		totalWater: 300,
		beanWeight: 20,
		ratio: 15,
		pours: [
			{
				pourNumber: 1,
				waterAmount: 60,
				timestamp: 0,
				cumulativeWater: 60,
				phase: '40%',
				purpose: 'Bloom'
			},
			{
				pourNumber: 2,
				waterAmount: 60,
				timestamp: 45,
				cumulativeWater: 120,
				phase: '40%',
				purpose: 'Acidity'
			},
			{
				pourNumber: 3,
				waterAmount: 60,
				timestamp: 90,
				cumulativeWater: 180,
				phase: '60%',
				purpose: 'Body'
			},
			{
				pourNumber: 4,
				waterAmount: 60,
				timestamp: 135,
				cumulativeWater: 240,
				phase: '60%',
				purpose: 'Body'
			},
			{
				pourNumber: 5,
				waterAmount: 60,
				timestamp: 180,
				cumulativeWater: 300,
				phase: '60%',
				purpose: 'Strength'
			}
		],
		totalBrewTime: 210,
		temperature: 92,
		grindSize: 'Coarse',
		methodology: 'Test methodology'
	};

	const mockInputs: BrewInputs = {
		beanOrigin: 'Ethiopia',
		roastProfile: 'light',
		beanWeight: 20,
		mode: 'simple'
	};

	describe('buildTastePredictionPrompt', () => {
		it('includes all coffee parameters', () => {
			const prompt = buildTastePredictionPrompt(mockRecipe, mockInputs);

			expect(prompt).toContain('Ethiopia');
			expect(prompt).toContain('light');
			expect(prompt).toContain('20g');
		});

		it('includes recipe parameters', () => {
			const prompt = buildTastePredictionPrompt(mockRecipe, mockInputs);

			expect(prompt).toContain('1:15');
			expect(prompt).toContain('92°C');
			expect(prompt).toContain('3:30');
		});

		it('includes pour structure', () => {
			const prompt = buildTastePredictionPrompt(mockRecipe, mockInputs);

			expect(prompt).toContain('Pour 1');
			expect(prompt).toContain('60g');
			expect(prompt).toContain('40%');
		});

		it('includes 4:6 method context', () => {
			const prompt = buildTastePredictionPrompt(mockRecipe, mockInputs);

			expect(prompt).toContain('4:6');
			expect(prompt).toContain('sweetness/acidity');
			expect(prompt).toContain('strength/body');
		});

		it('requests structured sections', () => {
			const prompt = buildTastePredictionPrompt(mockRecipe, mockInputs);

			expect(prompt).toContain('Acidity');
			expect(prompt).toContain('Sweetness');
			expect(prompt).toContain('Body');
			expect(prompt).toContain('Clarity');
			expect(prompt).toContain('Overall Balance');
		});
	});

	describe('parseTastePrediction', () => {
		it('parses structured AI response', () => {
			const aiResponse = `**Acidity:** Bright citrus, malic acidity

**Sweetness:** Honeyed, floral notes

**Body:** Silky, medium body

**Clarity:** Clean, crisp finish

**Overall Balance:** Well-balanced with vibrant acidity`;

			const result = parseTastePrediction(aiResponse);

			expect(result.acidity).toContain('Bright citrus');
			expect(result.sweetness).toContain('Honeyed');
			expect(result.body).toContain('Silky');
			expect(result.clarity).toContain('Clean');
			expect(result.balance).toContain('Well-balanced');
			expect(result.confidence).toBe('high');
		});

		it('handles response without markers', () => {
			const aiResponse = 'This coffee will be bright and fruity with medium body.';

			const result = parseTastePrediction(aiResponse);

			expect(result.confidence).toBe('low');
			expect(result.acidity).toBeTruthy();
		});

		it('handles partial structured response', () => {
			const aiResponse = `**Acidity:** Bright

Some other text

**Body:** Medium`;

			const result = parseTastePrediction(aiResponse);

			expect(result.acidity).toContain('Bright');
			expect(result.body).toContain('Medium');
			expect(result.confidence).toBe('medium');
		});

		it('provides defaults for missing sections', () => {
			const aiResponse = '**Acidity:** Bright citrus';

			const result = parseTastePrediction(aiResponse);

			expect(result.acidity).toBeTruthy();
			expect(result.sweetness).toBeTruthy();
			expect(result.body).toBeTruthy();
			expect(result.clarity).toBeTruthy();
			expect(result.balance).toBeTruthy();
		});
	});

	describe('getFallbackTastePrediction', () => {
		it('provides fallback prediction', () => {
			const result = getFallbackTastePrediction(mockInputs, mockRecipe);

			expect(result.acidity).toBeTruthy();
			expect(result.sweetness).toBeTruthy();
			expect(result.body).toBeTruthy();
			expect(result.clarity).toBeTruthy();
			expect(result.balance).toBeTruthy();
			expect(result.confidence).toBe('low');
		});

		it('includes origin information', () => {
			const result = getFallbackTastePrediction(mockInputs, mockRecipe);

			expect(result.sweetness).toContain('Ethiopia');
		});

		it('includes roast information', () => {
			const result = getFallbackTastePrediction(mockInputs, mockRecipe);

			expect(result.acidity).toContain('light');
		});

		it('handles different origins', () => {
			const kenyaInputs = { ...mockInputs, beanOrigin: 'Kenya' };
			const result = getFallbackTastePrediction(kenyaInputs, mockRecipe);

			expect(result.sweetness).toContain('Kenya');
		});

		it('handles different roast profiles', () => {
			const darkInputs = { ...mockInputs, roastProfile: 'dark' as const };
			const result = getFallbackTastePrediction(darkInputs, mockRecipe);

			expect(result.acidity).toContain('dark');
		});
	});

	describe('getTastePrediction', () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it('calls OpenRouter API and parses response', async () => {
			const mockResponse = `**Acidity:** Bright

**Sweetness:** Honey

**Body:** Medium

**Clarity:** Clean

**Overall Balance:** Balanced`;

			vi.mocked(openRouterClient.callOpenRouter).mockResolvedValue(mockResponse);

			const result = await getTastePrediction(mockRecipe, mockInputs);

			expect(openRouterClient.callOpenRouter).toHaveBeenCalledTimes(1);
			expect(result.acidity).toContain('Bright');
			expect(result.sweetness).toContain('Honey');
		});

		it('uses fallback on API error', async () => {
			vi.mocked(openRouterClient.callOpenRouter).mockRejectedValue(
				new Error('API Error')
			);

			const result = await getTastePrediction(mockRecipe, mockInputs);

			expect(result.confidence).toBe('low');
			expect(result.acidity).toBeTruthy();
			expect(result.sweetness).toBeTruthy();
		});

		it('passes correct parameters to API', async () => {
			vi.mocked(openRouterClient.callOpenRouter).mockResolvedValue('Response');

			await getTastePrediction(mockRecipe, mockInputs);

			const call = vi.mocked(openRouterClient.callOpenRouter).mock.calls[0];
			expect(call[0]).toContain('Ethiopia'); // prompt
			expect(call[1]).toContain('expert coffee cupper'); // system prompt
		});
	});
});
