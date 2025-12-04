/**
 * API request and response types
 */

import type { BrewRecipe, BrewInputs } from './brewing';
import type { TastePrediction } from './taste';

/**
 * Request body for taste prediction API
 */
export interface TastePredictionRequest {
	recipe: BrewRecipe;
	inputs: BrewInputs;
}

/**
 * Response from taste prediction API
 */
export interface TastePredictionResponse {
	tastePrediction: TastePrediction;
}

/**
 * API error response
 */
export interface ApiErrorResponse {
	error: string;
	details?: string;
}
