/**
 * Tetsu Kasuya 4:6 Brewing Method Type Definitions
 *
 * The 4:6 method divides water into two phases:
 * - 40% for sweetness/acidity balance
 * - 60% for strength/body
 */

export type BrewMode = 'simple' | 'advanced';

export type RoastProfile = 'light' | 'light-medium' | 'medium' | 'medium-dark' | 'dark';

export type BrewSpeed = 'fast' | 'traditional' | 'slow';

export type Phase40Distribution = 'equal' | 'sweet-leaning' | 'acidity-leaning';

export type BrewPhase = '40%' | '60%';

/**
 * Represents a single pour in the brew sequence
 */
export interface PourData {
	pourNumber: number;
	waterAmount: number; // grams
	timestamp: number; // seconds from start
	cumulativeWater: number; // total water used up to this pour
	phase: BrewPhase;
	purpose: string; // description of this pour's effect
}

/**
 * Complete brew recipe with all parameters
 */
export interface BrewRecipe {
	totalWater: number; // grams
	beanWeight: number; // grams
	ratio: number; // water-to-coffee ratio (e.g., 15 for 1:15)
	pours: PourData[];
	totalBrewTime: number; // seconds
	temperature: number; // celsius
	grindSize: string; // descriptive recommendation
	methodology: string; // explanation of the recipe
}

/**
 * Basic brewing inputs (required for both modes)
 */
export interface BrewInputs {
	beanOrigin: string;
	roastProfile: RoastProfile;
	beanWeight: number; // grams
	mode: BrewMode;
}

/**
 * Advanced mode customization options
 */
export interface AdvancedOptions {
	ratio: number; // 14-17
	phase40Pours: 1 | 2;
	phase40Distribution: Phase40Distribution;
	phase60Pours: 1 | 2 | 3 | 4;
	waterTemperature?: number; // celsius, optional override
	brewTimeTarget: BrewSpeed;
	tastePreferences: TastePreferences;
}

/**
 * User taste preferences for advanced mode
 */
export interface TastePreferences {
	sweetness?: boolean;
	acidity?: boolean;
	body?: boolean;
	clarity?: boolean;
}
