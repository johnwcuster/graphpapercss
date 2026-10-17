import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { contrastRatio } from '../docs/workbench/source.mjs';

test('site branding has eight color roles with readable text, controls, and focus', async () => {
  const css = await readFile('docs/docs.css', 'utf8');
  const palette = Object.fromEntries([...css.matchAll(/--site-([\w-]+):\s*(#[\da-f]{6});/g)].map(([, name, color]) => [name, color]));
  assert.deepEqual(Object.keys(palette).sort(), ['accent', 'focus', 'ink', 'muted', 'paper', 'rule', 'surface', 'tint']);
  for (const background of ['paper', 'surface']) {
    for (const foreground of ['ink', 'muted', 'accent']) {
      assert.ok(contrastRatio(palette[foreground], palette[background]) >= 4.5, `${foreground} on ${background}`);
    }
    assert.ok(contrastRatio(palette.focus, palette[background]) >= 3, `focus on ${background}`);
  }
  assert.ok(contrastRatio(palette.ink, palette.tint) >= 4.5, 'selected labels');
  assert.ok(contrastRatio(palette.accent, palette.tint) >= 3, 'selected control boundaries');
  assert.ok(contrastRatio(palette.rule, palette.surface) >= 3, 'control boundaries');
  const workbench = await readFile('docs/workbench.css', 'utf8');
  assert.doesNotMatch(workbench, /--site-[\w-]+\s*:/, 'No second palette or per-control token families');
  assert.doesNotMatch(await readFile('css/main.css', 'utf8'), /--site-/, 'Branding stays outside core');
});
