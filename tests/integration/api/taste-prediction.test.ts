/**
 * Integration tests for taste prediction API endpoint
 */

import { describe, it, expect, vi } from 'vitest';
import { POST } from '$lib/../routes/api/taste-prediction/+server';
import type { BrewRecipe, BrewInputs } from '$lib/types/brewing';
import * as openRouterService from '$lib/services/openRouterService';

// Mock the service
vi.mock('$lib/services/openRouterService', () => ({
	getTastePrediction: vi.fn()
}));

// Mock PostHog
vi.mock('$lib/server/posthog', () => ({
	default: {
		capture: vi.fn()
	}
}));

describe('POST /api/taste-prediction', () => {
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
				purpose: 'Test'
			}
		],
		totalBrewTime: 210,
		temperature: 92,
		grindSize: 'Coarse',
		methodology: 'Test'
	};

	const mockInputs: BrewInputs = {
		beanOrigin: 'Ethiopia',
		roastProfile: 'light',
		beanWeight: 20,
		mode: 'simple'
	};

	it('returns taste prediction on success', async () => {
		const mockTastePrediction = {
			acidity: 'Bright citrus',
			sweetness: 'Honeyed',
			body: 'Medium',
			clarity: 'Clean',
			balance: 'Balanced',
			confidence: 'high' as const
		};

		vi.mocked(openRouterService.getTastePrediction).mockResolvedValue(
			mockTastePrediction
		);

		const request = new Request('http://localhost/api/taste-prediction', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ recipe: mockRecipe, inputs: mockInputs })
		});

		const response = await POST({ request } as any);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.tastePrediction).toEqual(mockTastePrediction);
	});

	it('returns 400 for missing recipe', async () => {
		const request = new Request('http://localhost/api/taste-prediction', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ inputs: mockInputs })
		});

		const response = await POST({ request } as any);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toContain('required');
	});

	it('returns 400 for missing inputs', async () => {
		const request = new Request('http://localhost/api/taste-prediction', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ recipe: mockRecipe })
		});

		const response = await POST({ request } as any);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toContain('required');
	});

	it('returns 400 for invalid recipe structure', async () => {
		const invalidRecipe = { ...mockRecipe, pours: [] };

		const request = new Request('http://localhost/api/taste-prediction', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ recipe: invalidRecipe, inputs: mockInputs })
		});

		const response = await POST({ request } as any);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.error).toContain('Invalid recipe');
	});

	it('returns 500 on service error', async () => {
		vi.mocked(openRouterService.getTastePrediction).mockRejectedValue(
			new Error('Service error')
		);

		const request = new Request('http://localhost/api/taste-prediction', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ recipe: mockRecipe, inputs: mockInputs })
		});

		const response = await POST({ request } as any);
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data.error).toContain('Failed to generate');
	});

	it('includes error details in response', async () => {
		vi.mocked(openRouterService.getTastePrediction).mockRejectedValue(
			new Error('Specific error message')
		);

		const request = new Request('http://localhost/api/taste-prediction', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ recipe: mockRecipe, inputs: mockInputs })
		});

		const response = await POST({ request } as any);
		const data = await response.json();

		expect(data.details).toContain('Specific error message');
	});
});
