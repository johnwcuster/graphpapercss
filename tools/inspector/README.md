# On-page inspector for the 0.4 API

Optional on-page authoring tooling for Graph Paper 0.4 compositions. Use it with `css/legacy/0.4/main.css`; it does not edit the new 0.5 layouts.
Included with Graph Paper 0.5.0 as a legacy tool. The core CSS needs no JavaScript.

```js
const { mountInspector } = await import('http://127.0.0.1:4173/tools/inspector/index.js');
const inspector = mountInspector({ root: document.querySelector('main'), bandsAvailable: true });
```

Run `pnpm dev` in the library checkout. Its public tooling modules allow
cross-origin imports, so another local site can load the inspector directly.
No private content, host stylesheet or site wrapper is bundled with the tool.
For the 0.5.0 distribution, the version-pinned CDN entry is
`https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.5.0/tools/inspector/index.js`.
The older 0.4.1 tag does not contain this tool.

The page must already load the 0.4 core CSS, such as `css/legacy/0.4/main.css`. Set `bandsAvailable: true` only
when its optional bands stylesheet is also loaded. This declaration avoids
probing cross-origin stylesheets or silently injecting CSS into the page.

Choose an existing composition from the list or use “Pick composition on page”.
Click any item inside it; links inside compositions do not navigate while
picking. Escape cancels picking, and the list is the keyboard alternative.
No identifying IDs, data attributes or style changes are added to your content.
New recipe fields are discovered as the page changes. The root element itself
is included if it is a recipe field.

Change a recipe, set, flow, gutter or band,
then inspect the actual content. While open, the inspector temporarily reserves
384px beside the page, so fluid canvases reflow and their real container queries
run at the reduced width. Dock left/right moves that space with the panel.
Below an 800px window width, the panel docks below the reading area instead of
narrowing it further; bottom space lets the final content scroll above the panel.
Hide, either close action, or `destroy()` removes the reserved space.
No preview width is applied to a canvas, and no source items are added, removed
or reordered.
Changing recipes preserves compatible settings and drops incompatible set/flow
choices. Read the class output and session record to see those changes.

Ruler, macro/item edges, source order, band minimum brackets, and default
30/60rem markers are independent overlays. Markers measure from the canvas’s
left edge; they are not rules placed in the composition. The band bracket is
a requested structural width, not a text or overflow measurement.

Copy classes into your source to persist them. “Discard & close” restores the
session’s original composition classes, preserving unrelated live class changes.
“Close · keep edits” leaves edits in this page only, until reload. Neither writes
files, saves to local storage nor changes the URL. If another script edits the
same composition classes during a session, discard leaves those conflicting
fields untouched instead of overwriting them. The change record flags conflicts.

`inspector.select(field)` selects a discovered field programmatically.
`inspector.refresh()` explicitly rescans the root and its descendants.
`inspector.changes()` returns the session record.
`inspector.destroy()` discards by default and returns `{ conflicts }`.
`inspector.destroy({ discard: false })` keeps current page edits.
Calling `mountInspector()` again returns the current document’s instance.
This also holds when the compatibility URL and standalone URL are both loaded.
Alt+Shift+G hides or restores the panel. Controls and overlays live in Shadow DOM.
One temporary stylesheet in the document head reserves workspace using root
padding. Removing it reveals the site's own sizing declarations unchanged;
no wrappers, source styles or persistent identifying attributes are added.

The npm subpath in 0.5.0 is `graphpapercss/legacy/0.4/inspector`. Importing it never mounts UI automatically. There are no runtime package
dependencies. The standalone graph uses only `tools/` and versioned `src/legacy/0.4/`
metadata; it does not load the documentation workbench, preview content or CSS.
The old `docs/inspector/index.js` URL re-exports the generated documentation-local
mirror, keeping existing integrations and standalone `/docs` deployments intact.

No content editor, source-count control, forced preview width, saved project,
CMS adapter or automatic treatment selection is included. The core CSS and its
authoring API are unchanged. Shadow DOM isolates styles, not privileges: load
the tool only in a trusted authoring context. CSP must permit the chosen module
origin and the tool's shadow-root and workspace style elements.
The workspace accommodates normal fluid document layouts, not every host shell:
viewport-sized (`100vw`) or fixed-position content still follows the viewport.
Root padding with inline `!important` declarations can prevent reservation.
Such sites need host-specific integration; the tool does not rewrite their CSS.

Initial boundary: recipe fields directly inside a canvas are editable, including
fields in independent nested canvases. Fields on a partial inherited ruler are
listed read-only; this version does not pretend they have a fresh 64-bit ruler.
Rule markers on children, custom ruler placements, rotated/transformed canvases,
vertical writing modes, framework-controlled class reconciliation, closed shadow
roots and embedded frames are not managed. Host styles can constrain an item
inside its allocated region; overlays describe geometry, not design correctness.

Validation: `pnpm test` and `pnpm test:inspector` (Chromium, Firefox and WebKit).
The browser fixture uses two independent local origins to test module CORS.
`pnpm test:inspector:package` checks the packed module graph without installation
or publication. `pnpm size:inspector` reports all required modules, including
metadata, summing separately gzipped responses. There is no added core CSS size.
