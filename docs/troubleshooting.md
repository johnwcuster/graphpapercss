# Troubleshooting

Start with the stylesheet, the source count and the element that owns the layout. Most surprises come from a version mismatch, a changed count, an inherited control choice or a container narrower than the viewport suggests.

## The new classes do nothing

Load the current `css/main.css` or minified/layered equivalent. A pinned 0.4 stylesheet does not understand `gp_layout--*`; the new core does not interpret `grid_*`, `set_*` or `gp_band--*`. Use [Migration](migration.md) rather than combining both versions.

The selecting element needs a recognized layout class and a valid ruler context. Setting `--gp-layout` alone on arbitrary markup does not activate composition. Keep parent placement separate from an independently selected inner layout using [the nesting forms](alignment.md).

## The layout stacks unexpectedly

Check direct **element** children, including hidden elements. Underfilled Three/Four compositions stack. Spanning Two requires at least two supporting items after excluding the endpoint(s). Mosaics require their exact six-to-thirteen count and Neat/Thin spacing. Unsupported features or too few available tracks can also trigger safeguards.

A selected ineligible layout stacks; it does not restore an earlier viewport layout. Review the current selection and capabilities rather than treating fallback as a breakpoint design.

## Changing counts moves earlier items

Automatic allocation changes the split when the total changes. It does not retain permanent groups. If a group must stay together, represent it as one source participant and give its children a nested arrangement.

Use Repeating peers for row-major collections. Use compositions for column-first source runs. Actual content heights can still imply false rows or an awkward focus path; inspect the rendered material rather than only the allocation numbers.

## An exact request does not apply

Use complete positive integer physical counts for the selected family. The total must match the participating source count, with the documented spread and coprime-neighbor conditions. Spanning Two counts only supports; Across Two ignores exact inputs.

Choose an eligible tuple in the configurator instead of guessing it. Invalid requests retain automatic allocation. Requests remain present and can reactivate when the source matches. Responsive inputs carry forward independently; explicit zero resets an earlier regional value, while `unset` reveals it. See [Exact physical counts](class-reference.md#exact-physical-counts).

## The preview changes at the wrong width

Viewport aliases measure the viewport, not the component. A wide screen can contain a narrow composition. Continue/rebase changes coordinates without changing that condition. Test the limiting region and choose another threshold or an author-owned component condition.

The configurator's requested width is a simulated viewport displayed at a scale that fits the workspace. Copied HTML does not impose that width on your page. Preview controls change the test environment; layout controls change the exported configuration.

## A control seems to persist across a new layout

Layout, gutters, allocation, traversal, arrangement, padding and vertical spacing have independent mobile-up carry-forward. Select an explicit default or zero where the design should reset. Class attribute order is not breakpoint priority. Independently selected nested layouts do not inherit the outer typed control inputs.

## Padding or spacing does not follow the expected bit

Keep coordinate roots and continuation wrappers unpadded. Put `gp_pad` on content whose containing block corresponds to its inherited track metadata. A max-width or otherwise narrowed intermediate box can interrupt that relationship; use an appropriate full-region layer or ordinary host spacing there.

Vertical-spacing utilities add margins at lower item starts, not gaps between every construction row. Shared rows can redistribute height. Thin mosaics have defaults that explicit vertical-spacing classes replace. Host declarations override zero-specificity margins/padding normally.

## A rule is missing or the wrong color

Ruled spacing reserves geometry; decoration also needs `gp_ruler--measure` at the intended coordinate root and explicit `gp_rule--start/end` ownership on the item. Outer/nonexistent boundaries and insufficient internal gutters suppress rules. Mosaics do not support Ruled.

Set `--gp-rule-color` and `--gp-rule-width` in author CSS or an inline property declaration. Choose one owner per shared gutter. Keep measurement locally scoped; it is unnecessary for padding or Thin mosaic margins.

## Text or images make a valid layout difficult to read

The core does not supply a readable measure, type scale, fixed heights or image cropping. Change the content treatment, proportion, grouping or transition. Do not make less important text dictate composition height by forcing it into a narrow region. Review keyboard and source hierarchy alongside visual emphasis.

Continue with [Authoring compositions](authoring.md) or [Browser support and builds](browser-support.md).
