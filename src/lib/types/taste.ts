/**
 * AI-generated taste prediction types
 */

export type TasteConfidence = 'high' | 'medium' | 'low';

/**
 * Structured taste prediction from AI
 */
export interface TastePrediction {
	acidity: string; // e.g., "Bright citrus, malic acidity"
	sweetness: string; // e.g., "Honeyed, floral notes"
	body: string; // e.g., "Silky, medium body"
	clarity: string; // e.g., "Clean, crisp finish"
	balance: string; // Overall assessment
	confidence: TasteConfidence;
}
