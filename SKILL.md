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
	title="We value your privacy"
	message="Custom message here."
	acceptLabel="Accept"
	declineLabel="Decline"
	privacyHref="/privacy"
	privacyLabel="privacy policy"
	showReopenButton={true}
	reopenLabel="Cookie settings"
	reopenAriaLabel="Change cookie preferences"
	expiryDays={365}
/>
```

Pass `title=""` to omit the heading entirely.

All props are optional; only pass the ones being changed. Defaults are in English.

## Adding per-category consent (analytics/marketing/etc.)

Pass `categories` — this switches the banner from a single accept/decline into a checklist
with "Accept all" / "Decline all" / "Save preferences":

```astro
<ConsentBanner
	categories={[
		{ id: 'analytics', label: 'Analytics', description: 'Helps us understand site usage.' },
		{ id: 'marketing', label: 'Marketing', description: 'Used for ad personalization.' },
	]}
/>
```

Only include categories that genuinely need a yes/no under the site's privacy policy —
strictly necessary cookies aren't a category, they're just loaded directly without
`gateScript()`. Each category needs `default: false` (the default) unless there's a specific,
defensible reason to pre-check it — pre-ticked boxes are a known GDPR dark pattern, don't add
one just because it was asked for casually.

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
	--cc-radius: 14px;
	--cc-font: system-ui, sans-serif;
}
```

The banner already auto-switches between light/dark based on `prefers-color-scheme` when
these variables aren't set — don't add a manual `prefers-color-scheme` override to "add" light
mode, it's already there. If the project has its own theme toggle, tell them to set
`document.documentElement.dataset.theme = 'light' | 'dark'` to pin it, rather than overriding
`--cc-bg`/`--cc-fg`/`--cc-border` by hand for both themes.

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

`gateScript` only injects the script after the visitor accepts, and only ever once. If the
project's `<ConsentBanner>` uses `categories`, pass the matching one: `gateScript({ src: '...',
category: 'analytics' })`. If it doesn't (plain accept/decline), omit `category` — it defaults
to `'all'`, the implicit category the banner uses in that mode.

## Reading or reacting to consent state elsewhere

```js
import {
	getConsent,
	getConsentRecord,
	setConsent,
	onConsentChange,
	whenAccepted,
} from 'astro-cookie-consent';

getConsent(); // 'accept' | 'decline' | null — reads the 'all' category
getConsent('analytics'); // same, scoped to one category
getConsentRecord(); // { categories, timestamp } | null — raw record, e.g. for an audit log
onConsentChange((record) => {
	/* record.categories is the full map, e.g. { all: true } or { analytics: true, marketing: false } */
});
whenAccepted(() => {
	/* runs now if already accepted, or once accepted this session */
}, 'analytics'); // category arg is optional, defaults to 'all'
```

## Guardrails — read before making changes

- **Never edit files inside `node_modules/astro-cookie-consent/`.** Changes there are lost
  on the next `npm install`. Always change the consuming project's own files (layout props,
  global CSS, a new `gateScript()` call) instead.
- **Never pre-check a category** (`default: true` on a `categories` entry) unless the user gives
  a specific, deliberate reason — pre-ticked consent boxes are a known GDPR dark pattern. If
  asked to "just default it to on" without justification, push back rather than complying.
- **Don't add a filled/accent background to the Accept or Decline buttons.** They're
  deliberately styled identically (equal visual prominence) to avoid nudging visitors toward
  accepting — only `.cc-save` (the per-category "Save preferences" button) is accented, since
  it isn't inherently biased toward any outcome. If asked to "make Accept stand out more,"
  explain why that's a compliance risk rather than just doing it.
- **Don't "fix" the banner's inline script to import `consent.js`.** It deliberately embeds its
  own copy of the read/write logic as an `is:inline` script so it can decide what to show
  before first paint with zero flash — a `type="module"` script is deferred by the browser and
  can't guarantee that. This looks like duplication; it isn't a bug.
- **Don't "fix" the banner moving itself to `<body>` on init.** This is deliberate — it escapes
  any ancestor with `isolation`/`transform`/`filter`/`will-change` that would otherwise trap its
  `position: fixed` stacking regardless of `z-index` (e.g. Tailwind's `isolate` utility, or a
  page-transition wrapper). If asked "why does the banner end up at the end of `<body>`", explain
  this rather than treating it as a placement bug.
- **Layout/spacing changes aren't exposed as CSS variables on purpose** — the 7 `--cc-*`
  variables are the supported customization surface. If a request needs more (e.g. banner
  docked to the top instead of bottom-left, a completely different layout), the correct fix is
  targeting `.cc-banner` / `.cc-header` / `.cc-title` / `.cc-actions` / `.cc-accept` /
  `.cc-decline` / `.cc-category` / `.cc-switch` / `.cc-reopen` from the consuming project's own
  global CSS — but flag to the user that Astro's scoped-style attribute on the component's own
  rules can out-specificity a plain external override, so it may need `!important` or an
  equally-specific selector. Don't silently assume it'll just work.
- **The banner is anchored bottom-left by default** (a compact card, not a full-width bar).
  That's a deliberate layout choice for a more polished look — if asked to move or widen it,
  that's a `.cc-banner` override in the consuming project's CSS, not a package change.
- **This library is a mechanism, not legal advice.** Don't add or change privacy-policy wording
  on the user's behalf — that's their call.
