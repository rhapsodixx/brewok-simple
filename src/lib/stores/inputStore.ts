/**
 * Input store - manages user brewing inputs
 */

import { writable } from 'svelte/store';
import type { BrewInputs, AdvancedOptions } from '$lib/types/brewing';

interface InputState {
	basic: BrewInputs | null;
	advanced: AdvancedOptions | null;
}

function createInputStore() {
	const { subscribe, set, update } = writable<InputState>({
		basic: null,
		advanced: null
	});

	return {
		subscribe,
		setBasicInputs: (inputs: BrewInputs) => {
			update((state) => ({ ...state, basic: inputs }));
		},
		setAdvancedOptions: (options: AdvancedOptions) => {
			update((state) => ({ ...state, advanced: options }));
		},
		updateBasicInput: <K extends keyof BrewInputs>(
			key: K,
			value: BrewInputs[K]
		) => {
			update((state) => ({
				...state,
				basic: state.basic ? { ...state.basic, [key]: value } : null
			}));
		},
		updateAdvancedOption: <K extends keyof AdvancedOptions>(
			key: K,
			value: AdvancedOptions[K]
		) => {
			update((state) => ({
				...state,
				advanced: state.advanced ? { ...state.advanced, [key]: value } : null
			}));
		},
		reset: () => {
			set({
				basic: null,
				advanced: null
			});
		}
	};
}

export const inputStore = createInputStore();
