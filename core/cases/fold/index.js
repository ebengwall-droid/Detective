// Assembles The Invigilator into one case object and checks it for dangling
// references, so a typo in the script fails loudly at start-up instead of
// quietly making the mystery unsolvable.

import { FACTS } from './facts.js';
import { EVIDENCE, letterEvidence } from './evidence.js';
import { RECORDS } from './records.js';
import { LOCATIONS } from './locations.js';
import { SCENES } from './scenes.js';
import { NPCS, PEOPLE } from './npcs.js';
import { SMALL } from './smalltalk.js';
import { PUZZLES, FEEDS, TOOLS } from './puzzles.js';
import { META, START, WORLD, ACTS, ACT4_CARDS, BEATS, OBJECTIVES, REST, DEDUCTIONS, ACCUSE, FINALE, LAPTOP_HINTS, LAPTOP, PROMPTS, PUZZLE_MISS, DIRECTOR, ENDINGS } from './story.js';
import { conditionRefs } from '../../conditions.js';

// Each person's small talk travels with them; the detective's partner is the one who answers "what do I do?".
for (const [id, npc] of Object.entries(NPCS)) npc.small = SMALL[id] ?? {};
NPCS.kit.guide = true;

// A lecture should always be found by its own title.
for (const r of Object.values(RECORDS)) if (r.kind === 'lecture') r.keys.push(r.title.replace(/^Lecture · /, ''));

export const CASE = {
  meta: META,
  start: START,
  world: WORLD,
  acts: ACTS,
  act4Cards: ACT4_CARDS,
  facts: FACTS,
  evidence: EVIDENCE,
  letterEvidence,
  records: RECORDS,
  locations: LOCATIONS,
  scenes: SCENES,
  npcs: NPCS,
  people: PEOPLE,
  puzzles: PUZZLES,
  feeds: FEEDS,
  tools: TOOLS,
  puzzleMiss: PUZZLE_MISS,
  beats: BEATS,
  objectives: OBJECTIVES,
  rest: REST,
  deductions: DEDUCTIONS,
  accuse: ACCUSE,
  finale: FINALE,
  laptopHints: LAPTOP_HINTS,
  laptop: LAPTOP,
  prompts: PROMPTS,
  director: DIRECTOR,
  endings: ENDINGS,
};

/**
 * Walk the case and collect every broken reference.
 * @returns {string[]} problems; empty when the case is sound
 */
