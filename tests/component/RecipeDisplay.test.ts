/**
 * Unit tests for RecipeDisplay component
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import RecipeDisplay from '$lib/components/RecipeDisplay.svelte';
import type { BrewRecipe } from '$lib/types/brewing';

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
			purpose: 'Bloom and sweetness'
		},
		{
			pourNumber: 2,
			waterAmount: 60,
			timestamp: 45,
			cumulativeWater: 120,
			phase: '40%',
			purpose: 'Acidity control'
		},
		{
			pourNumber: 3,
			waterAmount: 60,
			timestamp: 90,
			cumulativeWater: 180,
			phase: '60%',
			purpose: 'Body development'
		},
		{
			pourNumber: 4,
			waterAmount: 60,
			timestamp: 135,
			cumulativeWater: 240,
			phase: '60%',
			purpose: 'Strength'
		},
		{
			pourNumber: 5,
			waterAmount: 60,
			timestamp: 180,
			cumulativeWater: 300,
			phase: '60%',
			purpose: 'Final extraction'
		}
	],
	totalBrewTime: 210,
	temperature: 92,
	grindSize: 'Medium-Coarse',
	methodology: 'Traditional 4:6 method with balanced sweetness and acidity'
};

describe('RecipeDisplay', () => {
	it('renders loading skeleton when isLoading is true', () => {
		const { container } = render(RecipeDisplay, {
			props: { recipe: null, isLoading: true }
		});

		const skeletons = container.querySelectorAll('.animate-pulse');
		expect(skeletons.length).toBeGreaterThan(0);
	});

	it('renders nothing when no recipe and not loading', () => {
		const { container } = render(RecipeDisplay, {
			props: { recipe: null, isLoading: false }
		});

		const cards = container.querySelectorAll('.rounded-lg.border');
		expect(cards.length).toBe(0);
	});

	it('renders recipe title when recipe provided', () => {
		const { getByText } = render(RecipeDisplay, {
			props: { recipe: mockRecipe, isLoading: false }
		});

		expect(getByText('Your V60 Recipe')).toBeTruthy();
	});

	it('displays recipe badges with correct values', () => {
		const { getByText } = render(RecipeDisplay, {
			props: { recipe: mockRecipe, isLoading: false }
		});

		expect(getByText('1:15')).toBeTruthy();
		expect(getByText('92°C')).toBeTruthy();
		expect(getByText('3:30')).toBeTruthy();
	});

	it('renders pour schedule table', () => {
		const { getByText } = render(RecipeDisplay, {
			props: { recipe: mockRecipe, isLoading: false }
		});

		expect(getByText('Pour Schedule')).toBeTruthy();
		expect(getByText('Pour #')).toBeTruthy();
		expect(getByText('Water')).toBeTruthy();
		expect(getByText('Time')).toBeTruthy();
	});

	it('displays all pours in table', () => {
		const { getByText } = render(RecipeDisplay, {
			props: { recipe: mockRecipe, isLoading: false }
		});

		mockRecipe.pours.forEach((pour) => {
			expect(getByText(String(pour.pourNumber))).toBeTruthy();
			expect(getByText(`${pour.waterAmount}g`)).toBeTruthy();
		});
	});

	it('displays total water and bean weight', () => {
		const { getByText } = render(RecipeDisplay, {
			props: { recipe: mockRecipe, isLoading: false }
		});

		expect(getByText(/Total water: 300g/)).toBeTruthy();
		expect(getByText(/Bean dose: 20g/)).toBeTruthy();
	});

	it('displays brewing details', () => {
		const { getByText } = render(RecipeDisplay, {
			props: { recipe: mockRecipe, isLoading: false }
		});

		expect(getByText('Temperature')).toBeTruthy();
		expect(getByText('Grind Size')).toBeTruthy();
		expect(getByText('Total Brew Time')).toBeTruthy();
		expect(getByText('Ratio')).toBeTruthy();
	});

	it('displays grind size recommendation', () => {
		const { getByText } = render(RecipeDisplay, {
			props: { recipe: mockRecipe, isLoading: false }
		});

		expect(getByText('Medium-Coarse')).toBeTruthy();
	});

	it('displays methodology when provided', () => {
		const { getByText } = render(RecipeDisplay, {
			props: { recipe: mockRecipe, isLoading: false }
		});

		expect(getByText('4:6 Method')).toBeTruthy();
		expect(getByText(mockRecipe.methodology)).toBeTruthy();
	});

	it('renders phase badges correctly', () => {
		const { getAllByText } = render(RecipeDisplay, {
			props: { recipe: mockRecipe, isLoading: false }
		});

		const phase40Badges = getAllByText('40%');
		const phase60Badges = getAllByText('60%');

		expect(phase40Badges.length).toBe(2);
		expect(phase60Badges.length).toBe(3);
	});
});
