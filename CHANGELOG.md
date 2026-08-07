# Changelog

All notable changes to this project are documented here. This project follows
[Semantic Versioning](https://semver.org/).

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
