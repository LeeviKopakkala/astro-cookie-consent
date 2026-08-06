# astro-cookie-consent

A tiny, dependency-free cookie consent banner and script-gating helper for Astro sites.

- No dependencies, no build step — ships as plain `.astro`/`.js` source, compiled by your own project's Astro pipeline.
- Blocks third-party scripts until the visitor actually accepts (not just an informational banner).
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

## `<ConsentBanner />` props

All optional — defaults are in English, override everything to localize.

| Prop               | Default                                                                        | Description                                           |
| ------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `message`          | `"We use cookies to enhance your experience. You can accept or decline them."` | Banner body text.                                     |
| `acceptLabel`      | `"Accept"`                                                                     | Accept button label.                                  |
| `declineLabel`     | `"Decline"`                                                                    | Decline button label.                                 |
| `privacyHref`      | _(none)_                                                                       | If set, renders a link to your privacy policy.        |
| `privacyLabel`     | `"privacy policy"`                                                             | Link text for `privacyHref`.                          |
| `showReopenButton` | `true`                                                                         | Show a small persistent button to revisit the choice. |
| `reopenLabel`      | `"Cookie settings"`                                                            | Reopen button label.                                  |
| `reopenAriaLabel`  | `"Change cookie preferences"`                                                  | Reopen button `aria-label`.                           |

## Theming

Override these CSS custom properties anywhere above the banner in the DOM (e.g. on `:root`):

```css
:root {
	--cc-bg: #1f1f1f;
	--cc-fg: #f5f5f5;
	--cc-accent: #4f46e5;
	--cc-accent-fg: #fff;
	--cc-border: rgba(255, 255, 255, 0.15);
	--cc-radius: 4px;
	--cc-font: system-ui, sans-serif;
}
```

## JS API

```js
import { getConsent, setConsent, onConsentChange, whenAccepted, gateScript } from 'astro-cookie-consent';

getConsent(); // 'accept' | 'decline' | null
setConsent('accept'); // sets it programmatically and broadcasts the change
onConsentChange((value) => { ... }); // fires on every future change
whenAccepted(() => { ... }); // fires immediately if already accepted, or once accepted
gateScript({ src: '...', onLoad: () => { ... } }); // load a script only after consent
```

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

- `ConsentBanner.astro` embeds its own copy of the consent read/write logic in an `is:inline` script rather than importing `consent.js`, so it can decide what to show before first paint with zero flash — a processed `<script type="module">` is deferred by the browser and can't guarantee that. Both halves agree on the same `localStorage` key and event name, so they interoperate correctly even though they don't share a JS module at runtime.
- This is a single accept/decline model, not a multi-category (necessary/analytics/marketing) consent manager. If you need per-category consent, this package isn't (yet) the right fit.
- This library provides the mechanism, not legal advice — you're responsible for what your privacy policy says and for gating the right things behind it.

## License

MIT
