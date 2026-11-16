// What to do now: the newest open goal, as a few steps the player can see,
// tick off, and be taken to.
//
// The steps are read from the goal's own `done` condition, so they can never
// disagree with what actually completes it. Each step names one thing to do
// (look at something, talk to someone, solve a puzzle, go somewhere) and,
// where the case file says where that happens, a target the page can walk or
// travel to.

import { check } from './conditions.js';
import { npcPlace } from './view.js';

/** @typedef {{ type: 'hotspot'|'npc'|'place'|'lab'|'lectern'|'board'|'map', id?: string, loc?: string }} Target */
/** @typedef {{ verb: string, label: string, ask?: string, target: Target|null }} Source */

const memo = new WeakMap();

/** Every place in the case file that hands over a fact, a piece of evidence or a flag. */
function sources(c) {
  if (memo.has(c)) return memo.get(c);
  const spots = new Map();
  const fact = new Map();
  const ev = new Map();
  const flag = new Map();
  const add = (map, key, src) => {
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(src);
  };
  const fromEffects = (effects, src) => {
    for (const e of effects ?? []) {
      if (e.flag) add(flag, e.flag, src);
      if (e.ev) add(ev, e.ev, src);
      if (e.fact) add(fact, e.fact, src);
    }
  };
  for (const [loc, L] of Object.entries(c.locations)) {
    for (const h of L.hotspots) {
      spots.set(h.id, { loc, h });
      for (const v of h.views) {
        const src = { verb: 'look', label: h.label, target: { type: 'hotspot', id: h.id, loc }, when: [h.if, v.if] };
        for (const f of v.facts ?? []) add(fact, f, src);
        for (const e of v.ev ?? []) add(ev, e, src);
        fromEffects(v.effects, src);
      }
    }
  }
  for (const [id, n] of Object.entries(c.npcs)) {
    for (const k of n.know ?? []) {
      const q = (n.ask ?? []).find((a) => a.to === k.id)?.q;
      const src = { verb: 'talk', label: n.name, npc: id, ask: q, when: [k.if] };
      for (const f of k.facts ?? []) add(fact, f, src);
      for (const e of k.ev ?? []) add(ev, e, src);
      fromEffects(k.effects, src);
    }
    for (const a of n.acts ?? []) fromEffects(a.effects, { verb: 'talk', label: n.name, npc: id, when: [a.if] });
  }
  for (const [id, p] of Object.entries(c.puzzles)) {
    const hid = (p.at ?? [])[0];
    const src = { verb: 'solve', label: p.title, puzzle: id, hotspot: hid, when: [p.if] };
    for (const f of p.facts ?? []) add(fact, f, src);
    fromEffects(p.effects, src);
  }
  for (const [id, e] of Object.entries(c.evidence)) {
    for (const f of e.facts ?? []) add(fact, f, { verb: 'ev', ev: id });
    for (const f of e.lab?.facts ?? []) add(fact, f, { verb: 'lab', label: e.name, target: { type: 'lab' } });
  }
  for (const [id, r] of Object.entries(c.records)) {
    const src = { verb: 'lectern', label: 'The Lectern', target: { type: 'lectern' }, when: [r.if], record: id };
    for (const f of r.facts ?? []) add(fact, f, src);
    fromEffects(r.effects, src);
  }
  for (const d of Object.values(c.deductions)) {
    const src = { verb: 'answer', label: 'The case board', target: { type: 'board' }, when: [d.if] };
    for (const f of d.facts ?? []) add(fact, f, src);
    fromEffects(d.effects, src);
  }
  const out = { spots, fact, ev, flag };
  memo.set(c, out);
  return out;
}

/** A source, placed in the world as it stands now. */
function place(c, s, src, depth = 0) {
  if (!src) return null;
  if (src.verb === 'ev') return depth > 3 ? null : bestOf(c, s, sources(c).ev.get(src.ev), depth + 1);
  if (src.npc) {
    const where = npcPlace(c.npcs[src.npc], s);
    return { verb: 'talk', label: src.label, ask: src.ask, target: where?.loc ? { type: 'npc', id: src.npc, loc: where.loc } : null };
  }
  if (src.puzzle) {
    const at = src.hotspot ? sources(c).spots.get(src.hotspot) : null;
    return { verb: 'solve', label: src.label, target: at ? { type: 'hotspot', id: src.hotspot, loc: at.loc } : null };
  }
  return { verb: src.verb, label: src.label, ask: src.ask, target: src.target ?? null };
}

