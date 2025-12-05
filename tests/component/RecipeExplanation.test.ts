/**
 * Unit tests for RecipeExplanation component
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import RecipeExplanation from '$lib/components/RecipeExplanation.svelte';
import type { BrewRecipe } from '$lib/types/brewing';

const mockRecipe: BrewRecipe = {
	totalWater: 300,
	beanWeight: 20,
	ratio: 15,
	pours: [],
	totalBrewTime: 210,
	temperature: 92,
	grindSize: 'Medium-Coarse',
	methodology:
		'This recipe uses the traditional 4:6 method with 2 pours in the first 40% phase for balanced sweetness and acidity, followed by 3 pours in the 60% phase for medium body and strength.'
};

describe('RecipeExplanation', () => {
	it('renders nothing when no recipe provided', () => {
		const { container } = render(RecipeExplanation, {
			props: { recipe: null }
		});

		const cards = container.querySelectorAll('.rounded-lg.border');
		expect(cards.length).toBe(0);
	});

	it('renders title when recipe provided', () => {
		const { getByText } = render(RecipeExplanation, {
			props: { recipe: mockRecipe }
		});

		expect(getByText('Why This Recipe Works')).toBeTruthy();
	});

	it('displays methodology text', () => {
		const { getByText } = render(RecipeExplanation, {
			props: { recipe: mockRecipe }
		});

		expect(getByText(mockRecipe.methodology)).toBeTruthy();
	});

	it('displays key principles section', () => {
		const { getByText } = render(RecipeExplanation, {
			props: { recipe: mockRecipe }
		});

		expect(getByText('Key Principles of the 4:6 Method')).toBeTruthy();
	});

	it('displays 40% phase principle', () => {
		const { getByText } = render(RecipeExplanation, {
			props: { recipe: mockRecipe }
		});

		expect(getByText(/40% Phase/)).toBeTruthy();
		expect(getByText(/Controls sweetness vs. acidity balance/)).toBeTruthy();
	});

	it('displays 60% phase principle', () => {
		const { getByText } = render(RecipeExplanation, {
			props: { recipe: mockRecipe }
		});

		expect(getByText(/60% Phase/)).toBeTruthy();
		expect(getByText(/Controls strength and body/)).toBeTruthy();
	});

	it('displays timing principle', () => {
		const { getByText } = render(RecipeExplanation, {
			props: { recipe: mockRecipe }
		});

		expect(getByText(/Consistent Pour Intervals/)).toBeTruthy();
		expect(getByText(/Regular timing ensures even extraction/)).toBeTruthy();
	});

	it('displays temperature principle', () => {
		const { getByText } = render(RecipeExplanation, {
			props: { recipe: mockRecipe }
		});

		expect(getByText(/Temperature Matters/)).toBeTruthy();
		expect(getByText(/Lighter roasts need higher temps/)).toBeTruthy();
	});

	it('displays brewing tips section', () => {
		const { getByText } = render(RecipeExplanation, {
			props: { recipe: mockRecipe }
		});

		expect(getByText('Brewing Tips')).toBeTruthy();
	});

	it('displays specific brewing tips', () => {
		const { getByText } = render(RecipeExplanation, {
			props: { recipe: mockRecipe }
		});

		expect(getByText(/Start your timer/)).toBeTruthy();
		expect(getByText(/Pour in a circular motion/)).toBeTruthy();
		expect(getByText(/Wait for the water level to drop/)).toBeTruthy();
		expect(getByText(/Adjust grind size/)).toBeTruthy();
		expect(getByText(/Use filtered water/)).toBeTruthy();
		expect(getByText(/Preheat your V60/)).toBeTruthy();
	});

	it('displays external resource link', () => {
		const { getByText } = render(RecipeExplanation, {
			props: { recipe: mockRecipe }
		});

		const link = getByText(/Learn more about the Tetsu Kasuya 4:6 method/);
		expect(link).toBeTruthy();
		expect(link.closest('a')?.getAttribute('href')).toContain('connorraikar.wordpress.com');
		expect(link.closest('a')?.getAttribute('target')).toBe('_blank');
		expect(link.closest('a')?.getAttribute('rel')).toBe('noopener noreferrer');
	});
});
