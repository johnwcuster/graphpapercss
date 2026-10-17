import test from 'node:test';
import assert from 'node:assert/strict';
import { responseFor, occupiedGeometry, compareChoice, responseExplanation, thresholdNotice, bandComparisons } from '../docs/workbench/response.mjs';
import { diagramItems, transitionBoundaries } from '../docs/workbench/model.mjs';

const example = { grid: 'grid_02a--07', set: 'set_03', flow: 'default', items: 4, field: 'thin', band: '', width: 961 };

test('band illustrations use an absolute 3200px axis and distinguish current equivalence from transition policy', () => {
  const before = structuredClone(example), initial = bandComparisons(example);
  assert.deepEqual(initial.choices.map(choice => choice.band), ['', '01', '02', '03']);
  assert.equal(initial.choices[0].compactPx, 480);
  assert.equal(initial.choices[0].expandedPx, 960);
  const band = initial.choices.find(choice => choice.band === '02');
  assert.equal(band.comparison.sameHere, true);
  assert.equal(band.comparison.policyChanged, true);
  assert.equal(band.comparison.equivalent, false);
  assert.equal(initial.maximum, 3200);
  assert.equal(band.expandedPx, 752, 'Bands replace the default 960px transition rather than requiring both');
  for (const choice of initial.choices) {
    assert.ok(choice.compactPx <= choice.expandedPx && choice.expandedPx < initial.maximum);
    assert.equal(bandComparisons({ ...example, band: choice.band }).maximum, initial.maximum);
  }
  assert.equal(bandComparisons({ ...example, width: 753 }).choices.find(choice => choice.band === '02').comparison.sameHere, false);
  const shared = bandComparisons({ ...example, grid: 'grid_02', field: 'wide', set: 'set_03' }).choices.find(choice => choice.band === '01');
  assert.equal(shared.compactPx, shared.expandedPx);
  assert.equal(bandComparisons(example, 20).choices[0].expandedPx, 1200);
  assert.equal(bandComparisons({ ...example, width: 8192 }).maximum, 3200);
  assert.equal(bandComparisons({ ...example, grid: 'grid_03a--07', set: 'set_06', field: 'ruled' }).maximum, 3200);
  assert.deepEqual(example, before, 'Building comparisons never mutates author selections');
});

test('03a and 03a--01 differ by two ruler bits at the middle/right boundary', () => {
  const a = { ...example, grid: 'grid_03a', set: 'set_06', items: 6, field: 'wide', width: 1024 };
  const b = { ...a, grid: 'grid_03a--01' };
  assert.equal(compareChoice(a, b).sameHere, false);
  const before = occupiedGeometry(a), after = occupiedGeometry(b);
  assert.equal(after[1].end - before[1].end, 2);
  assert.equal(after[3].start - before[3].start, 2);
  assert.equal(compareChoice({ ...a, items: 1 }, { ...b, items: 1 }).sameHere, true);
});

test('response explanation separates band policy from the unchanged expanded design', () => {
  assert.equal(responseFor(example).state, 'expanded');
  const band = { ...example, band: '02' };
  assert.deepEqual(responseFor(band).thresholds, { minimum: 16, expandedBits: 22, compactBits: 29, compact: 36, expanded: 47 });
  assert.match(responseExplanation(band).why, /both show the expanded layout/);
  assert.match(responseExplanation(band).policy, /gp_band--02/);
  assert.match(responseExplanation(band).thresholds, /expanded ≥ 47rem \(752px\)/);
  assert.match(thresholdNotice(example, band), /960px → 752px/);
  assert.match(thresholdNotice(example, band), /Preview width stays 961px; the layout is expanded/);
  assert.match(responseExplanation({ ...band, width: 800 }).why, /Without a band.*compact/);
  assert.match(responseExplanation(band, 20).thresholds, /940px/);
  assert.match(responseExplanation({ ...example, grid: 'grid_02', field: 'full', band: '01' }).thresholds, /No separate compact interval/);
});

