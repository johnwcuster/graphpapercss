# On-page inspector for the 0.4 API

The canonical implementation and usage guide are now in
[tools/inspector](../../tools/inspector/README.md).

Existing imports from `docs/inspector/index.js` continue to work. That module
re-exports a generated local mirror, so a standalone `/docs` deployment does
not need access to the repository's `tools/` directory.

For direct integration, use `tools/inspector/index.js` or the package subpath
`graphpapercss/legacy/0.4/inspector`. These entries are included with 0.5.0 for the legacy 0.4 API; they are absent from the 0.4.1 tag.
