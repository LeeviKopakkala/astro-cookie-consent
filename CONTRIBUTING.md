# Contributing

By participating in this project, you agree to abide by the
[Code of Conduct](./CODE_OF_CONDUCT.md).

## Setup

```sh
npm install
npm run dev # runs examples/basic on localhost, using the local package source
```

The repo is an npm workspace: `examples/basic` depends on the package via a local `file:`
reference, so changes to `src/` are picked up immediately without a build or publish step.

## Before opening a PR

```sh
npm run format:check # prettier
npm test             # unit tests (src/*.test.js)
npm run check         # astro check, via examples/basic
npm run build         # builds examples/basic
```

All four run in CI on every PR; a passing local run is a good sign CI will pass too. Run
`npm run format` to auto-fix formatting.

## Scope

This is a small, dependency-free library on purpose — see the "Design notes" section of the
[README](./README.md) for why things like the `<body>` reparenting and the duplicated
consent-reading logic in `ConsentBanner.astro` exist. Changes that add a runtime dependency, or
that change the stored `localStorage` record shape in a way older stored consent can't be read
back from, need a strong justification in the PR description.

## Tests

`src/consent.js` and `src/gateScript.js` are plain, dependency-free logic and should stay fully
covered by `src/*.test.js` (Vitest + happy-dom). If you change behavior there, add or update a
test alongside it rather than only updating the docs.