test('coincident boundaries produce one real transition with strictly below/above resize targets', () => {
  assert.deepEqual(transitionBoundaries({ compact: 28, expanded: 28 }), [
    { state: 'expanded', from: 'stacked', to: 'expanded', at: 448, before: 447, after: 449 }
  ]);
  const separate = transitionBoundaries({ compact: 30, expanded: 60 });
  assert.equal(separate.length, 2);
  assert.equal(separate[0].from, 'stacked');
  assert.equal(separate[0].to, 'compact');
  assert.equal(separate[1].from, 'compact');
  assert.equal(separate[1].to, 'expanded');
  for (const transition of transitionBoundaries({ compact: 28, expanded: 28 }, 16.2)) {
    assert.ok(transition.before < transition.at && transition.after > transition.at);
    assert.ok(Number.isInteger(transition.before) && Number.isInteger(transition.after));
  }
});


test('same-here labels explain stacked, shared compact, and unoccupied positions without disabling alternatives', () => {
  const current = { grid: 'grid_03a--07', set: 'set_06', flow: 'default', items: 6, field: 'wide', band: '', width: 600 };
  const candidate = { ...current, grid: 'grid_03b--07' };
  assert.match(compareChoice(current, candidate).reason, /same way when compact/);
  assert.equal(compareChoice(current, candidate).sameHere, true);
  assert.equal(compareChoice(current, candidate).equivalent, false, 'A shared compact layout is not full responsive equivalence');
  assert.equal(compareChoice({ ...current, width: 1200 }, { ...candidate, width: 1200 }).sameHere, false);
  assert.match(compareChoice({ ...current, width: 320 }, { ...candidate, width: 320 }).reason, /stacked in source order/);
  const empty = { ...current, grid: 'grid_03a--02', items: 1, width: 1200 };
  assert.equal(compareChoice(empty, { ...empty, grid: 'grid_03a--03' }).equivalent, true, 'Differences confined to unoccupied positions do not change this configuration');
});

test('each alternative uses its own thresholds, including equal current geometry with different future policies', () => {
  const current = { grid: 'grid_03a--07', set: 'set_06', flow: 'default', items: 6, field: 'wide', band: '02', width: 960 };
  assert.equal(responseFor(current).state, 'compact');
  assert.equal(responseFor({ ...current, grid: 'grid_03' }).state, 'expanded');
  assert.equal(compareChoice(current, { ...current, grid: 'grid_03' }).sameHere, false);
  const equal = compareChoice(current, { ...current, grid: 'grid_02a--04' });
  assert.equal(equal.sameHere, true);
  assert.equal(equal.policyChanged, true);
  assert.equal(equal.equivalent, false);
  assert.match(equal.reason, /Transition widths differ/);
});

test('true equivalence spans all occupied responsive states and transition thresholds', () => {
  for (const width of [320, 600, 1200]) {
    const a = { ...example, grid: 'grid_02', set: 'set_05', items: 5, field: 'wide', width };
    const b = { ...a, grid: 'grid_02a' };
    assert.equal(compareChoice(a, b).equivalent, true);
    assert.equal(compareChoice({ ...a, band: '02' }, b).equivalent, false);
  }
});

test('schematics include source-order stacking and the fourth full-width fallback item', () => {
  const positions = occupiedGeometry(example);
  assert.deepEqual(positions[3], { item: 4, start: 2, end: 61, row: 'auto', endRule: false });
  const diagrams = diagramItems(example.grid, example.set, example.flow, 4, 'thin');
  assert.equal(diagrams.length, 4);
  assert.equal(diagrams[3].width, 100);
  assert.ok(diagrams[3].y > diagrams[0].y);
  for (const state of ['compact', 'stacked']) {
    const items = diagramItems(example.grid, example.set, example.flow, 4, 'thin', state);
    assert.equal(items.length, 4);
    if (state === 'stacked') assert.ok(items.every(item => item.width === 100));
  }
});
