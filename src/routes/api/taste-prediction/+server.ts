/**
 * Taste prediction API endpoint
 * POST /api/taste-prediction
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTastePrediction } from '$lib/services/openRouterService';
import posthog from '$lib/server/posthog';
import type { TastePredictionRequest } from '$lib/types/api';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body: TastePredictionRequest = await request.json();
		const { recipe, inputs } = body;

		// Validate request body
		if (!recipe || !inputs) {
			return json(
				{ error: 'Missing required data: recipe and inputs are required' },
				{ status: 400 }
			);
		}

		// Validate recipe structure
		if (!recipe.pours || !Array.isArray(recipe.pours) || recipe.pours.length === 0) {
			return json({ error: 'Invalid recipe: pours array is required' }, { status: 400 });
		}

		// Get taste prediction
		const tastePrediction = await getTastePrediction(recipe, inputs);

		// Track successful prediction
		posthog.capture({
			distinctId: inputs.beanOrigin || 'unknown',
			event: 'taste_prediction_generated',
			properties: {
				mode: inputs.mode,
				beanOrigin: inputs.beanOrigin,
				roastProfile: inputs.roastProfile,
				beanWeight: recipe.beanWeight,
				ratio: recipe.ratio,
				confidence: tastePrediction.confidence
			}
		});

		return json({ tastePrediction });
	} catch (error: any) {
		// Track error
		posthog.capture({
			distinctId: 'system',
			event: '$exception',
			properties: {
				$exception_type: error.name || 'Error',
				$exception_message: error.message,
				endpoint: '/api/taste-prediction'
			}
		});

		console.error('Taste prediction API error:', error);

		return json(
			{
				error: 'Failed to generate taste prediction',
				details: error.message
			},
			{ status: 500 }
		);
	}
};
