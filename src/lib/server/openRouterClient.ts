/**
 * OpenRouter API client for AI taste predictions
 * Uses GPT-4o-mini model via OpenRouter
 */

import posthog from './posthog';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-4o-mini';
const MAX_RETRIES = 3;
const TIMEOUT_MS = 10000;

/**
 * Call OpenRouter API with retry logic and timeout
 */
export async function callOpenRouter(
	prompt: string,
	systemPrompt: string
): Promise<string> {
	const apiKey = process.env.OPENROUTER_API_KEY;

	if (!apiKey) {
		const error = new Error('OPENROUTER_API_KEY not configured');
		posthog.capture({
			distinctId: 'system',
			event: '$exception',
			properties: {
				$exception_type: 'ConfigurationError',
				$exception_message: error.message,
				operation: 'callOpenRouter'
			}
		});
		throw error;
	}

	let lastError: Error;

	for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

			const response = await fetch(OPENROUTER_API_URL, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
					'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173'
				},
				body: JSON.stringify({
					model: MODEL,
					messages: [
						{ role: 'system', content: systemPrompt },
						{ role: 'user', content: prompt }
					],
					temperature: 0.7,
					max_tokens: 800
				}),
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					`OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText}`
				);
			}

			const data = await response.json();
			const content = data.choices?.[0]?.message?.content;

			if (!content) {
				throw new Error('Empty response from OpenRouter API');
			}

			// Track successful call
			posthog.capture({
				distinctId: 'system',
				event: 'openrouter_api_success',
				properties: {
					attempt,
					model: MODEL
				}
			});

			return content;
		} catch (error: any) {
			lastError = error;

			// Track failure
			posthog.capture({
				distinctId: 'system',
				event: 'openrouter_api_failure',
				properties: {
					attempt,
					error: error.message,
					willRetry: attempt < MAX_RETRIES
				}
			});

			// Don't retry on configuration errors
			if (error.message.includes('not configured')) {
				throw error;
			}

			// Wait before retry (exponential backoff)
			if (attempt < MAX_RETRIES) {
				await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
			}
		}
	}

	// All retries failed
	throw new Error(
		`Failed to get taste prediction after ${MAX_RETRIES} attempts: ${lastError!.message}`
	);
}
