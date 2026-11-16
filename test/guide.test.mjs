// The help sheet: every goal can be shown as steps, and every step points somewhere real.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameSession } from '../core/engine.js';
import { CASE } from '../core/cases/fold/index.js';
import { guideSteps } from '../core/guide.js';

const fresh = async () => {
  const s = new GameSession({ ai: null });
  await s.newGame({ name: 'Guide' }, {});
  return s;
};

test('every goal has at least one step, and every step points at something that exists', async () => {
  const s = await fresh();
  for (const o of CASE.objectives) {
    const steps = guideSteps(CASE, s.state, o);
    assert.ok(steps.length > 0, `${o.id} has no steps`);
    for (const st of steps) {
      assert.ok(st.label, `${o.id}: a step with no label`);
      const t = st.target;
      if (!t) continue;
      if (t.loc) assert.ok(CASE.locations[t.loc], `${o.id}: no place called ${t.loc}`);
      if (t.type === 'hotspot') assert.ok(CASE.locations[t.loc].hotspots.some((h) => h.id === t.id), `${o.id}: ${t.id} is not at ${t.loc}`);
      if (t.type === 'npc') assert.ok(CASE.npcs[t.id], `${o.id}: nobody called ${t.id}`);
    }
  }
});

test('at the start, the help points at the Turnstile, right here', async () => {
  const s = await fresh();
  const g = await s.guide({});
  assert.equal(g.objective.id, 'o_gate');
  assert.equal(g.steps.length, 1);
  assert.deepEqual([g.steps[0].verb, g.steps[0].target.type, g.steps[0].target.id, g.steps[0].target.here], ['solve', 'hotspot', 'turnstile', true]);
  assert.equal(g.hints.length, 0);
});

test('through the gate, the help lists the shop, ticks things off, and takes hints one at a time', async () => {
  const s = await fresh();
  await s.examine({ id: 'turnstile' });
  await s.solve({ id: 'gate', answer: 'catch' });
  // The help opens on the goal at the top of the screen: the newest. Ask for the shop by name.
  const top = (await s.guide({})).objective.id;
  assert.equal(top, s.newestObjective().id);
  let g = await s.guide({ id: 'o_scene' });
  assert.equal(g.objective.id, 'o_scene');
  assert.ok(g.steps.every((st) => !st.done && st.target.loc === 'clockshop' && st.target.open), 'every step is in the shop, and the shop is open');
  await s.travel({ to: 'clockshop' });
  await s.examine({ id: 'tube_pendry' });
  g = await s.guide({ id: 'o_scene' });
  assert.equal(g.steps.find((st) => st.target.id === 'tube_pendry').done, true);
  assert.ok(g.steps.filter((st) => !st.done).every((st) => st.target.here), 'the rest are here');
  // Other open goals are listed, and any of them can be shown instead.
  assert.ok(g.others.length > 0);
  const other = await s.guide({ id: g.others[0].id });
  assert.equal(other.objective.id, g.others[0].id);
  // Hints come one at a time, are short, and are kept.
  const h1 = await s.think({ id: 'o_scene', plain: true });
  assert.equal(h1.text, CASE.objectives.find((o) => o.id === 'o_scene').hints[0]);
  assert.equal((await s.guide({ id: 'o_scene' })).hints.length, 1);
});

test('a talk step says what to ask', async () => {
  const s = await fresh();
  const o = CASE.objectives.find((x) => x.id === 'o_autopsy');
  const [st] = guideSteps(CASE, s.state, o);
  assert.equal(st.verb, 'talk');
  assert.ok(st.ask && st.ask.endsWith('?'), 'it gives the question to ask');
});