/** Of several places that would do, the first that is open to the player now; failing that, the first. */
function bestOf(c, s, list, depth = 0) {
  if (!list?.length) return null;
  const open = list.find((src) => (src.when ?? []).every((w) => check(w, s)));
  return place(c, s, open ?? list[0], depth);
}

/** One condition atom as a step: what to do, and where. */
function atomStep(c, s, atom) {
  const cmp = atom.match(/^act(>=|<=|>|<|=|:)(\d+)$/);
  if (cmp) return { verb: 'rest', label: 'End the day', target: { type: 'map' } };
  const i = atom.indexOf(':');
  const kind = atom.slice(0, i);
  const id = atom.slice(i + 1);
  const src = sources(c);
  switch (kind) {
    case 'examined': {
      const at = src.spots.get(id);
      return at ? { verb: 'look', label: at.h.label, target: { type: 'hotspot', id, loc: at.loc } } : null;
    }
    case 'met': {
      const n = c.npcs[id];
      const where = npcPlace(n, s);
      return { verb: 'talk', label: n.name, target: where?.loc ? { type: 'npc', id, loc: where.loc } : null };
    }
    case 'visited':
      return { verb: 'go', label: c.locations[id].name, target: { type: 'place', loc: id } };
    case 'puz':
      return place(c, s, { verb: 'solve', label: c.puzzles[id].title, puzzle: id, hotspot: (c.puzzles[id].at ?? [])[0] });
    case 'lab':
    case 'sent':
      return { verb: 'lab', label: c.evidence[id].name, target: { type: 'lab' } };
    case 'ded':
      return { verb: 'answer', label: 'The case board', target: { type: 'board' } };
    case 'rec':
      return { verb: 'lectern', label: 'The Lectern', target: { type: 'lectern' } };
    case 'fact':
      return bestOf(c, s, src.fact.get(id));
    case 'ev':
      return bestOf(c, s, src.ev.get(id));
    case 'flag':
      // Naming the Invigilator is done on the case board, by the engine rather than the case file.
      if (id === 'accused') return { verb: 'answer', label: 'The case board', target: { type: 'board' } };
      return bestOf(c, s, src.flag.get(id));
    default:
      return null;
  }
}

/** Whether the page can take the player to a target from where they stand. */
function reach(c, s, target) {
  if (!target) return null;
  if (!target.loc) return { ...target, here: true, open: true };
  return { ...target, here: target.loc === s.location, open: target.loc === s.location || !!s.unlocked[target.loc], place: c.locations[target.loc]?.name ?? '' };
}

/**
 * The steps of a goal, in order.
 * @returns {{ verb: string, label: string, ask?: string, done: boolean, count?: [number, number], target: any }[]}
 */
export function guideSteps(c, s, objective) {
  const steps = [];
  const walk = (cond) => {
    if (cond === undefined || cond === null || cond === true) return;
    if (typeof cond === 'string') {
      if (cond.startsWith('!')) return;
      const st = atomStep(c, s, cond);
      if (st) steps.push({ ...st, done: check(cond, s), target: reach(c, s, st.target) });
      return;
    }
    if (Array.isArray(cond)) return cond.forEach(walk);
    if (cond.all) return cond.all.forEach(walk);
    if (cond.any) {
      // Any one will do: show the first that can be placed.
      const done = check(cond, s);
      for (const alt of cond.any) {
        if (typeof alt !== 'string') continue;
        const st = atomStep(c, s, alt);
        if (st?.target) return void steps.push({ ...st, done, target: reach(c, s, st.target) });
      }
      return;
    }
    if (cond.min !== undefined) {
      // So many of a list: one step that counts, aimed at the nearest one still to do.
      const got = cond.of.filter((x) => check(x, s)).length;
      const left = cond.of.filter((x) => typeof x === 'string' && !check(x, s)).map((x) => atomStep(c, s, x)).filter((x) => x?.target);
      const near = left.find((x) => x.target.loc === s.location) ?? left[0] ?? null;
      const allLooks = cond.of.every((x) => typeof x === 'string' && x.startsWith('examined:'));
      const where = near?.target?.loc ? c.locations[near.target.loc]?.name : '';
      steps.push({
        verb: allLooks ? 'look' : near?.verb ?? 'look',
        label: allLooks ? `${cond.min} other things${where ? ` at ${where}` : ''}` : `${cond.min} of these`,
        done: got >= cond.min,
        count: [Math.min(got, cond.min), cond.min],
        target: reach(c, s, near?.target ?? null),
      });
    }
  };
  // A goal may name the steps to show when its own condition would point somewhere less useful.
  walk(objective.go ?? objective.done);
  return steps;
}
