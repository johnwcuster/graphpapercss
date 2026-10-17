# Browser support and builds

Modern Graph Paper requires CSS Grid, column subgrid, named inline-size
container queries, and container-query units. The optional band stylesheet uses
the same browser capabilities. Unsupported browsers do not receive a legacy
fallback automatically; the 0.2.3 compatibility profile is a separate choice.

Structural tests use pinned Playwright 1.64.0 against Chromium, Firefox, and
WebKit. Tested versions are recorded in `test-results/browsers.json`; these are
test environments, not claims about the oldest supported browser.

## Choose a build

| Build | Use |
| --- | --- |
| `css/main.css` / `css/main.min.css` | Modern core; start here. Minification does not change behavior. |
| `css/main.layer.css` / `css/main.layer.min.css` | The same core inside the `graph-paper` cascade layer. |
| `css/bands.css` / `css/bands.min.css` | Optional experimental bands; load after modern core when using band classes. |
| `css/compat.css` / `css/compat.min.css` | Alternative standalone 0.2.3 profile, including its legacy globals and viewport behavior. |
| `css/legacy/main.css` / `css/legacy/main.min.css` | Frozen released 0.2.3 reference and its minification. |

Use one core/profile, not modern plus compatibility together. The compatibility profile is not a polyfill for modern fields. See [Migration](migration.html) before upgrading an existing site.

## Integrate with your cascade

For unlayered projects, load modern core, optional bands, and then host styles:

```html
<link rel="stylesheet" href="css/main.min.css">
<link rel="stylesheet" href="css/bands.min.css">
<link rel="stylesheet" href="site.css">
```

Omit the bands link if no bands are used. For layered projects, declare your intended layer order and place both core and bands in the same layer. One option in your entry stylesheet is:

```css
@layer graph-paper, site;
@import url("css/main.min.css") layer(graph-paper);
@import url("css/bands.min.css") layer(graph-paper);

@layer site {
  /* Host typography, components, and spacing. */
}
```

Alternatively, the pre-layered core already declares `graph-paper`; do not wrap it in another layer of the same name. Load bands into its existing layer. Normal unlayered host declarations override normal layered declarations, independently of stylesheet order.

## Understand support limits

The test matrix verifies structure in three current browser engines. It does not establish an oldest-supported browser version, guarantee every embedded webview, or replace testing your own content and styles. No minimum browser-version table is claimed here without a dedicated compatibility audit.

Core has no JavaScript runtime requirement. The configurator uses JavaScript for documentation tooling; that requirement does not carry into copied compositions. Pin exact releases for production and distinguish the development documentation from published assets.

## Verify in your project

Check actual available canvas widths, enlarged text/root font settings, source-order reading, image sizing, and host cascade overrides. A passing library test is not a guarantee that your content treatment remains usable.

For repository maintainers, [Contributing](contributing.md) explains setup and the [validation reference](validation.md) provides browser commands, Docker execution, coverage, and limits. That toolchain is not required to use the distributed CSS.
