# Changelog

All notable changes to this project are documented here. This project follows
[Semantic Versioning](https://semver.org/).

## 0.1.0

Initial release.

- `<ConsentBanner />` — accept/decline banner with equal-prominence buttons, no pre-ticked boxes,
  optional per-category consent (`categories` prop), light/dark mode, `embedded` mode for inline
  rendering, theming via CSS custom properties.
- `getConsent()`, `getConsentRecord()`, `setConsent()`, `onConsentChange()`, `whenAccepted()` —
  read, write, and react to the visitor's stored choice.
- `gateScript()` — inject a third-party script only after consent, scoped to a category.
- Choices expire after a configurable `expiryDays` (default 365).
