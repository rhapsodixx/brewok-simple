/**
 * OpenRouter taste prediction service
 * Builds prompts, calls API, and parses responses
 */

import type { BrewRecipe, BrewInputs } from '$lib/types/brewing';
import type { TastePrediction } from '$lib/types/taste';
import { callOpenRouter } from '$lib/server/openRouterClient';

/**
 * System prompt for the AI cupper
 */
const SYSTEM_PROMPT = `You are an expert coffee cupper with extensive knowledge of:
- Coffee flavor profiles by origin (terroir characteristics)
- How roast levels affect flavor development
- The Tetsu Kasuya 4:6 brewing method's impact on taste
- Extraction science and how brew parameters affect final cup quality

Your task is to predict the taste profile of a V60 brew based on the recipe parameters provided. Your predictions should be:
- Professional and detailed (like a cupping form)
- Grounded in coffee science
- Specific to the bean origin and roast level
- Clear about how the 4:6 pour structure affects the result

Format your response with clear sections: Acidity, Sweetness, Body, Clarity, and Overall Balance.`;

/**
 * Format time in MM:SS
 */
function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * Build taste prediction prompt from recipe and inputs
 */
export function buildTastePredictionPrompt(
	recipe: BrewRecipe,
	inputs: BrewInputs
): string {
	const pourSummary = recipe.pours
		.map(
			(p) =>
				`Pour ${p.pourNumber}: ${p.waterAmount}g at ${formatTime(p.timestamp)} (${p.phase} phase)`
		)
		.join('\n');

	const phase40Pours = recipe.pours.filter((p) => p.phase === '40%').length;
	const phase60Pours = recipe.pours.filter((p) => p.phase === '60%').length;

	return `Predict the taste profile for this V60 brew:

**Coffee:**
- Origin: ${inputs.beanOrigin}
- Roast: ${inputs.roastProfile}
- Dose: ${recipe.beanWeight}g

**Recipe:**
- Ratio: 1:${recipe.ratio}
- Temperature: ${recipe.temperature}°C
- Total brew time: ${formatTime(recipe.totalBrewTime)}
- Grind: ${recipe.grindSize}

**Pour Structure (4:6 method):**
${pourSummary}

**Context:**
- First ${phase40Pours} pour(s) = 40% of water (controls sweetness/acidity balance)
- Final ${phase60Pours} pour(s) = 60% of water (controls strength/body)

Provide a detailed cupping assessment with these sections:

**Acidity:** Describe the acidity character and intensity

**Sweetness:** Describe the type and quality of sweetness

**Body:** Describe the weight and texture (mouthfeel)

**Clarity:** Describe the finish and clarity

**Overall Balance:** Provide an overall assessment of the cup`;
}

/**
 * Parse AI response into structured TastePrediction
 */
export function parseTastePrediction(aiResponse: string): TastePrediction {
	const sections: Record<string, string> = {
		acidity: '',
		sweetness: '',
		body: '',
		clarity: '',
		balance: ''
	};

	// Extract sections by looking for section headers
	const sectionPatterns = {
		acidity: /\*\*Acidity:?\*\*\s*(.*?)(?=\n\*\*|$)/is,
		sweetness: /\*\*Sweetness:?\*\*\s*(.*?)(?=\n\*\*|$)/is,
		body: /\*\*Body:?\*\*\s*(.*?)(?=\n\*\*|$)/is,
		clarity: /\*\*Clarity:?\*\*\s*(.*?)(?=\n\*\*|$)/is,
		balance: /\*\*Overall Balance:?\*\*\s*(.*?)(?=\n\*\*|$)/is
	};

	// Try to extract each section
	for (const [key, pattern] of Object.entries(sectionPatterns)) {
		const match = aiResponse.match(pattern);
		if (match && match[1]) {
			sections[key] = match[1].trim();
		}
	}

	// If structured parsing failed, use fallback
	if (
		!sections.acidity &&
		!sections.sweetness &&
		!sections.body &&
		!sections.clarity &&
		!sections.balance
	) {
		// Fallback: use the entire response
		return {
			acidity: aiResponse.substring(0, 200),
			sweetness: '',
			body: '',
			clarity: '',
			balance: aiResponse.substring(200, 400) || 'Balanced cup profile expected.',
			confidence: 'low'
		};
	}

	return {
		acidity: sections.acidity || 'Acidity profile will vary based on extraction',
		sweetness: sections.sweetness || 'Sweetness profile will develop during extraction',
		body: sections.body || 'Medium body expected',
		clarity: sections.clarity || 'Clean finish expected',
		balance: sections.balance || 'Balanced cup profile',
		confidence: sections.acidity && sections.sweetness ? 'high' : 'medium'
	};
}

/**
 * Get fallback taste prediction when API fails
 */
export function getFallbackTastePrediction(
	inputs: BrewInputs,
	recipe: BrewRecipe
): TastePrediction {
	// Basic heuristics based on origin and roast
	const originProfiles: Record<string, string> = {
		ethiopia: 'floral, tea-like, bergamot notes',
		kenya: 'winey, blackcurrant, bright tomato acidity',
		colombia: 'nutty, caramel, milk chocolate sweetness',
		brazil: 'nutty, chocolatey, low acidity',
		'costa rica': 'honey, citrus, balanced',
		guatemala: 'cocoa, apple, caramel',
		sumatra: 'earthy, herbal, full body'
	};

	const roastCharacteristics: Record<string, string> = {
		light: 'bright acidity, delicate body, pronounced origin character',
		'light-medium': 'vibrant acidity, light-medium body, clear origin notes',
		medium: 'balanced acidity, medium body, developed sweetness',
		'medium-dark': 'subtle acidity, medium-full body, caramelized sweetness',
		dark: 'low acidity, full body, roast-forward notes with chocolate undertones'
	};

	const originKey = inputs.beanOrigin.toLowerCase();
	const matchedOrigin = Object.keys(originProfiles).find((key) =>
		originKey.includes(key)
	);

	const originNotes = matchedOrigin
		? originProfiles[matchedOrigin]
		: 'balanced flavor profile';
	const roastNotes = roastCharacteristics[inputs.roastProfile];

	return {
		acidity: `Expected acidity for ${inputs.roastProfile} roast: ${roastNotes.split(',')[0]}.`,
		sweetness: `Typical ${inputs.beanOrigin} sweetness: ${originNotes}.`,
		body: `Body at 1:${recipe.ratio} ratio: ${roastNotes.split(',')[1] || 'medium body'}.`,
		clarity: 'Clean finish expected with proper 4:6 extraction method.',
		balance: `Balanced cup with ${inputs.roastProfile} roast characteristics and ${inputs.beanOrigin} origin notes.`,
		confidence: 'low'
	};
}

/**
 * Main orchestrator: Get taste prediction with fallback
 */
export async function getTastePrediction(
	recipe: BrewRecipe,
	inputs: BrewInputs
): Promise<TastePrediction> {
	try {
		const prompt = buildTastePredictionPrompt(recipe, inputs);
		const aiResponse = await callOpenRouter(prompt, SYSTEM_PROMPT);
		return parseTastePrediction(aiResponse);
	} catch (error) {
		// Use fallback if API fails
		console.error('Taste prediction API failed, using fallback:', error);
		return getFallbackTastePrediction(inputs, recipe);
	}
}
