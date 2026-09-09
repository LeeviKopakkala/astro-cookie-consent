# Changelog

All notable changes to this project are documented here. This project follows
[Semantic Versioning](https://semver.org/).

## 0.1.5

- Bumped `astro` (example app dependency) from 7.2.4 to 7.3.2, fixing a critical remote code
  execution vulnerability in AVIF image optimization ([GHSA-26w7-cxv4-gfx2](https://github.com/advisories/GHSA-26w7-cxv4-gfx2)).
- Bumped `sharp` (transitive dependency) from 0.35.3 to 0.35.4, fixing high-severity `libheif`
  vulnerabilities.
- Bumped `js-yaml` (transitive dependency) from 4.3.1 to 4.3.2, fixing a high-severity denial of
  service issue.
- Bumped `vitest`/`@vitest/mocker` (dev dependencies) to fix a moderate-severity path traversal
  issue. No changes to package code or the public API.

## 0.1.4

- Bumped `svgo` (transitive dev dependency) from 4.0.2 to 4.1.0, which includes security
  hardening for `removeScripts`. No changes to package code or the public API.

## 0.1.3

- Bumped `fast-uri` (transitive dev dependency) from 3.1.5 to 3.1.7 to resolve high-severity
  security advisories. No changes to package code or the public API.

## 0.1.1

- Fixed `<ConsentBanner />` buttons not stretching to equal height in Safari (desktop and iOS)
  when one label wraps to two lines and its siblings don't.
- Fixed the floating (non-`embedded`) banner collapsing to zero width and losing its margins on
  narrow viewports.
- The button row now stacks into a single column instead of squeezing 2-3 buttons into an
  ambiguous partial-row layout once the banner is too narrow to fit them side by side.
- The banner's own text no longer inherits `text-align: center` (or similar) from a host page's
  ancestor elements.

## 0.1.0

Initial release.

- `<ConsentBanner />` — accept/decline banner with equal-prominence buttons, no pre-ticked boxes,
  optional per-category consent (`categories` prop), light/dark mode, `embedded` mode for inline
  rendering, theming via CSS custom properties.
- `getConsent()`, `getConsentRecord()`, `setConsent()`, `onConsentChange()`, `whenAccepted()` —
  read, write, and react to the visitor's stored choice.
- `gateScript()` — inject a third-party script only after consent, scoped to a category.
- Choices expire after a configurable `expiryDays` (default 365).
