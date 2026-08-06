import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	getConsent,
	getConsentRecord,
	onConsentChange,
	setConsent,
	whenAccepted,
} from './consent.js';

const DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(() => {
	localStorage.clear();
	vi.useRealTimers();
});

describe('getConsent / getConsentRecord', () => {
	it('returns null when nothing is stored', () => {
		expect(getConsent()).toBeNull();
		expect(getConsentRecord()).toBeNull();
	});

	it('stores a plain accept/decline under the "all" category', () => {
		setConsent('accept');
		expect(getConsent()).toBe('accept');

		setConsent('decline');
		expect(getConsent()).toBe('decline');
	});

	it('stores a per-category map', () => {
		setConsent({ analytics: true, marketing: false });
		expect(getConsent('analytics')).toBe('accept');
		expect(getConsent('marketing')).toBe('decline');
	});

	it('returns null for a category that was never set', () => {
		setConsent({ analytics: true });
		expect(getConsent('marketing')).toBeNull();
	});

	it('replaces the whole categories map rather than merging into it', () => {
		setConsent({ analytics: true });
		setConsent({ marketing: true });

		// The second call is a full replacement — `analytics` is gone, not
		// just left untouched. Callers that want to change one category
		// while keeping others must read the existing record and spread it
		// in themselves (see the "Disabling individual widgets" guide).
		expect(getConsent('analytics')).toBeNull();
		expect(getConsent('marketing')).toBe('accept');
	});

	it('includes a timestamp in the raw record', () => {
		const before = Date.now();
		setConsent('accept');
		const record = getConsentRecord();
		expect(record.timestamp).toBeGreaterThanOrEqual(before);
		expect(record.categories).toEqual({ all: true });
	});

	it('treats malformed localStorage content as unset', () => {
		localStorage.setItem('cookie-consent', 'not json');
		expect(getConsent()).toBeNull();

		localStorage.setItem('cookie-consent', JSON.stringify({ categories: {} }));
		expect(getConsent()).toBeNull(); // missing timestamp

		localStorage.setItem('cookie-consent', JSON.stringify({ timestamp: Date.now() }));
		expect(getConsent()).toBeNull(); // missing categories
	});

	it('does not throw when localStorage.setItem fails', () => {
		const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('quota exceeded');
		});
		expect(() => setConsent('accept')).not.toThrow();
		spy.mockRestore();
	});
});

describe('expiry', () => {
	it('returns null once the record is older than expiryDays', () => {
		vi.useFakeTimers();
		vi.setSystemTime(0);
		setConsent('accept');

		vi.setSystemTime(30 * DAY_MS);
		expect(getConsent(undefined, { expiryDays: 30 })).toBe('accept');

		vi.setSystemTime(30 * DAY_MS + 1);
		expect(getConsent(undefined, { expiryDays: 30 })).toBeNull();
		expect(getConsentRecord({ expiryDays: 30 })).toBeNull();
	});

	it('defaults to 365 days when expiryDays is not given', () => {
		vi.useFakeTimers();
		vi.setSystemTime(0);
		setConsent('accept');

		vi.setSystemTime(365 * DAY_MS - 1);
		expect(getConsent()).toBe('accept');

		vi.setSystemTime(365 * DAY_MS + 1);
		expect(getConsent()).toBeNull();
	});
});

describe('onConsentChange', () => {
	it('fires with the full record on every change', () => {
		const callback = vi.fn();
		onConsentChange(callback);

		setConsent('accept');
		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenLastCalledWith({
			categories: { all: true },
			timestamp: expect.any(Number),
		});

		setConsent({ analytics: false });
		expect(callback).toHaveBeenCalledTimes(2);
		expect(callback).toHaveBeenLastCalledWith({
			categories: { analytics: false },
			timestamp: expect.any(Number),
		});
	});
});

describe('whenAccepted', () => {
	it('fires immediately if the category was already accepted', () => {
		setConsent('accept');
		const callback = vi.fn();
		whenAccepted(callback);
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('does not fire immediately if declined, and waits for a future accept', () => {
		setConsent('decline');
		const callback = vi.fn();
		whenAccepted(callback);
		expect(callback).not.toHaveBeenCalled();

		setConsent('accept');
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('never fires on decline', () => {
		const callback = vi.fn();
		whenAccepted(callback);

		setConsent('decline');
		expect(callback).not.toHaveBeenCalled();
	});

	it('is scoped to a single category', () => {
		const callback = vi.fn();
		whenAccepted(callback, 'analytics');

		setConsent({ marketing: true });
		expect(callback).not.toHaveBeenCalled();

		setConsent({ analytics: true, marketing: true });
		expect(callback).toHaveBeenCalledTimes(1);
	});
});
