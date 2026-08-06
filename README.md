# astro-cookie-consent

[![npm version](https://img.shields.io/npm/v/astro-cookie-consent.svg)](https://www.npmjs.com/package/astro-cookie-consent)
[![npm downloads](https://img.shields.io/npm/dm/astro-cookie-consent.svg)](https://www.npmjs.com/package/astro-cookie-consent)
[![license](https://img.shields.io/npm/l/astro-cookie-consent.svg)](./LICENSE)

A tiny, dependency-free cookie consent banner and script-gating helper for Astro sites.

**[Docs & live demo → astro-cookie-consent.dev](https://astro-cookie-consent.dev)**

- No dependencies, no build step — ships as plain `.astro`/`.js` source, compiled by your own project's Astro pipeline.
- Blocks third-party scripts until the visitor actually accepts (not just an informational banner).
- Optional per-category consent (e.g. analytics/marketing), or a single accept/decline if you don't need that.
- Accept and decline are given equal visual weight — no dark-pattern nudging toward accept.
- Choices expire after `expiryDays` (default 365) and the banner is shown again — no permanent silent consent.
- The stored record includes a timestamp, so you have something to point to if you ever need to demonstrate consent was given.
- Choice persists in `localStorage` and is broadcast via a `CustomEvent`, so any part of your site can react to it.
- Themeable via CSS custom properties, all copy is prop-driven (no hardcoded language).

## Install

```sh
npm install astro-cookie-consent
```

## Quick start

Render the banner once, globally, from your layout:

```astro
---
// src/layouts/Layout.astro
import ConsentBanner from 'astro-cookie-consent/ConsentBanner.astro';
---

<html>
	<body>
		<slot />
		<ConsentBanner privacyHref="/privacy" />
	</body>
</html>
```

Gate any third-party script behind that consent:

```astro
<script>
	import { gateScript } from 'astro-cookie-consent';

	gateScript({ src: 'https://example-widget.com/embed.js' });
</script>
```

`gateScript` never injects the script until the visitor accepts, and never injects it twice.

See `examples/basic` for a full working demo (`npm install && npm run dev` from the repo root).

## Per-category consent

Pass `categories` to switch the banner from a single accept/decline into a checklist, with
"Accept all" / "Decline all" / "Save preferences" actions:

```astro
<ConsentBanner
	categories={[
		{ id: 'analytics', label: 'Analytics', description: 'Helps us understand site usage.' },
		{ id: 'marketing', label: 'Marketing', description: 'Used for ad personalization.' },
	]}
/>
```

Gate a script behind a specific category (defaults to `'all'`, which is what's used when you
don't pass `categories`):

```js
gateScript({ src: 'https://example.com/analytics.js', category: 'analytics' });
```

`getConsent()`, `whenAccepted()`, and `setConsent()` all take the same `category` argument —
see the JS API below.

## `<ConsentBanner />` props

All optional — defaults are in English, override everything to localize.

| Prop               | Default                                                                        | Description                                                               |
| ------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `title`            | `"We value your privacy"`                                                      | Banner heading. Pass `""` to omit it.                                     |
| `message`          | `"We use cookies to enhance your experience. You can accept or decline them."` | Banner body text.                                                         |
| `acceptLabel`      | `"Accept"` (or `"Accept all"` with `categories`)                               | Accept button label.                                                      |
| `declineLabel`     | `"Decline"` (or `"Decline all"` with `categories`)                             | Decline button label.                                                     |
| `saveLabel`        | `"Save preferences"`                                                           | "Save" button label, only shown when `categories` is set.                 |
| `privacyHref`      | _(none)_                                                                       | If set, renders a link to your privacy policy.                            |
| `privacyLabel`     | `"privacy policy"`                                                             | Link text for `privacyHref`.                                              |
| `showReopenButton` | `true`                                                                         | Show a small persistent button to revisit the choice.                     |
| `reopenLabel`      | `"Cookie settings"`                                                            | Reopen button label.                                                      |
| `reopenAriaLabel`  | `"Change cookie preferences"`                                                  | Reopen button `aria-label`.                                               |
| `categories`       | _(none)_                                                                       | `{ id, label, description?, default? }[]` — enables per-category consent. |
| `expiryDays`       | `365`                                                                          | Days a stored choice stays valid before the banner reappears.             |
| `embedded`         | `false`                                                                        | Render inline wherever you place it instead of floating bottom-left.      |

### Embedding it inline

By default `<ConsentBanner />` floats as a fixed bottom-left card and moves itself to `<body>`
on init (see [Design notes](#design-notes)). Pass `embedded` to render it inline instead —
useful for a privacy/preferences page, or anywhere else you want it to sit in the page's normal
layout rather than float:

```astro
<section class="privacy-settings">
	<h1>Privacy settings</h1>
	<ConsentBanner embedded categories={[{ id: 'analytics', label: 'Analytics' }]} />
</section>
```

An embedded banner stays exactly where you put it in the markup — no `<body>` reparenting, no
`position: fixed`, no `z-index`.

## Theming

Override these CSS custom properties anywhere above the banner in the DOM (e.g. on `:root`):

```css
:root {
	--cc-bg: #1f1f1f;
	--cc-fg: #f5f5f5;
	--cc-accent: #4f46e5;
	--cc-accent-fg: #fff;
	--cc-border: rgba(255, 255, 255, 0.15);
	--cc-radius: 14px;
	--cc-font: system-ui, sans-serif;
}
```

### Light/dark mode

If you don't set `--cc-bg`/`--cc-fg`/`--cc-border` yourself, the banner already follows the
visitor's OS color scheme automatically (dark by default, switching to light under
`prefers-color-scheme: light`). To force one theme regardless of OS preference — e.g. your
site has its own light/dark toggle — set `data-theme="light"` or `data-theme="dark"` on
`<html>`:

```js
document.documentElement.dataset.theme = 'light'; // or 'dark'
```

Setting any of the 7 variables above yourself always takes precedence over both of these,
in any theme.

## JS API

```js
import {
	getConsent,
	getConsentRecord,
	setConsent,
	onConsentChange,
	whenAccepted,
	gateScript,
} from 'astro-cookie-consent';

getConsent(); // 'accept' | 'decline' | null — reads the 'all' category
getConsent('analytics'); // 'accept' | 'decline' | null for a specific category
getConsentRecord(); // { categories: {...}, timestamp } | null — the raw stored record, or null if expired/unset
setConsent('accept'); // sets it programmatically and broadcasts the change
setConsent({ analytics: true, marketing: false }); // per-category form
onConsentChange((record) => { ... }); // fires on every future change with the full record
whenAccepted(() => { ... }); // fires immediately if already accepted, or once accepted
whenAccepted(() => { ... }, 'analytics'); // same, scoped to one category
gateScript({ src: '...', onLoad: () => { ... } }); // load a script only after consent
gateScript({ src: '...', category: 'analytics' }); // same, scoped to one category
```

A stored choice expires after `expiryDays` (default 365, configurable via the `expiryDays`
prop/option) — after that, `getConsent()`/`getConsentRecord()` return `null` again and the
banner reappears on next load.

## Using with AI coding agents

The package ships a `SKILL.md` (Claude Code skill format) documenting its own API, common
customization recipes, and guardrails (e.g. "never edit files inside `node_modules`") so an
agent can safely make changes on your behalf — things like "change the cookie banner text to
X" or "gate this new analytics script behind consent" — without guessing at prop names or
breaking the zero-flash design.

To use it with Claude Code, copy it into your project once after installing the package:

```sh
mkdir -p .claude/skills/astro-cookie-consent
cp node_modules/astro-cookie-consent/SKILL.md .claude/skills/astro-cookie-consent/SKILL.md
```

It's a plain file, so it also works as context for any other agent that can read a markdown
file from the repo — point it at `node_modules/astro-cookie-consent/SKILL.md` directly if your
tool doesn't use the `.claude/skills` convention.

## Design notes

- `ConsentBanner.astro` embeds its own copy of the consent read/write logic in an `is:inline` script rather than importing `consent.js`, so it can decide what to show before first paint with zero flash — a processed `<script type="module">` is deferred by the browser and can't guarantee that. Both halves agree on the same `localStorage` record shape and event name, so they interoperate correctly even though they don't share a JS module at runtime.
- Wherever you render `<ConsentBanner />` in your markup, it moves itself to be a direct child of `<body>` on init. This is deliberate: `position: fixed` is trapped by any ancestor with `isolation`, `transform`, `filter`, or `will-change` (common in real layouts — e.g. Tailwind's `isolate` utility, or a framework's page-transition wrapper), which silently breaks its stacking no matter how high `z-index` is set. A consent banner has to always be reachable, so it always escapes to `<body>` rather than trusting z-index alone.
- "Necessary" cookies (ones that don't legally require consent) aren't a category here — just load those directly, without `gateScript()`. `categories` is only for things that genuinely need a yes/no.
- This library provides the mechanism, not legal advice — you're responsible for what your privacy policy actually says, which categories/purposes you declare, and for gating the right things behind the right category.

## License

MIT
