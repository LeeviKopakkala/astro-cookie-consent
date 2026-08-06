import { whenAccepted } from './consent.js';

/**
 * Injects a third-party `<script>` tag only once the visitor has accepted
 * cookies — never before, and never if they decline. Safe to call multiple
 * times or before consent is known; it only ever injects the script once.
 *
 * @param {object} options
 * @param {string} options.src - The script URL to load once consent is given.
 * @param {boolean} [options.async] - Defaults to true.
 * @param {() => void} [options.onLoad] - Called once the script has loaded.
 */
export function gateScript({ src, async = true, onLoad } = {}) {
	if (!src) throw new Error('gateScript: `src` is required');

	let injected = false;

	whenAccepted(() => {
		if (injected) return;
		injected = true;

		const script = document.createElement('script');
		script.src = src;
		script.async = async;
		if (onLoad) script.addEventListener('load', onLoad);
		document.body.appendChild(script);
	});
}
