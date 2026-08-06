/**
 * Shared protocol constants. `ConsentBanner.astro` embeds its own copy of this
 * same logic in an `is:inline` script (so it can hide/show itself before first
 * paint with zero flash, which a processed/module script can't guarantee).
 * This module is the importable half of that protocol — anything that wants to
 * react to or read the visitor's choice should use this, not localStorage directly.
 */
const STORAGE_KEY = 'cookie-consent';
const EVENT_NAME = 'cookie-consent-changed';

/**
 * @returns {'accept' | 'decline' | null} the visitor's stored choice, or null if undecided.
 */
export function getConsent() {
	try {
		return /** @type {'accept' | 'decline' | null} */ (localStorage.getItem(STORAGE_KEY));
	} catch {
		return null;
	}
}

/**
 * @param {'accept' | 'decline'} value
 */
export function setConsent(value) {
	try {
		localStorage.setItem(STORAGE_KEY, value);
	} catch {
		/* localStorage unavailable (private mode etc.) — consent just won't persist */
	}
	window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { value } }));
}

/**
 * @param {(value: 'accept' | 'decline') => void} callback
 */
export function onConsentChange(callback) {
	window.addEventListener(EVENT_NAME, (event) => {
		callback(/** @type {CustomEvent} */ (event).detail?.value);
	});
}

/**
 * Calls `callback` immediately if consent was already accepted on a previous
 * visit, otherwise waits for the visitor to accept during this visit. Never
 * calls back on decline.
 * @param {() => void} callback
 */
export function whenAccepted(callback) {
	if (getConsent() === 'accept') {
		callback();
		return;
	}
	onConsentChange((value) => {
		if (value === 'accept') callback();
	});
}
