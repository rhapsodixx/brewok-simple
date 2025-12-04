/**
 * Unit tests for Svelte stores
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { modeStore } from '$lib/stores/modeStore';
import { inputStore } from '$lib/stores/inputStore';
import { recipeStore } from '$lib/stores/recipeStore';
import type { BrewInputs, AdvancedOptions, BrewRecipe } from '$lib/types/brewing';
import type { TastePrediction } from '$lib/types/taste';

describe('modeStore', () => {
	beforeEach(() => {
		modeStore.reset();
	});

	it('initializes with simple mode', () => {
		const mode = get(modeStore);
		expect(mode).toBe('simple');
	});

	it('sets simple mode', () => {
		modeStore.setAdvanced();
		modeStore.setSimple();
		expect(get(modeStore)).toBe('simple');
	});

	it('sets advanced mode', () => {
		modeStore.setAdvanced();
		expect(get(modeStore)).toBe('advanced');
	});

	it('toggles from simple to advanced', () => {
		modeStore.setSimple();
		modeStore.toggle();
		expect(get(modeStore)).toBe('advanced');
	});

	it('toggles from advanced to simple', () => {
		modeStore.setAdvanced();
		modeStore.toggle();
		expect(get(modeStore)).toBe('simple');
	});

	it('resets to simple mode', () => {
		modeStore.setAdvanced();
		modeStore.reset();
		expect(get(modeStore)).toBe('simple');
	});
});

describe('inputStore', () => {
	beforeEach(() => {
		inputStore.reset();
	});

	const mockBasicInputs: BrewInputs = {
		beanOrigin: 'Ethiopia',
		roastProfile: 'light',
		beanWeight: 20,
		mode: 'simple'
	};

	const mockAdvancedOptions: AdvancedOptions = {
		ratio: 15,
		phase40Pours: 2,
		phase40Distribution: 'equal',
		phase60Pours: 3,
		brewTimeTarget: 'traditional',
		tastePreferences: {}
	};

	it('initializes with null values', () => {
		const state = get(inputStore);
		expect(state.basic).toBeNull();
		expect(state.advanced).toBeNull();
	});

	it('sets basic inputs', () => {
		inputStore.setBasicInputs(mockBasicInputs);
		const state = get(inputStore);
		expect(state.basic).toEqual(mockBasicInputs);
	});

	it('sets advanced options', () => {
		inputStore.setAdvancedOptions(mockAdvancedOptions);
		const state = get(inputStore);
		expect(state.advanced).toEqual(mockAdvancedOptions);
	});

	it('updates single basic input', () => {
		inputStore.setBasicInputs(mockBasicInputs);
		inputStore.updateBasicInput('beanOrigin', 'Kenya');
		const state = get(inputStore);
		expect(state.basic?.beanOrigin).toBe('Kenya');
	});

	it('updates single advanced option', () => {
		inputStore.setAdvancedOptions(mockAdvancedOptions);
		inputStore.updateAdvancedOption('ratio', 16);
		const state = get(inputStore);
		expect(state.advanced?.ratio).toBe(16);
	});

	it('preserves other inputs when updating single value', () => {
		inputStore.setBasicInputs(mockBasicInputs);
		inputStore.updateBasicInput('beanWeight', 25);
		const state = get(inputStore);
		expect(state.basic?.beanOrigin).toBe('Ethiopia');
		expect(state.basic?.roastProfile).toBe('light');
		expect(state.basic?.beanWeight).toBe(25);
	});

	it('resets to null values', () => {
		inputStore.setBasicInputs(mockBasicInputs);
		inputStore.setAdvancedOptions(mockAdvancedOptions);
		inputStore.reset();
		const state = get(inputStore);
		expect(state.basic).toBeNull();
		expect(state.advanced).toBeNull();
	});

	it('handles update when basic is null', () => {
		inputStore.updateBasicInput('beanOrigin', 'Ethiopia');
		const state = get(inputStore);
		expect(state.basic).toBeNull();
	});
});

describe('recipeStore', () => {
	beforeEach(() => {
		recipeStore.reset();
	});

	const mockRecipe: BrewRecipe = {
		totalWater: 300,
		beanWeight: 20,
		ratio: 15,
		pours: [],
		totalBrewTime: 210,
		temperature: 92,
		grindSize: 'Coarse',
		methodology: 'Test'
	};

	const mockTastePrediction: TastePrediction = {
		acidity: 'Bright',
		sweetness: 'Honeyed',
		body: 'Medium',
		clarity: 'Clean',
		balance: 'Balanced',
		confidence: 'high'
	};

	it('initializes with null values and false flags', () => {
		const state = get(recipeStore);
		expect(state.recipe).toBeNull();
		expect(state.tastePrediction).toBeNull();
		expect(state.isGenerating).toBe(false);
		expect(state.isGeneratingTaste).toBe(false);
		expect(state.error).toBeNull();
	});

	it('sets recipe', () => {
		recipeStore.setRecipe(mockRecipe);
		const state = get(recipeStore);
		expect(state.recipe).toEqual(mockRecipe);
		expect(state.isGenerating).toBe(false);
	});

	it('sets taste prediction', () => {
		recipeStore.setTastePrediction(mockTastePrediction);
		const state = get(recipeStore);
		expect(state.tastePrediction).toEqual(mockTastePrediction);
		expect(state.isGeneratingTaste).toBe(false);
	});

	it('sets generating flag', () => {
		recipeStore.setGenerating(true);
		expect(get(recipeStore).isGenerating).toBe(true);
		recipeStore.setGenerating(false);
		expect(get(recipeStore).isGenerating).toBe(false);
	});

	it('sets generating taste flag', () => {
		recipeStore.setGeneratingTaste(true);
		expect(get(recipeStore).isGeneratingTaste).toBe(true);
		recipeStore.setGeneratingTaste(false);
		expect(get(recipeStore).isGeneratingTaste).toBe(false);
	});

	it('sets error', () => {
		recipeStore.setError('Test error');
		const state = get(recipeStore);
		expect(state.error).toBe('Test error');
		expect(state.isGenerating).toBe(false);
		expect(state.isGeneratingTaste).toBe(false);
	});

	it('clears error', () => {
		recipeStore.setError('Test error');
		recipeStore.clearError();
		expect(get(recipeStore).error).toBeNull();
	});

	it('clears error when starting generation', () => {
		recipeStore.setError('Previous error');
		recipeStore.setGenerating(true);
		expect(get(recipeStore).error).toBeNull();
	});

	it('resets all state', () => {
		recipeStore.setRecipe(mockRecipe);
		recipeStore.setTastePrediction(mockTastePrediction);
		recipeStore.setGenerating(true);
		recipeStore.setError('Error');
		recipeStore.reset();

		const state = get(recipeStore);
		expect(state.recipe).toBeNull();
		expect(state.tastePrediction).toBeNull();
		expect(state.isGenerating).toBe(false);
		expect(state.isGeneratingTaste).toBe(false);
		expect(state.error).toBeNull();
	});

	it('preserves recipe when setting taste prediction', () => {
		recipeStore.setRecipe(mockRecipe);
		recipeStore.setTastePrediction(mockTastePrediction);
		const state = get(recipeStore);
		expect(state.recipe).toEqual(mockRecipe);
		expect(state.tastePrediction).toEqual(mockTastePrediction);
	});

	it('handles error state correctly', () => {
		recipeStore.setGenerating(true);
		recipeStore.setError('Failed to generate');
		const state = get(recipeStore);
		expect(state.error).toBe('Failed to generate');
		expect(state.isGenerating).toBe(false);
	});
});
