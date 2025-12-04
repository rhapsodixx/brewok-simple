import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock PostHog
vi.mock('posthog-js', () => ({
	default: {
		init: vi.fn(),
		capture: vi.fn(),
		identify: vi.fn(),
		reset: vi.fn(),
		isFeatureEnabled: vi.fn(),
		getFeatureFlag: vi.fn(),
		get_session_replay_url: vi.fn(() => 'https://replay-url')
	}
}));

// Mock environment variables
vi.stubEnv('VITE_PUBLIC_POSTHOG_KEY', 'test-posthog-key');
vi.stubEnv('OPENROUTER_API_KEY', 'test-openrouter-key');
