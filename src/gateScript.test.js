import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setConsent } from './consent.js';
import { gateScript } from './gateScript.js';

beforeEach(() => {
	localStorage.clear();
	document.body.innerHTML = '';
});

describe('gateScript', () => {
	it('throws without a src', () => {
		expect(() => gateScript({})).toThrow(/`src` is required/);
	});

	it('does not inject a script before consent is given', () => {
		gateScript({ src: 'https://example.com/a.js' });
		expect(document.querySelector('script[src="https://example.com/a.js"]')).toBeNull();
	});

	it('injects the script once the category is accepted', () => {
		gateScript({ src: 'https://example.com/a.js' });
		setConsent('accept');

		const script = document.querySelector('script[src="https://example.com/a.js"]');
		expect(script).not.toBeNull();
		expect(script.async).toBe(true);
	});

	it('respects async: false', () => {
		gateScript({ src: 'https://example.com/a.js', async: false });
		setConsent('accept');

		const script = document.querySelector('script[src="https://example.com/a.js"]');
		expect(script.async).toBe(false);
	});

	it('only injects a category-gated script once that category is accepted', () => {
		gateScript({ src: 'https://example.com/a.js', category: 'analytics' });

		setConsent({ marketing: true, analytics: false });
		expect(document.querySelector('script')).toBeNull();

		setConsent({ marketing: true, analytics: true });
		expect(document.querySelector('script')).not.toBeNull();
	});

	it('never injects the script twice', () => {
		gateScript({ src: 'https://example.com/a.js' });
		setConsent('accept');
		setConsent('accept'); // re-broadcast, e.g. from another tab
		setConsent('accept');

		expect(document.querySelectorAll('script[src="https://example.com/a.js"]')).toHaveLength(1);
	});

	it('calls onLoad once the injected script fires its load event', async () => {
		const onLoad = vi.fn();
		gateScript({ src: 'https://example.com/a.js', onLoad });
		setConsent('accept');

		// happy-dom dispatches `load` on the script asynchronously, matching
		// real browser behavior — flush microtasks before asserting.
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(onLoad).toHaveBeenCalledTimes(1);
	});
});
