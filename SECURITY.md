# Security

If you find a security issue in this package, please **do not open a public GitHub issue**.

Report it privately via GitHub's
[private vulnerability reporting](https://github.com/LeeviKopakkala/astro-cookie-consent/security/advisories/new)
(the "Security" tab of this repo → "Report a vulnerability"). You'll get a response, and a fix
will be coordinated with you before anything is disclosed publicly.

## Scope

This library stores a single `localStorage` record and conditionally injects `<script>` tags —
it does not handle authentication, payments, or personal data beyond the visitor's own consent
choice. Reports about `localStorage` being readable by other scripts on the same origin are
expected browser behavior, not a vulnerability in this package.
