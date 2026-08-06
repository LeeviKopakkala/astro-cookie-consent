/**
 * Shared protocol constants. `ConsentBanner.astro` embeds its own copy of this
 * same logic in an `is:inline` script (so it can hide/show itself before first
 * paint with zero flash, which a processed/module script can't guarantee).
 * This module is the importable half of that protocol — anything that wants to
 * react to or read the visitor's choice should use this, not localStorage directly.
 */
const STORAGE_KEY = 'cookie-consent';
const EVENT_NAME = 'cookie-consent-changed';
const DEFAULT_EXPIRY_DAYS = 365;

/**
 * @typedef {Record<string, boolean>} ConsentCategories
 * @typedef {{ categories: ConsentCategories, timestamp: number }} ConsentRecord
 */

/**
 * @returns {ConsentRecord | null}
 */
function readRecord() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const record = JSON.parse(raw);
		if (
			!record ||
			typeof record.timestamp !== 'number' ||
			typeof record.categories !== 'object' ||
			record.categories === null
		) {
			return null;
		}
		return record;
	} catch {
		return null;
	}
}

/**
 * @param {ConsentRecord | null} record
 * @param {number} expiryDays
 */
function isExpired(record, expiryDays) {
	if (!record) return true;
	return Date.now() - record.timestamp > expiryDays * 24 * 60 * 60 * 1000;
}

/**
 * The full stored record — categories plus when they were set — for sites
 * that need to demonstrate consent was given (GDPR Art. 7(1) accountability).
 * Returns null if nothing is stored, or if it's older than `expiryDays`.
 * @param {{ expiryDays?: number }} [options]
 * @returns {ConsentRecord | null}
 */
export function getConsentRecord({ expiryDays = DEFAULT_EXPIRY_DAYS } = {}) {
	const record = readRecord();
	return isExpired(record, expiryDays) ? null : record;
}

/**
 * @param {string} [category] - Defaults to `'all'`, the implicit category used
 *   when `<ConsentBanner>` isn't given a `categories` prop.
 * @param {{ expiryDays?: number }} [options]
 * @returns {'accept' | 'decline' | null}
 */
export function getConsent(category = 'all', options) {
	const record = getConsentRecord(options);
	if (!record || !(category in record.categories)) return null;
	return record.categories[category] ? 'accept' : 'decline';
}

/**
 * @param {'accept' | 'decline' | ConsentCategories} value - Either a plain
 *   accept/decline (stored under the `'all'` category) or a map of category
 *   id to accepted/declined, for sites using per-category consent.
 * @returns {ConsentRecord}
 */
export function setConsent(value) {
	const categories = typeof value === 'string' ? { all: value === 'accept' } : value;
	const record = { categories, timestamp: Date.now() };
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
	} catch {
		/* localStorage unavailable (private mode etc.) — consent just won't persist */
	}
	window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: record }));
	return record;
}

/**
 * @param {(record: ConsentRecord) => void} callback
 */
export function onConsentChange(callback) {
	window.addEventListener(EVENT_NAME, (event) => {
		callback(/** @type {CustomEvent} */ (event).detail);
	});
}

/**
 * Calls `callback` immediately if `category` was already accepted on a
 * previous visit, otherwise waits for the visitor to accept it during this
 * visit. Never calls back on decline.
 * @param {() => void} callback
 * @param {string} [category]
 */
export function whenAccepted(callback, category = 'all') {
	if (getConsent(category) === 'accept') {
		callback();
		return;
	}
	onConsentChange((record) => {
		if (record.categories[category]) callback();
	});
}
