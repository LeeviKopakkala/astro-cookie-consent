import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'happy-dom',
		environmentOptions: {
			happyDOM: {
				// gateScript() appends real <script src> tags; happy-dom's
				// default is to log a DOMException for every one instead of
				// quietly skipping the actual network fetch (which we don't
				// want in tests anyway — script.dispatchEvent(new
				// Event('load')) in gateScript.test.js still simulates the
				// asset loading, this only silences the noise).
				settings: { handleDisabledFileLoadingAsSuccess: true },
			},
		},
	},
});
