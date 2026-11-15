// Builds what the player is allowed to see from the full game state.
// Nothing leaves this function that the detective has not earned, so the
// client (and anyone reading its network traffic) cannot peek at the solution.

import { check } from './conditions.js';
import { hashString } from './util.js';

/** Where a character is right now, or null if they are nowhere to be found. */
export function npcPlace(npc, state) {
  const w = (npc.where ?? []).find((x) => check(x.if, state));
  return w ?? null;
}

/** Everything the detective can put in front of someone: evidence, then opened records. */
export function presentables(state, caseData) {
  const out = [];
  for (const [id, st] of Object.entries(state.evidence)) {
    const def = caseData.evidence[id] ?? state.custom[id];
    if (!def) continue;
    out.push({ id, name: def.name, desc: def.desc, icon: def.icon, kind: 'evidence', at: st.at });
  }
  for (const [id, at] of Object.entries(state.records)) {
    const def = caseData.records[id];
    if (!def || def.kind === 'request' || state.evidence[id]) continue;
    // A record that simply reprints a held document would be a duplicate.
    if ((def.effects ?? []).some((e) => e.ev && state.evidence[e.ev])) continue;
    out.push({ id, name: def.title, desc: firstLines(def.body, 2), icon: 'doc', kind: 'record', at });
  }
  return out.sort((a, b) => b.at - a.at);
}

function firstLines(text, n) {
  return String(text ?? '').split('\n').filter((l) => l.trim()).slice(0, n).join(' ');
}

function lookFor(npc, place, state) {
  let look = { ...npc.look };
  for (const variant of npc.lookIf ?? []) {
    if (check(variant.if, state)) look = { ...look, ...variant };
  }
  delete look.if;
  if (place?.pose) look.pose = place.pose;
  if (place?.accessories) look.accessories = place.accessories;
  return look;
}

function sceneFor(locId, state, caseData) {
  const raw = caseData.scenes[locId];
  const props = raw.props.filter((p) => check(p.if, state)).map(({ if: _if, ...rest }) => rest);
  const scene = { ...raw, props };
  return { scene, version: hashString(JSON.stringify(props)) };
}

/**
 * @param {import('./engine.js').GameState} state
 * @param {any} caseData
 * @param {{live: boolean, label: string, model?: string|null}} ai
 */
