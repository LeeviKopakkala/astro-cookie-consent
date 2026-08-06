---
name: astro-cookie-consent
description: Use when customizing the astro-cookie-consent package in this project — changing the ConsentBanner's text/labels, changing its colors/theme via CSS variables, gating a new third-party script behind consent with gateScript(), or reading/reacting to consent state via consent.js. Triggers on requests like "change the cookie banner text", "change the consent banner colors", "gate this script behind cookie consent", "add a privacy link to the banner".
---

# astro-cookie-consent

This project depends on the `astro-cookie-consent` npm package (source lives in
`node_modules/astro-cookie-consent/src/` if you need to look something up, but you should
almost never need to edit those files directly — see "Guardrails" below).

It provides: a `<ConsentBanner />` Astro component (the visible banner + a "reopen" pill),
a small consent-state module (`consent.js`), and a helper for gating third-party scripts
behind consent (`gateScript.js`). Full reference: `node_modules/astro-cookie-consent/README.md`.

## Changing the banner's text

Every string is a prop on `<ConsentBanner />` — find where it's rendered (usually a layout
file) and pass props, don't edit the package:

```astro
<ConsentBanner
	message="Custom message here."
	acceptLabel="Accept"
	declineLabel="Decline"
	privacyHref="/privacy"
	privacyLabel="privacy policy"
	showReopenButton={true}
	reopenLabel="Cookie settings"
	reopenAriaLabel="Change cookie preferences"
/>
```

All props are optional; only pass the ones being changed. Defaults are in English.

## Changing the banner's colors/theme

Set these CSS custom properties in the project's own global stylesheet (e.g. on `:root`) —
do not add a `<style>` override targeting `.cc-banner` etc. unless the requested change is
genuinely impossible via variables (see Guardrails):

```css
:root {
	--cc-bg: #1f1f1f; /* banner background */
	--cc-fg: #f5f5f5; /* banner text color */
	--cc-accent: #4f46e5; /* accept button background */
	--cc-accent-fg: #fff; /* accept button text color */
	--cc-border: rgba(255, 255, 255, 0.15);
	--cc-radius: 4px;
	--cc-font: system-ui, sans-serif;
}
```

These 7 variables cover color/radius/font. They do NOT cover layout (position, padding,
banner max-width, button sizing) — that's a deliberate gap, see Guardrails.

## Gating a third-party script behind consent

Use this for any new tracker/embed/widget script being added — never add a bare
`<script src="...">` for a third-party tool without gating it:

```astro
<script>
	import { gateScript } from 'astro-cookie-consent';

	gateScript({ src: 'https://example.com/widget.js', onLoad: () => {} });
</script>
```

`gateScript` only injects the script after the visitor accepts, and only ever once.

## Reading or reacting to consent state elsewhere

```js
import { getConsent, setConsent, onConsentChange, whenAccepted } from 'astro-cookie-consent';

getConsent(); // 'accept' | 'decline' | null
onConsentChange((value) => {
	/* ... */
});
whenAccepted(() => {
	/* runs now if already accepted, or once accepted this session */
});
```

## Guardrails — read before making changes

- **Never edit files inside `node_modules/astro-cookie-consent/`.** Changes there are lost
  on the next `npm install`. Always change the consuming project's own files (layout props,
  global CSS, a new `gateScript()` call) instead.
- **This is a single accept/decline model**, not multi-category (necessary/analytics/marketing)
  consent. If asked to add per-category toggles, that's a real feature request beyond this
  package's current scope — say so rather than half-implementing it with props.
- **Don't "fix" the banner's inline script to import `consent.js`.** It deliberately embeds its
  own copy of the read/write logic as an `is:inline` script so it can decide what to show
  before first paint with zero flash — a `type="module"` script is deferred by the browser and
  can't guarantee that. This looks like duplication; it isn't a bug.
- **Layout/spacing changes aren't exposed as CSS variables on purpose** — the 7 `--cc-*`
  variables are the supported customization surface. If a request needs more (e.g. banner
  docked to the top instead of bottom, a completely different layout), the correct fix is
  targeting `.cc-banner` / `.cc-actions` / `.cc-accept` / `.cc-decline` / `.cc-reopen` from
  the consuming project's own global CSS — but flag to the user that Astro's scoped-style
  attribute on the component's own rules can out-specificity a plain external override, so it
  may need `!important` or an equally-specific selector. Don't silently assume it'll just work.
- **This library is a mechanism, not legal advice.** Don't add or change privacy-policy wording
  on the user's behalf — that's their call.