export function validateCase(c = CASE) {
  const problems = [];
  const dynamicEvidence = new Set(Object.keys(c.director.letters).map((n) => `paper_${n}`));
  const hotspotIds = new Set();
  const knowIds = new Set();
  const jobIds = new Set();
  // Flags the engine itself raises.
  const flagsSet = new Set(['letter_waiting', 'accused', 'finale_done', 'knew_killer', 'lab_used']);
  const marks = new Set(Object.keys(c.acts).map((n) => `act${n}`));

  for (const loc of Object.values(c.locations)) for (const h of loc.hotspots) hotspotIds.add(h.id);
  for (const [nid, npc] of Object.entries(c.npcs)) for (const k of npc.know) knowIds.add(`${nid}.${k.id}`);

  const noteEffects = (effects = []) => {
    for (const e of effects) {
      if (e.flag) {
        flagsSet.add(e.flag);
        marks.add(`flag:${e.flag}`);
      }
      if (e.mark) marks.add(e.mark);
      if (e.job) jobIds.add(e.job.id);
    }
  };
  for (const b of c.beats) noteEffects(b.do);
  for (const npc of Object.values(c.npcs)) {
    for (const k of npc.know) noteEffects(k.effects);
    for (const a of npc.acts ?? []) noteEffects(a.effects);
    for (const r of npc.react ?? []) noteEffects(r.effects);
  }
  for (const r of Object.values(c.records)) noteEffects(r.effects);
  for (const loc of Object.values(c.locations)) for (const h of loc.hotspots) for (const v of h.views) noteEffects(v.effects);
  for (const p of Object.values(c.puzzles)) noteEffects(p.effects);
  for (const list of Object.values(c.finale.onEnd ?? {})) noteEffects(list);
  for (const f of c.accuse.flags ?? []) flagsSet.add(f);

  const checkFact = (id, where) => {
    if (!c.facts[id]) problems.push(`${where}: unknown fact "${id}"`);
  };
  const checkEv = (id, where) => {
    if (!c.evidence[id] && !dynamicEvidence.has(id)) problems.push(`${where}: unknown evidence "${id}"`);
  };
  const checkCond = (cond, where) => {
    let refs;
    try {
      refs = conditionRefs(cond);
    } catch (err) {
      problems.push(`${where}: ${err.message}`);
      return;
    }
    for (const ref of refs) {
      const i = ref.indexOf(':');
      const kind = ref.slice(0, i);
      const id = ref.slice(i + 1);
      if (kind === 'fact') checkFact(id, where);
      else if (kind === 'ev' || kind === 'lab' || kind === 'sent') checkEv(id, where);
      else if (kind === 'ded' && !c.deductions[id]) problems.push(`${where}: unknown deduction "${id}"`);
      else if (kind === 'rec' && !c.records[id]) problems.push(`${where}: unknown record "${id}"`);
      else if (kind === 'visited' && !c.locations[id]) problems.push(`${where}: unknown location "${id}"`);
      else if (kind === 'examined' && !hotspotIds.has(id)) problems.push(`${where}: unknown hotspot "${id}"`);
      else if (kind === 'met' && !c.npcs[id]) problems.push(`${where}: unknown npc "${id}"`);
      else if (kind === 'told' && !knowIds.has(id)) problems.push(`${where}: unknown knowledge item "${id}"`);
      else if ((kind === 'puz' || kind === 'puzopen') && !c.puzzles[id]) problems.push(`${where}: unknown puzzle "${id}"`);
      else if (kind === 'shown') {
        const [npc, ev] = id.split('.');
        if (!c.npcs[npc]) problems.push(`${where}: unknown npc in "${ref}"`);
        if (!c.evidence[ev] && !c.records[ev] && !dynamicEvidence.has(ev)) problems.push(`${where}: unknown evidence in "${ref}"`);
      } else if (kind === 'flag' && !flagsSet.has(id)) problems.push(`${where}: flag "${id}" is never set`);
      else if (kind === 'job' && !jobIds.has(id)) problems.push(`${where}: unknown job "${id}"`);
    }
  };
  const checkEffects = (effects, where) => {
    for (const e of effects ?? []) {
      if (e.fact) checkFact(e.fact, where);
      if (e.ev) checkEv(e.ev, where);
      if (e.unlock && !c.locations[e.unlock]) problems.push(`${where}: unlocks unknown location "${e.unlock}"`);
      if (e.letter && !c.director.letters[e.letter]) problems.push(`${where}: unknown letter ${e.letter}`);
      if (e.job) checkEffects(e.job.effects, where + ' job');
    }
  };

  if (!c.locations[c.start.location]) problems.push(`start: unknown location "${c.start.location}"`);
  if (!c.locations[c.start.hub]) problems.push(`start: unknown hub "${c.start.hub}"`);

  for (const [id, f] of Object.entries(c.facts)) {
    if (!f.text) problems.push(`fact ${id}: no text`);
    for (const who of f.about ?? []) if (!c.npcs[who] && !c.people[who]) problems.push(`fact ${id}: about unknown person "${who}"`);
  }
  for (const [id, ev] of Object.entries(c.evidence)) {
    for (const f of ev.facts ?? []) checkFact(f, `evidence ${id}`);
    for (const f of ev.lab?.facts ?? []) checkFact(f, `evidence ${id} lab`);
  }
  for (const f of c.letterEvidence(1, 'x').lab?.facts ?? []) checkFact(f, 'letter evidence lab');
  for (const [id, r] of Object.entries(c.records)) {
    if (!r.body) problems.push(`record ${id}: no body`);
    if (!r.keys?.length) problems.push(`record ${id}: no keys`);
    checkCond(r.if, `record ${id}`);
    for (const f of r.facts ?? []) checkFact(f, `record ${id}`);
    checkEffects(r.effects, `record ${id}`);
    checkEffects(r.request?.effects, `record ${id} request`);
  }
  for (const [lid, loc] of Object.entries(c.locations)) {
    const scene = c.scenes[lid];
    if (!scene) {
      problems.push(`location ${lid}: no scene`);
      continue;
    }
    if (loc.parent && !c.locations[loc.parent]) problems.push(`location ${lid}: unknown parent "${loc.parent}"`);
    const propIds = new Set(scene.props.filter((p) => p.id).map((p) => p.id));
    for (const p of scene.props) checkCond(p.if, `scene ${lid} prop ${p.t}`);
    for (const h of loc.hotspots) {
      const where = `hotspot ${lid}.${h.id}`;
      if (h.at && !propIds.has(h.at)) problems.push(`${where}: no prop with id "${h.at}"`);
      if (!h.at && !h.p) problems.push(`${where}: needs "at" or "p"`);
      checkCond(h.if, where);
      for (const act of [h.action, ...h.views.map((v) => v.action)]) {
        if (typeof act === 'string' && act.startsWith('puzzle:') && !c.puzzles[act.slice(7)]) problems.push(`${where}: opens unknown puzzle "${act}"`);
      }
      for (const v of h.views) {
        checkCond(v.if, where);
        for (const f of v.facts ?? []) checkFact(f, where);
        for (const e of v.ev ?? []) checkEv(e, where);
        checkEffects(v.effects, where);
        const travel = v.action?.travel;
        if (travel && !c.locations[travel]) problems.push(`${where}: travels to unknown location "${travel}"`);
      }
    }
  }
  for (const [nid, npc] of Object.entries(c.npcs)) {
    const where = `npc ${nid}`;
    if (!npc.look) problems.push(`${where}: no look`);
    if (!npc.fallback?.length) problems.push(`${where}: no fallback lines`);
    for (const kind of ['hello', 'who', 'how', 'ack', 'thanks', 'bye', 'accuse', 'case']) {
      const line = npc.small?.[kind];
      if (!line || (Array.isArray(line) && !line.length)) problems.push(`${where}: no small talk for "${kind}"`);
      else if (typeof line === 'string' && line.startsWith('@') && !npc.know.some((k) => k.id === line.slice(1))) problems.push(`${where}: small talk "${kind}" points at unknown item ${line}`);
    }
    if (!npc.guide && !npc.small?.next) problems.push(`${where}: no answer to "what should I do?"`);
    const beats = npc.small?.beat ?? [];
    if (!beats.length) problems.push(`${where}: nothing to do while thinking`);
    for (const b of beats) if (!/^\*[^*]+\*$/.test(b)) problems.push(`${where}: a thinking beat must be one stage direction: ${b}`);
    for (const w of npc.where) {
      checkCond(w.if, where);
      if (w.loc && !c.locations[w.loc]) problems.push(`${where}: placed in unknown location "${w.loc}"`);
      if (w.loc && !Array.isArray(w.p)) problems.push(`${where}: no position in "${w.loc}"`);
    }
    const actIds = new Set((npc.acts ?? []).map((a) => a.id));
    const ownIds = new Set(npc.know.map((k) => k.id));
    for (const k of npc.know) {
      checkCond(k.if, `${where}.${k.id}`);
      checkCond(k.when, `${where}.${k.id}`);
      if (k.after && !ownIds.has(k.after)) problems.push(`${where}.${k.id}: after unknown item "${k.after}"`);
      if (!k.line) problems.push(`${where}.${k.id}: no line`);
      if (!k.keys?.length) problems.push(`${where}.${k.id}: no keys`);
      for (const f of k.facts ?? []) checkFact(f, `${where}.${k.id}`);
      checkEffects(k.effects, `${where}.${k.id}`);
    }
    for (const r of npc.react ?? []) {
      for (const e of [].concat(r.ev)) if (!c.evidence[e] && !c.records[e] && !dynamicEvidence.has(e)) problems.push(`${where} react: unknown evidence "${e}"`);
      checkCond(r.if, `${where} react`);
      for (const f of r.facts ?? []) checkFact(f, `${where} react`);
      for (const a of r.acts ?? []) if (!actIds.has(a)) problems.push(`${where} react: unknown act "${a}"`);
      for (const t of r.tells ?? []) if (!ownIds.has(t)) problems.push(`${where} react: tells unknown item "${t}"`);
      if (!r.line) problems.push(`${where} react: no line`);
    }
    for (const a of npc.acts ?? []) {
      checkCond(a.if, `${where} act ${a.id}`);
      checkEffects(a.effects, `${where} act ${a.id}`);
    }
    for (const list of [npc.greet, npc.observe, npc.ask, npc.news, npc.personaIf]) for (const item of list ?? []) checkCond(item.if, where);
    for (const a of npc.ask ?? []) if (a.to && !ownIds.has(a.to) && !actIds.has(a.to)) problems.push(`${where} ask "${a.q}": routes to unknown "${a.to}"`);
    for (const o of npc.observe ?? []) for (const f of o.facts ?? []) checkFact(f, `${where} observe`);
  }
  for (const b of c.beats) {
    checkCond(b.when, `beat ${b.id}`);
    checkEffects(b.do, `beat ${b.id}`);
    for (const e of b.do) if (e.act && e.card && e.card !== '$verdict' && !c.act4Cards[e.card]) problems.push(`beat ${b.id}: unknown act card "${e.card}"`);
  }
  const stepsSinceRefs = [];
  const collect = (cond) => {
    if (!cond || typeof cond !== 'object') return;
    if (Array.isArray(cond)) return cond.forEach(collect);
    if ('stepsSince' in cond) stepsSinceRefs.push(cond.stepsSince);
    for (const key of ['all', 'any', 'of']) if (cond[key]) cond[key].forEach(collect);
    if (cond.not) collect(cond.not);
  };
  for (const b of c.beats) collect(b.when);
  for (const m of stepsSinceRefs) if (!marks.has(m)) problems.push(`stepsSince refers to mark "${m}" that nothing sets`);

  for (const [n, r] of Object.entries(c.rest)) checkCond(r.if, `rest ${n}`);
  for (const o of c.objectives) {
    checkCond(o.if, `objective ${o.id}`);
    checkCond(o.done, `objective ${o.id}`);
    if (!o.hints?.length) problems.push(`objective ${o.id}: no hints`);
  }
  for (const [id, d] of Object.entries(c.deductions)) {
    checkCond(d.if, `deduction ${id}`);
    if (!d.options.some((o) => o.id === d.answer)) problems.push(`deduction ${id}: answer "${d.answer}" is not an option`);
    for (const o of d.options) checkCond(o.needs, `deduction ${id}.${o.id}`);
    for (const f of d.facts ?? []) checkFact(f, `deduction ${id}`);
  }
  for (const [id, p] of Object.entries(c.puzzles)) {
    const where = `puzzle ${id}`;
    checkCond(p.if, where);
    if (!p.answers?.length) problems.push(`${where}: no answer`);
    if (!p.hints?.length) problems.push(`${where}: no hints`);
    if (!p.blocks?.length) problems.push(`${where}: nothing to show`);
    for (const f of p.facts ?? []) checkFact(f, where);
    checkEffects(p.effects, where);
    if (p.lesson && !c.records[`l_${p.lesson}`]) problems.push(`${where}: no lecture "l_${p.lesson}"`);
  }
  c.feeds.forEach((pid, i) => {
    if (c.puzzles[pid]?.feed !== i + 1) problems.push(`feeds: "${pid}" is not question ${i + 1}`);
  });
  for (const [id, t] of Object.entries(c.tools)) checkCond(t.if, `tool ${id}`);
  for (const s of c.accuse.suspects) if (!c.npcs[s]) problems.push(`accuse: unknown suspect "${s}"`);
  for (const p of c.accuse.pillars) checkCond(p.if, `accuse pillar ${p.id}`);
  for (const v of Object.keys(c.act4Cards)) if (v !== 'timeout' && v !== 'exposed' && !c.accuse.replies[v]) problems.push(`act four card "${v}" has no matching verdict`);
  if (!c.npcs[c.finale.npc]) problems.push(`finale: unknown npc "${c.finale.npc}"`);
  if (!c.locations[c.finale.location]) problems.push(`finale: unknown location "${c.finale.location}"`);
  checkCond(c.finale.knewIf, 'finale knewIf');
  checkCond(c.finale.safeIf, 'finale safeIf');
  for (const n of [...c.finale.firstNotes, ...(c.finale.everyTurn ?? [])]) checkCond(n.if, 'finale note');
  for (const l of c.finale.levers) checkCond(l.if, `finale lever ${l.id}`);
  for (const id of c.finale.personal) if (!c.finale.levers.some((l) => l.id === id)) problems.push(`finale: personal lever "${id}" does not exist`);
  for (const t of c.endings.truths) checkCond(t.if, `ending truth ${t.id}`);
  for (const list of [c.director.did, c.director.missed]) for (const item of list) checkCond(item.if, 'director');
  for (const p of Object.values(c.people)) checkCond(p.if, 'people');
  for (const h of c.laptopHints) {
    checkCond(h.if, `laptop hint "${h.q}"`);
    checkCond(h.done, `laptop hint "${h.q}"`);
  }

  return problems;
}