export function buildView(state, caseData, ai) {
  const s = state;
  const locDef = caseData.locations[s.location];
  const { scene, version } = sceneFor(s.location, s, caseData);

  const hotspots = locDef.hotspots
    .filter((h) => check(h.if, s))
    .map((h) => {
      const index = h.views.findIndex((v) => check(v.if, s));
      const v = h.views[index];
      const done = s.examined[`${h.id}#${index}`] !== undefined && !v?.repeat;
      const fresh = !!v && !done && !!(v.text || v.action || h.action);
      return { id: h.id, at: h.at ?? null, p: h.p ?? null, size: h.size ?? null, label: h.label, kind: h.kind, done: !fresh, action: typeof (v?.action ?? h.action) === 'string' ? (v?.action ?? h.action) : v?.action?.travel ? 'travel' : null };
    });

  const npcsHere = [];
  const people = [];
  for (const [id, npc] of Object.entries(caseData.npcs)) {
    const place = npcPlace(npc, s);
    const st = s.npcs[id];
    const here = place?.loc === s.location;
    if (here) {
      npcsHere.push({ id, name: st?.met ? npc.name : roleName(npc), short: npc.short, look: lookFor(npc, place, s), p: place.p, r: place.r ?? 0, met: !!st?.met, mood: st?.mood ?? 'calm' });
    }
    if (st?.met) {
      people.push({
        id,
        name: npc.name,
        short: npc.short,
        look: lookFor(npc, place, s),
        here,
        where: place?.loc ? caseData.locations[place.loc].name : null,
        phone: !!npc.phone && !!place?.loc && !here && s.act < caseData.finale.act,
        notes: factsAbout(id, s, caseData),
        exchanges: st.exchanges,
      });
    }
  }
  for (const [id, p] of Object.entries(caseData.people)) {
    if (!check(p.if, s)) continue;
    people.push({ id, name: p.name, short: p.short, dead: true, notes: factsAbout(id, s, caseData) });
  }

  const evidence = Object.entries(s.evidence)
    .map(([id, st]) => {
      const def = caseData.evidence[id] ?? s.custom[id];
      if (!def) return null;
      return {
        id,
        name: def.name,
        icon: def.icon,
        desc: def.desc,
        doc: def.doc ?? null,
        at: st.at,
        lab: def.lab ? { status: st.lab, result: st.lab === 'done' ? def.lab.result : null, eta: st.lab === 'pending' ? Math.max(1, st.due - s.steps) : null } : null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.at - a.at);

  const facts = Object.entries(s.facts)
    .map(([id, st]) => ({ id, text: caseData.facts[id].text, tag: caseData.facts[id].tag, key: !!caseData.facts[id].key, at: st.at }))
    .sort((a, b) => b.at - a.at);

  const records = Object.entries(s.records)
    .map(([id, at]) => ({ id, title: caseData.records[id].title, kind: caseData.records[id].kind, body: caseData.records[id].body, at }))
    .sort((a, b) => b.at - a.at);

  const deductions = Object.entries(caseData.deductions)
    .filter(([id]) => s.deductions[id]?.open !== undefined)
    .map(([id, d]) => {
      const st = s.deductions[id];
      const solved = st.solved !== undefined;
      return {
        id,
        q: d.q,
        solved,
        attempts: st.attempts,
        options: d.options.map((o) => ({ id: o.id, text: o.text })),
        answer: solved ? d.options.find((o) => o.id === d.answer).text : null,
        note: solved ? d.solved : null,
      };
    });

  const objectives = caseData.objectives
    .filter((o) => s.objectives[o.id]?.seen !== undefined)
    .map((o) => ({ id: o.id, text: o.text, done: s.objectives[o.id].done !== undefined, seen: s.objectives[o.id].seen }))
    .sort((a, b) => Number(a.done) - Number(b.done) || b.seen - a.seen);

  const map = Object.entries(caseData.locations)
    .filter(([id, l]) => s.unlocked[id] && l.map)
    .map(([id, l]) => ({ id, name: l.name, sub: l.sub, at: l.map, here: s.location === id || caseData.locations[s.location].parent === id, visited: (s.visited[id] ?? 0) > 0 }));

  // Puzzles the detective has come across: what the panel shows, and nothing about an answer not yet given.
  const feeds = (caseData.feeds ?? []).map((pid, i) => {
    const st = s.puzzles[pid];
    const def = caseData.puzzles[pid];
    return { n: i + 1, title: def.title, answer: st?.solved !== undefined ? def.answers[0] : null };
  });
  const puzzles = Object.entries(caseData.puzzles)
    .filter(([id]) => s.puzzles[id]?.open !== undefined)
    .map(([id, def]) => {
      const st = s.puzzles[id];
      const solved = st.solved !== undefined;
      return {
        id,
        title: def.title,
        setter: def.setter,
        tier: def.tier,
        extra: !!def.extra,
        secret: !!def.secret,
        feed: def.feed ?? null,
        blocks: def.blocks.map((b) => (b.feeds ? { feeds } : b)),
        ask: def.ask,
        solved,
        answer: solved ? def.answers[0] : null,
        note: solved ? def.solved : null,
        attempts: st.attempts,
        hints: def.hints.slice(0, st.hints),
        hintsLeft: def.hints.length - st.hints,
        lesson: def.lesson ? caseData.records[`l_${def.lesson}`]?.title.replace(/^Lecture · /, '') ?? null : null,
        at: st.solved ?? st.open,
      };
    })
    .sort((a, b) => Number(a.solved) - Number(b.solved) || b.at - a.at);
  const tools = Object.entries(caseData.tools ?? {})
    .filter(([, t]) => check(t.if, s))
    .map(([id, t]) => ({ id, name: t.name, desc: t.desc }));

  const act = caseData.acts[s.act];
  const restDef = s.flags.accused ? null : caseData.rest[s.act];
  const canAccuse = check(caseData.accuse.if, s) && !s.flags.accused;
  const f = s.finale;

  return {
    case: { title: caseData.meta.title, series: caseData.meta.series, tagline: caseData.meta.tagline, killer: caseData.meta.killerName },
    player: s.player,
    act: { n: s.act, title: act.title, date: act.date },
    steps: s.steps,
    location: { id: s.location, name: locDef.name, sub: locDef.sub, parent: locDef.parent ?? null, scene, sceneVersion: version, hotspots, npcs: npcsHere },
    map,
    evidence,
    presentables: presentables(s, caseData),
    facts,
    records,
    people,
    deductions,
    objectives,
    laptopHints: caseData.laptopHints.filter((h) => check(h.if, s) && !check(h.done, s)).slice(0, 5).map((h) => h.q),
    rest: restDef ? { can: check(restDef.if, s), why: restDef.why ?? null, warn: restDef.warn } : null,
    letterWaiting: !!s.flags.letter_waiting,
    labPending: evidence.filter((e) => e.lab?.status === 'pending').length,
    accuse: canAccuse
      ? {
          suspects: caseData.accuse.suspects.filter((id) => s.npcs[id]?.met).map((id) => ({ id, name: caseData.npcs[id].name, short: caseData.npcs[id].short })),
          motives: caseData.accuse.motives,
          blurb: caseData.accuse.blurb,
          warn: caseData.accuse.warn,
        }
      : null,
    accusation: s.accusation ? { suspect: caseData.npcs[s.accusation.suspect].name, verdict: s.accusation.verdict } : null,
    finale: f ? { active: s.location === caseData.finale.location && !f.ended, turn: f.turn, maxTurns: caseData.finale.maxTurns, ended: f.ended } : null,
    puzzles,
    tools,
    laptop: caseData.laptop.ui,
    hub: caseData.start.hub,
    ending: s.ending,
    notes: s.notes ?? '',
    ai,
    stats: s.stats,
  };
}

function roleName(npc) {
  const r = npc.role.replace(/^(the|your) /, '').split(',')[0];
  return r.charAt(0).toUpperCase() + r.slice(1);
}

function factsAbout(id, state, caseData) {
  return Object.keys(state.facts)
    .filter((fid) => caseData.facts[fid].about?.includes(id))
    .sort((a, b) => state.facts[a].at - state.facts[b].at)
    .map((fid) => caseData.facts[fid].text);
}
