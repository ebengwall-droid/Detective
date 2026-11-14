// Assembles The Lamplighter into one case object and checks it for dangling
// references, so a typo in the script fails loudly at start-up instead of
// quietly making the mystery unsolvable.

import { FACTS } from './facts.js';
import { EVIDENCE, letterEvidence } from './evidence.js';
import { RECORDS } from './records.js';
import { LOCATIONS } from './locations.js';
import { SCENES } from './scenes.js';
import { NPCS, PEOPLE } from './npcs.js';
import { META, WORLD, ACTS, ACT4_CARDS, BEATS, OBJECTIVES, REST, DEDUCTIONS, ACCUSE, FINALE, LAPTOP_HINTS, DIRECTOR, ENDINGS } from './story.js';
import { conditionRefs } from '../../conditions.js';

// Two records simply reprint a document the detective can also hold.
RECORDS.inquiry_timeline.body = EVIDENCE.inquiry_timeline.doc;
RECORDS.custody_eastgate.body = EVIDENCE.custody_record.doc;

export const CASE = {
  meta: META,
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
  beats: BEATS,
  objectives: OBJECTIVES,
  rest: REST,
  deductions: DEDUCTIONS,
  accuse: ACCUSE,
  finale: FINALE,
  laptopHints: LAPTOP_HINTS,
  director: DIRECTOR,
  endings: ENDINGS,
};

/**
 * Walk the case and collect every broken reference.
 * @returns {string[]} problems; empty when the case is sound
 */
export function validateCase(c = CASE) {
  const problems = [];
  const dynamicEvidence = new Set(['letter_1', 'letter_2', 'letter_3']);
  const hotspotIds = new Set();
  const knowIds = new Set();
  const jobIds = new Set(['harrowgate', 'pell_retest']);
  const flagsSet = new Set(['letter_waiting', 'accused', 'finale_done', 'knew_vance', 'light_relit', 'lab_used']);
  const marks = new Set(['act1', 'act2', 'act3', 'act4']);

  for (const loc of Object.values(c.locations)) for (const h of loc.hotspots) hotspotIds.add(h.id);
  for (const [nid, npc] of Object.entries(c.npcs)) for (const k of npc.know) knowIds.add(`${nid}.${k.id}`);

  const noteEffects = (effects = []) => {
    for (const e of effects) {
      if (e.flag) flagsSet.add(e.flag);
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
      if (e.job) checkEffects(e.job.effects, where + ' job');
    }
  };

  for (const [id, f] of Object.entries(c.facts)) {
    if (!f.text) problems.push(`fact ${id}: no text`);
    for (const who of f.about ?? []) if (!c.npcs[who] && !c.people[who]) problems.push(`fact ${id}: about unknown person "${who}"`);
  }
  for (const [id, ev] of Object.entries(c.evidence)) {
    for (const f of ev.facts ?? []) checkFact(f, `evidence ${id}`);
    for (const f of ev.lab?.facts ?? []) checkFact(f, `evidence ${id} lab`);
  }
  for (const [id, r] of Object.entries(c.records)) {
    if (!r.body) problems.push(`record ${id}: no body`);
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
    const propIds = new Set(scene.props.filter((p) => p.id).map((p) => p.id));
    for (const p of scene.props) checkCond(p.if, `scene ${lid} prop ${p.t}`);
    for (const h of loc.hotspots) {
      const where = `hotspot ${lid}.${h.id}`;
      if (h.at && !propIds.has(h.at)) problems.push(`${where}: no prop with id "${h.at}"`);
      if (!h.at && !h.p) problems.push(`${where}: needs "at" or "p"`);
      checkCond(h.if, where);
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
    for (const w of npc.where) {
      checkCond(w.if, where);
      if (w.loc && !c.locations[w.loc]) problems.push(`${where}: placed in unknown location "${w.loc}"`);
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
      if (k.if !== undefined && typeof k.if !== 'string' && !k.need && !k.hide) {
        // Fine: a gate without "need" simply reads as "not yet relevant".
      }
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
    for (const e of b.do) {
      if (typeof b.when === 'object') {
        /* stepsSince marks are checked below */
      }
      if (e.act && e.card && e.card !== '$verdict' && !c.act4Cards[e.card]) problems.push(`beat ${b.id}: unknown act card "${e.card}"`);
    }
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
  for (const m of stepsSinceRefs) if (!marks.has(m)) problems.push(`stepsSince refers to mark "${m}" that no beat sets`);

  for (const [n, r] of Object.entries(c.rest)) checkCond(r.if, `rest ${n}`);
  for (const o of c.objectives) {
    checkCond(o.if, `objective ${o.id}`);
    checkCond(o.done, `objective ${o.id}`);
  }
  for (const [id, d] of Object.entries(c.deductions)) {
    checkCond(d.if, `deduction ${id}`);
    if (!d.options.some((o) => o.id === d.answer)) problems.push(`deduction ${id}: answer "${d.answer}" is not an option`);
    for (const o of d.options) checkCond(o.needs, `deduction ${id}.${o.id}`);
    for (const f of d.facts ?? []) checkFact(f, `deduction ${id}`);
  }
  for (const s of c.accuse.suspects) if (!c.npcs[s]) problems.push(`accuse: unknown suspect "${s}"`);
  for (const p of c.accuse.pillars) checkCond(p.if, `accuse pillar ${p.id}`);
  for (const p of c.accuse.halePillars) checkCond(p, 'accuse halePillars');
  for (const l of c.finale.levers) checkCond(l.if, `finale lever ${l.id}`);
  for (const t of c.endings.truths) checkCond(t.if, `ending truth ${t.id}`);
  for (const list of [c.director.did, c.director.missed]) for (const item of list) checkCond(item.if, 'director');
  for (const p of Object.values(c.people)) checkCond(p.if, 'people');
  for (const h of c.laptopHints) {
    checkCond(h.if, `laptop hint "${h.q}"`);
    checkCond(h.done, `laptop hint "${h.q}"`);
  }

  return problems;
}
