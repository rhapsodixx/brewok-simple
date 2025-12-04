/**
 * Recipe store - manages generated recipe and taste prediction
 */

import { writable } from 'svelte/store';
import type { BrewRecipe } from '$lib/types/brewing';
import type { TastePrediction } from '$lib/types/taste';

interface RecipeState {
	recipe: BrewRecipe | null;
	tastePrediction: TastePrediction | null;
	isGenerating: boolean;
	isGeneratingTaste: boolean;
	error: string | null;
}

function createRecipeStore() {
	const { subscribe, set, update } = writable<RecipeState>({
		recipe: null,
		tastePrediction: null,
		isGenerating: false,
		isGeneratingTaste: false,
		error: null
	});

	return {
		subscribe,
		setRecipe: (recipe: BrewRecipe) => {
			update((state) => ({
				...state,
				recipe,
				isGenerating: false,
				error: null
			}));
		},
		setTastePrediction: (prediction: TastePrediction) => {
			update((state) => ({
				...state,
				tastePrediction: prediction,
				isGeneratingTaste: false
			}));
		},
		setGenerating: (isGenerating: boolean) => {
			update((state) => ({
				...state,
				isGenerating,
				error: isGenerating ? null : state.error
			}));
		},
		setGeneratingTaste: (isGeneratingTaste: boolean) => {
			update((state) => ({
				...state,
				isGeneratingTaste
			}));
		},
		setError: (error: string | null) => {
			update((state) => ({
				...state,
				error,
				isGenerating: false,
				isGeneratingTaste: false
			}));
		},
		clearError: () => {
			update((state) => ({
				...state,
				error: null
			}));
		},
		reset: () => {
			set({
				recipe: null,
				tastePrediction: null,
				isGenerating: false,
				isGeneratingTaste: false,
				error: null
			});
		}
	};
}

export const recipeStore = createRecipeStore();
