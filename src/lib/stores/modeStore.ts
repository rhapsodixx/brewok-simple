/**
 * Mode store - manages Simple/Advanced mode selection
 */

import { writable } from 'svelte/store';
import type { BrewMode } from '$lib/types/brewing';

function createModeStore() {
	const { subscribe, set } = writable<BrewMode>('simple');

	return {
		subscribe,
		setSimple: () => {
			set('simple');
		},
		setAdvanced: () => {
			set('advanced');
		},
		toggle: () => {
			let currentMode: BrewMode;
			const unsubscribe = subscribe((value) => {
				currentMode = value;
			});
			unsubscribe();
			set(currentMode! === 'simple' ? 'advanced' : 'simple');
		},
		reset: () => {
			set('simple');
		}
	};
}

export const modeStore = createModeStore();
