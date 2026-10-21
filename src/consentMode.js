/**
 * Google Consent Mode v2 bridge. `ConsentMode.astro` embeds this function's
 * source (via `.toString()`) in an `is:inline` script in `<head>`, so it runs
 * synchronously before any Google tag — which is what Consent Mode requires of
 * the `default` command. That's also why it must stay fully self-contained:
 * no imports, no references to anything else in this module. It duplicates
 * the storage key, event name and record validation from `consent.js` for the
 * same reason `ConsentBanner.astro` does.
 *
 * @param {object} config
 * @param {Record<string, string[]>} config.mapping - Category id to the
 *   Consent Mode types it grants, e.g. `{ analytics: ['analytics_storage'] }`.
 * @param {number} config.expiryDays
 * @param {number} config.waitForUpdate
 * @param {boolean} [config.adsDataRedaction]
 * @param {boolean} [config.urlPassthrough]
 * @param {string[]} [config.region]
 */
export function initConsentMode(config) {
	const STORAGE_KEY = 'cookie-consent';
	const EVENT_NAME = 'cookie-consent-changed';

	window.dataLayer = window.dataLayer || [];
	// gtag.js only processes `arguments` objects pushed onto dataLayer, not
	// plain arrays — so this must be a real `function`, not an arrow.
	const gtag =
		window.gtag ||
		function gtag() {
			window.dataLayer.push(arguments);
		};
	window.gtag = gtag;

	const types = [];
	for (const id in config.mapping) {
		for (const type of config.mapping[id]) {
			if (!types.includes(type)) types.push(type);
		}
	}

	const toState = (categories) => {
		const state = {};
		for (const type of types) state[type] = 'denied';
		for (const id in config.mapping) {
			if (categories[id] !== true) continue;
			for (const type of config.mapping[id]) state[type] = 'granted';
		}
		return state;
	};

	const readRecord = () => {
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
			if (Date.now() - record.timestamp > config.expiryDays * 24 * 60 * 60 * 1000) return null;
			return record;
		} catch {
			return null;
		}
	};

	const defaults = toState({});
	defaults.wait_for_update = config.waitForUpdate;
	if (config.region && config.region.length > 0) defaults.region = config.region;
	gtag('consent', 'default', defaults);
	if (config.adsDataRedaction) gtag('set', 'ads_data_redaction', true);
	if (config.urlPassthrough) gtag('set', 'url_passthrough', true);

	// `ConsentBanner` re-dispatches the stored record on every page load, right
	// after this has already sent it — skip updates identical to the last one.
	let lastUpdate = null;
	const update = (categories) => {
		const state = toState(categories);
		const key = JSON.stringify(state);
		if (key === lastUpdate) return;
		lastUpdate = key;
		gtag('consent', 'update', state);
	};

	const stored = readRecord();
	if (stored) update(stored.categories);

	window.addEventListener(EVENT_NAME, (event) => {
		const record = event.detail;
		if (record && record.categories) update(record.categories);
	});
}
