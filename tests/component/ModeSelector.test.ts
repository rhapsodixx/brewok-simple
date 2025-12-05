/**
 * Unit tests for ModeSelector component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import ModeSelector from '$lib/components/ModeSelector.svelte';

describe('ModeSelector', () => {
	it('renders title and description', () => {
		const { getByText } = render(ModeSelector, {
			props: { onModeSelected: vi.fn() }
		});

		expect(getByText('Brewok Simple')).toBeTruthy();
		expect(getByText('Your 4:6 V60 brewing assistant')).toBeTruthy();
	});

	it('renders both mode cards', () => {
		const { getByText } = render(ModeSelector, {
			props: { onModeSelected: vi.fn() }
		});

		expect(getByText('Simple Mode')).toBeTruthy();
		expect(getByText('Advanced Mode')).toBeTruthy();
	});

	it('displays simple mode features', () => {
		const { getByText } = render(ModeSelector, {
			props: { onModeSelected: vi.fn() }
		});

		expect(getByText(/1:15 ratio/)).toBeTruthy();
		expect(getByText(/2 pours for 40%/)).toBeTruthy();
		expect(getByText(/3 pours for 60%/)).toBeTruthy();
	});

	it('displays advanced mode features', () => {
		const { getByText } = render(ModeSelector, {
			props: { onModeSelected: vi.fn() }
		});

		expect(getByText(/Custom ratio/)).toBeTruthy();
		expect(getByText(/Adjustable pour counts/)).toBeTruthy();
		expect(getByText(/Temperature and timing customization/)).toBeTruthy();
	});

	it('calls onModeSelected with "simple" when simple mode button clicked', async () => {
		const mockCallback = vi.fn();
		const { getByText } = render(ModeSelector, {
			props: { onModeSelected: mockCallback }
		});

		const button = getByText('Choose Simple Mode');
		await fireEvent.click(button);

		expect(mockCallback).toHaveBeenCalledWith('simple');
	});

	it('calls onModeSelected with "advanced" when advanced mode button clicked', async () => {
		const mockCallback = vi.fn();
		const { getByText } = render(ModeSelector, {
			props: { onModeSelected: mockCallback }
		});

		const button = getByText('Choose Advanced Mode');
		await fireEvent.click(button);

		expect(mockCallback).toHaveBeenCalledWith('advanced');
	});

	it('calls onModeSelected when card is clicked', async () => {
		const mockCallback = vi.fn();
		const { getByText } = render(ModeSelector, {
			props: { onModeSelected: mockCallback }
		});

		const card = getByText('Simple Mode').closest('.cursor-pointer');
		if (card) {
			await fireEvent.click(card);
			expect(mockCallback).toHaveBeenCalledWith('simple');
		}
	});
});
