import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setConsent } from './consent.js';
import { initConsentMode } from './consentMode.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const V2_TYPES = ['ad_storage', 'ad_user_data', 'ad_personalization', 'analytics_storage'];
const MAPPING = {
	analytics: ['analytics_storage'],
	marketing: ['ad_storage', 'ad_user_data', 'ad_personalization'],
};

const config = (overrides = {}) => ({
	mapping: { all: V2_TYPES },
	expiryDays: 365,
	waitForUpdate: 500,
	...overrides,
});

/** dataLayer entries as plain arrays, for easy comparison. */
const calls = () => window.dataLayer.map((entry) => Array.from(entry));
const consentCalls = (kind) =>
	calls().filter(([command, action]) => command === 'consent' && action === kind);

const store = (categories, timestamp = Date.now()) =>
	localStorage.setItem('cookie-consent', JSON.stringify({ categories, timestamp }));

// initConsentMode adds a window listener on every call; remove them between
// tests so earlier instances don't keep pushing onto later tests' dataLayer.
let listeners = [];

beforeEach(() => {
	localStorage.clear();
	vi.useRealTimers();
	delete window.dataLayer;
	delete window.gtag;
	const original = window.addEventListener.bind(window);
	vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
		listeners.push([type, listener]);
		original(type, listener, options);
	});
});

afterEach(() => {
	vi.restoreAllMocks();
	for (const [type, listener] of listeners) window.removeEventListener(type, listener);
	listeners = [];
});

describe('initConsentMode', () => {
	it('sends an all-denied default and no update when nothing is stored', () => {
		initConsentMode(config());

		expect(consentCalls('default')).toEqual([
			[
				'consent',
				'default',
				{
					ad_storage: 'denied',
					ad_user_data: 'denied',
					ad_personalization: 'denied',
					analytics_storage: 'denied',
					wait_for_update: 500,
				},
			],
		]);
		expect(consentCalls('update')).toEqual([]);
	});

	it('pushes real Arguments objects, which gtag.js requires', () => {
		initConsentMode(config());
		expect(Object.prototype.toString.call(window.dataLayer[0])).toBe('[object Arguments]');
		expect(typeof window.gtag).toBe('function');
	});

	it('reuses an existing window.gtag', () => {
		const existing = vi.fn();
		window.gtag = existing;
		initConsentMode(config());
		expect(existing).toHaveBeenCalledWith('consent', 'default', expect.any(Object));
	});

	it('sends an update right after the default for a stored choice', () => {
		store({ analytics: true, marketing: false });
		initConsentMode(config({ mapping: MAPPING }));

		const [first, second] = calls();
		expect(first[1]).toBe('default');
		expect(second).toEqual([
			'consent',
			'update',
			{
				analytics_storage: 'granted',
				ad_storage: 'denied',
				ad_user_data: 'denied',
				ad_personalization: 'denied',
			},
		]);
	});

	it('grants a type if any category mapped to it is accepted', () => {
		store({ a: false, b: true });
		initConsentMode(config({ mapping: { a: ['ad_storage'], b: ['ad_storage'] } }));
		expect(consentCalls('update')[0][2]).toEqual({ ad_storage: 'granted' });
	});

	it('treats an expired or malformed record as no choice', () => {
		vi.useFakeTimers();
		vi.setSystemTime(0);
		store({ all: true });
		vi.setSystemTime(30 * DAY_MS + 1);
		initConsentMode(config({ expiryDays: 30 }));
		expect(consentCalls('update')).toEqual([]);

		delete window.dataLayer;
		localStorage.setItem('cookie-consent', 'not json');
		initConsentMode(config());
		expect(consentCalls('update')).toEqual([]);
	});

	it('sends an update when the visitor makes a choice', () => {
		initConsentMode(config({ mapping: MAPPING }));
		setConsent({ analytics: false, marketing: true });

		expect(consentCalls('update')).toEqual([
			[
				'consent',
				'update',
				{
					analytics_storage: 'denied',
					ad_storage: 'granted',
					ad_user_data: 'granted',
					ad_personalization: 'granted',
				},
			],
		]);
	});

	it('skips an update identical to the previous one', () => {
		store({ all: true });
		initConsentMode(config());
		// ConsentBanner re-dispatches the stored record on load.
		setConsent('accept');
		expect(consentCalls('update')).toHaveLength(1);

		setConsent('decline');
		expect(consentCalls('update')).toHaveLength(2);
	});

	it('passes through region, ads_data_redaction and url_passthrough', () => {
		initConsentMode(
			config({
				waitForUpdate: 0,
				region: ['FI', 'SE'],
				adsDataRedaction: true,
				urlPassthrough: true,
			}),
		);

		expect(consentCalls('default')[0][2]).toMatchObject({
			wait_for_update: 0,
			region: ['FI', 'SE'],
		});
		expect(calls()).toContainEqual(['set', 'ads_data_redaction', true]);
		expect(calls()).toContainEqual(['set', 'url_passthrough', true]);
	});

	it('runs standalone from its source, as ConsentMode.astro embeds it', () => {
		store({ all: true });
		new Function(`(${initConsentMode.toString()})(${JSON.stringify(config())});`)();
		expect(consentCalls('default')).toHaveLength(1);
		expect(consentCalls('update')[0][2]).toEqual({
			ad_storage: 'granted',
			ad_user_data: 'granted',
			ad_personalization: 'granted',
			analytics_storage: 'granted',
		});
	});
});
