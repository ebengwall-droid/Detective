// GameSession: the whole game as a state machine with an async method per
// player action. It runs unchanged on the Node server (thin browser client)
// and inside the browser itself (static / hosted-page build).
//
// Every public method takes one plain args object plus optional hooks
// ({ onText, signal }) and resolves to plain JSON, so the transport between
// client and session can be a function call or an HTTP request.

import { CASE, validateCase } from './cases/fold/index.js';
import { check } from './conditions.js';
import { buildView, npcPlace, presentables } from './view.js';
import { Brain } from './brain.js';
import { itemUnlocked } from './prompts.js';
import { clone, clamp, sanitizePlayerText, GameError, hashString } from './util.js';
import { normalise } from './ciphers.js';

export const RPC_METHODS = new Set([
  'newGame', 'view', 'travel', 'examine', 'observe', 'talk', 'say', 'present',
  'laptopAsk', 'labSubmit', 'readLetter', 'deduce', 'accuse', 'think', 'rest',
  'finaleSay', 'epilogue', 'note', 'solve', 'hint',
]);
export const STREAMING_METHODS = new Set(['say', 'present', 'laptopAsk', 'readLetter', 'think', 'finaleSay', 'epilogue']);

const SAVE_VERSION = 4;
const MAX_LOG = 120;
const MAX_CONVO = 70;

/**
 * @typedef {Object} GameState
 * @property {number} v
 * @property {string} caseId
 * @property {{name: string}} player
 * @property {number} act
 * @property {number} steps
 * @property {string} location
 * @property {Record<string, boolean>} unlocked
 * @property {Record<string, number>} visited
 * @property {Record<string, number>} examined
 * @property {Record<string, {at: number, lab: 'none'|'pending'|'done', due?: number}>} evidence
 * @property {Record<string, {at: number, src: string}>} facts
 * @property {Record<string, any>} flags
 * @property {Record<string, number>} marks
 * @property {Record<string, number>} beats
 * @property {Record<string, any>} npcs
 * @property {Record<string, number>} records
 * @property {Record<string, {solved?: number, attempts: number}>} deductions
 * @property {Record<string, {open?: number, solved?: number, attempts: number, hints: number}>} puzzles
 * @property {Record<string, {seen?: number, done?: number}>} objectives
 * @property {{id: string, due: number, effects: any[], notify?: string}[]} jobs
 * @property {Record<string, number>} jobsDone
 * @property {Record<string, any>} custom  run-time evidence (the letters)
 * @property {any[]} actionLog
 * @property {any} finale
 * @property {any} ending
 * @property {any} stats
 */

function freshState(caseData, name) {
  /** @type {GameState} */
  const s = {
    v: SAVE_VERSION,
    caseId: caseData.meta.id,
    player: { name: sanitizePlayerText(name, 40) || 'Detective' },
    act: 1,
    steps: 0,
    location: caseData.start.location,
    unlocked: {},
    visited: { [caseData.start.location]: 1 },
    examined: {},
    evidence: {},
    facts: {},
    flags: {},
    marks: { act1: 0 },
    beats: {},
    npcs: {},
    records: {},
    deductions: {},
    puzzles: {},
    objectives: {},
    jobs: [],
    jobsDone: {},
    custom: {},
    letters: [],
    actionLog: [],
    hints: {},
    accusation: null,
    verdict: null,
    finale: null,
    ending: null,
    arrived: {},
    stats: { hints: 0, wrong: 0, wrongAccusations: 0, exchanges: 0, misses: 0, puzzleHints: 0, spoiled: 0, started: Date.now() },
  };
  return s;
}

export class GameSession {
  /**
   * @param {{ ai?: any, state?: GameState, caseData?: typeof CASE }} [opts]
   */
  constructor({ ai = null, state, caseData = CASE } = {}) {
    this.case = caseData;
    this.ai = ai;
    this.brain = new Brain(caseData, ai);
    /** @type {GameState|null} */
    this.state = state && state.v === SAVE_VERSION && state.caseId === caseData.meta.id ? state : null;
    /** @type {any[]} events produced by the action in progress */
    this.events = [];

    // Every player action is all-or-nothing. If one is interrupted part-way
    // (the player walks off while a character is still answering) the case
    // goes back to exactly how it was, so a question is never spent unanswered.
    for (const name of RPC_METHODS) {
      const run = this[name].bind(this);
      this[name] = async (args, hooks) => {
        if (this.inAction) return run(args, hooks);
        const before = this.state ? JSON.stringify(this.state) : null;
        this.inAction = true;
        try {
          return await run(args, hooks);
        } catch (err) {
          if (before) this.state = JSON.parse(before);
          this.events = [];
          throw err;
        } finally {
          this.inAction = false;
        }
      };
    }
  }

  // ------------------------------------------------------------ plumbing

  requireState() {
    if (!this.state) throw new GameError('No case in progress. Start a new game.', 409);
    return this.state;
  }

  emit(event) {
    this.events.push(event);
  }

  /** Finish an action: run the rules, then hand back view + events. */
  done(extra = {}) {
    this.settle();
    const events = this.events;
    this.events = [];
    return { ...extra, events, view: buildView(this.state, this.case, this.aiInfo()) };
  }

  aiInfo() {
    return this.ai?.describe?.() ?? { live: false, label: 'Scripted', model: null };
  }

  log(type, data = {}) {
    const s = this.requireState();
    s.actionLog.push({ step: s.steps, type, ...data });
    if (s.actionLog.length > 200) s.actionLog.splice(0, s.actionLog.length - 200);
  }

  npcState(id) {
    const s = this.requireState();
    if (!this.case.npcs[id]) throw new GameError('There is no such person.');
    s.npcs[id] ??= { met: false, told: {}, shown: {}, acts: {}, observed: {}, asked: {}, convo: [], log: [], exchanges: 0, mood: 'calm', lastStep: -1, sessionOpen: false };
    return s.npcs[id];
  }

  addFact(id, src) {
    const s = this.requireState();
    const fact = this.case.facts[id];
    if (!fact || s.facts[id]) return false;
    s.facts[id] = { at: s.steps, src };
    this.emit({ type: 'fact', id, text: fact.text, tag: fact.tag });
    return true;
  }

  evidenceDef(id) {
    return this.case.evidence[id] ?? this.requireState().custom[id] ?? null;
  }

  addEvidence(id, src) {
    const s = this.requireState();
    const def = this.evidenceDef(id);
    if (!def || s.evidence[id]) return false;
    s.evidence[id] = { at: s.steps, lab: 'none' };
    this.emit({ type: 'evidence', id, name: def.name, icon: def.icon, hasLab: !!def.lab });
    for (const f of def.facts ?? []) this.addFact(f, `ev:${id}`);
    return true;
  }

  applyEffects(effects = [], src = 'rule') {
    const s = this.requireState();
    for (const e of effects) {
      if (e.fact) this.addFact(e.fact, src);
      if (e.facts) for (const f of e.facts) this.addFact(f, src);
      if (e.ev) this.addEvidence(e.ev, src);
      if (e.flag) {
        if (e.value === false) delete s.flags[e.flag];
        else s.flags[e.flag] = e.value ?? true;
        s.marks[`flag:${e.flag}`] ??= s.steps;
      }
      if (e.mark && s.marks[e.mark] === undefined) s.marks[e.mark] = s.steps;
      if (e.unlock && !s.unlocked[e.unlock]) {
        s.unlocked[e.unlock] = true;
        const loc = this.case.locations[e.unlock];
        if (!loc.start) this.emit({ type: 'unlock', loc: e.unlock, name: loc.name });
      }
      if (e.notify) this.emit({ type: 'notify', text: e.notify });
      if (e.job && !s.jobsDone[e.job.id] && !s.jobs.some((j) => j.id === e.job.id)) {
        s.jobs.push({ id: e.job.id, due: s.steps + e.job.steps, effects: e.job.effects ?? [], notify: e.job.notify });
      }
      if (e.letter) this.queueLetter(e.letter);
      if (e.act) this.changeAct(e.act, e.card);
      if (e.call === 'takeLetter') {
        /* handled by examine(), which tells the client to call readLetter */
      }
    }
  }

  changeAct(n, cardKey) {
    const s = this.requireState();
    if (s.act >= n) return;
    s.act = n;
    s.marks[`act${n}`] = s.steps;
    const act = this.case.acts[n];
    let card = act.card;
    if (n === this.case.finale.act) {
      const key = cardKey === '$verdict' ? s.verdict : cardKey;
      card = this.case.act4Cards[key] ?? this.case.act4Cards.timeout;
      s.finale = { turn: 0, landed: {}, stance: 'cold', log: [], convo: [], ended: null, opened: false };
    }
    for (const npc of Object.values(s.npcs)) npc.sessionOpen = false;
    this.emit({ type: 'act', act: n, title: act.title, date: act.date, card });
  }

  queueLetter(n) {
    const s = this.requireState();
    if (s.letters.some((l) => l.n === n)) return;
    s.letters.push({ n, at: s.steps, read: false });
    s.flags.letter_waiting = true;
    this.emit({ type: 'letter', n, text: this.case.director.arrives });
  }

  /** Run jobs, story beats, objectives and deductions until nothing changes. */
  settle() {
    const s = this.requireState();
    for (let pass = 0; pass < 12; pass++) {
      let changed = false;
      for (const job of [...s.jobs]) {
        if (s.steps < job.due) continue;
        s.jobs.splice(s.jobs.indexOf(job), 1);
        s.jobsDone[job.id] = s.steps;
        if (job.lab) {
          const def = this.evidenceDef(job.lab);
          s.evidence[job.lab].lab = 'done';
          this.emit({ type: 'lab', id: job.lab, name: def.name, result: def.lab.result });
          for (const f of def.lab.facts ?? []) this.addFact(f, `lab:${job.lab}`);
        }
        if (job.notify) this.emit({ type: 'notify', text: job.notify });
        this.applyEffects(job.effects, `job:${job.id}`);
        changed = true;
      }
      for (const beat of this.case.beats) {
        if (s.beats[beat.id] !== undefined) continue;
        if (!check(beat.when, s)) continue;
        s.beats[beat.id] = s.steps;
        this.applyEffects(beat.do, `beat:${beat.id}`);
        changed = true;
      }
      if (!changed) break;
    }
    for (const o of this.case.objectives) {
      const st = (s.objectives[o.id] ??= {});
      if (st.done !== undefined) continue;
      const visible = check(o.if, s);
      if (visible && st.seen === undefined) {
        st.seen = s.steps;
        if (s.steps > 0) this.emit({ type: 'objective', id: o.id, text: o.text, done: false });
      }
      if (st.seen !== undefined && check(o.done, s)) {
        st.done = s.steps;
        this.emit({ type: 'objective', id: o.id, text: o.text, done: true });
      }
    }
    for (const [id, d] of Object.entries(this.case.deductions)) {
      const st = (s.deductions[id] ??= { attempts: 0 });
      if (st.open === undefined && check(d.if, s)) {
        st.open = s.steps;
        this.emit({ type: 'deduction', id, q: d.q });
      }
    }
    for (const [id, p] of Object.entries(this.case.puzzles)) {
      const st = (s.puzzles[id] ??= { attempts: 0, hints: 0 });
      if (st.open === undefined && check(p.if, s)) {
        st.open = s.steps;
        if (s.steps > 0) this.emit({ type: 'puzzle', id, title: p.title, opened: true, secret: !!p.secret });
      }
    }
  }

  // ------------------------------------------------------------- actions

  async newGame({ name } = {}) {
    this.state = freshState(this.case, name);
    this.events = [];
    const act = this.case.acts[1];
    this.emit({ type: 'act', act: 1, title: act.title, date: act.date, card: act.card, first: true });
    return this.done();
  }

  async view() {
    this.requireState();
    return this.done();
  }

  async travel({ to } = {}) {
    const s = this.requireState();
    const loc = this.case.locations[to];
    if (!loc || !s.unlocked[to]) throw new GameError('You have no reason to go there yet.');
    const F = this.case.finale;
    if (s.location === F.location && s.act >= F.act && !s.flags.finale_done) throw new GameError(F.stay);
    if (to === s.location) return this.done();
    const rest = this.case.rest[s.act];
    if (rest && s.steps - (s.marks[`act${s.act}`] ?? 0) >= rest.auto && check(rest.if, s)) {
      // The player never called it a night; the night arrives anyway.
      return this.rest({ forced: true });
    }
    s.steps += 2;
    s.location = to;
    s.visited[to] = (s.visited[to] ?? 0) + 1;
    for (const npc of Object.values(s.npcs)) npc.sessionOpen = false;
    this.log('travel', { to });
    const key = `${to}:${s.act}`;
    if (!s.arrived[key] && loc.arrive && s.visited[to] === 1) {
      this.emit({ type: 'arrive', text: loc.arrive });
    }
    s.arrived[key] = true;
    return this.done();
  }

  findHotspot(id) {
    const s = this.requireState();
    const loc = this.case.locations[s.location];
    const h = loc.hotspots.find((x) => x.id === id);
    if (!h || !check(h.if, s)) throw new GameError('There is nothing like that here.');
    return h;
  }

  async examine({ id } = {}) {
    const s = this.requireState();
    const h = this.findHotspot(id);
    const index = h.views.findIndex((v) => check(v.if, s));
    if (index < 0) throw new GameError('Nothing to see.');
    const v = h.views[index];
    const key = `${id}#${index}`;
    const first = s.examined[key] === undefined;
    const out = { title: h.label, text: v.text, kind: h.kind, action: v.action ?? h.action ?? null, taken: [], letter: false };
    if (first || v.repeat) {
      if (first) {
        s.examined[key] = s.steps;
        if (v.text) s.steps += 1;
        this.log('examine', { id, loc: s.location });
      }
      for (const f of v.facts ?? []) this.addFact(f, `look:${id}`);
      for (const e of v.ev ?? []) if (this.addEvidence(e, `look:${id}`)) out.taken.push(e);
      this.applyEffects(v.effects, `look:${id}`);
      if ((v.effects ?? []).some((e) => e.call === 'takeLetter')) out.letter = true;
    }
    if (out.action && typeof out.action === 'object' && out.action.travel) {
      const dest = out.action.travel;
      s.unlocked[dest] = true;
      const res = await this.travel({ to: dest });
      return { ...res, ...out, action: null, travelled: dest };
    }
    return this.done(out);
  }

  async observe({ id } = {}) {
    const s = this.requireState();
    const npc = this.case.npcs[id];
    const st = this.npcState(id);
    if (npcPlace(npc, s)?.loc !== s.location) throw new GameError('They are not here.');
    const index = (npc.observe ?? []).findIndex((o) => check(o.if, s));
    if (index < 0) return this.done({ title: npc.name, text: 'Nothing about them stands out.' });
    const o = npc.observe[index];
    if (st.observed[index] === undefined) {
      st.observed[index] = s.steps;
      s.steps += 1;
      this.log('observe', { id });
    }
    for (const f of o.facts ?? []) this.addFact(f, `observe:${id}`);
    return this.done({ title: npc.name, text: o.text });
  }

  /** Open a conversation: scripted greeting, suggested questions, transcript. */
  async talk({ id, phone = false } = {}) {
    const s = this.requireState();
    const npc = this.case.npcs[id];
    const st = this.npcState(id);
    const place = npcPlace(npc, s);
    if (this.atFinale(id)) return this.openFinale();
    const here = place?.loc === s.location;
    if (!here) {
      if (!(phone && npc.phone && st.met && place?.loc && s.act < this.case.finale.act)) throw new GameError(place?.loc ? 'They are not here.' : `${npc.name} is not answering.`);
    }
    let greeting = null;
    if (!st.sessionOpen) {
      const g = (npc.greet ?? []).find((x) => check(x.if, s));
      greeting = phone && !here ? this.phoneGreeting(npc, st) : g?.text ?? '';
      st.sessionOpen = true;
      st.pendingOpen = { greeting, phone: phone && !here };
      st.log.push({ who: 'npc', text: greeting, step: s.steps });
      trim(st.log, MAX_LOG);
    }
    const firstMeeting = !st.met;
    st.met = true;
    if (firstMeeting) this.log('met', { id });
    return this.done({
      talk: {
        id,
        name: npc.name,
        short: npc.short,
        phone: phone && !here,
        greeting,
        mood: st.mood,
        log: st.log.slice(-40),
        suggestions: this.suggestions(id),
      },
    });
  }

  phoneGreeting(npc, st) {
    const first = npc.name.split(' ').slice(-1)[0];
    return st.exchanges ? `${first}. Go on.` : `${first} here. Go on, Detective.`;
  }

  suggestions(id) {
    const s = this.requireState();
    const npc = this.case.npcs[id];
    const st = this.npcState(id);
    return (npc.ask ?? [])
      .filter((a) => check(a.if, s) && !st.asked[a.q])
      .slice(0, 4)
      .map((a) => a.q);
  }

  async say({ id, text } = {}, hooks = {}) {
    return this.exchange(id, { text: sanitizePlayerText(text) }, hooks);
  }

  async present({ id, item, text } = {}, hooks = {}) {
    const s = this.requireState();
    const list = presentables(s, this.case);
    const shown = list.find((p) => p.id === item);
    if (!shown) throw new GameError('You are not carrying that.');
    return this.exchange(id, { text: sanitizePlayerText(text), shown }, hooks);
  }

  /** One turn of conversation with a character. */
  async exchange(id, { text, shown }, hooks) {
    const s = this.requireState();
    const npc = this.case.npcs[id];
    const st = this.npcState(id);
    if (!st.sessionOpen) throw new GameError('Start the conversation first.');
    if (!text && !shown) throw new GameError('Say something.');
    if (this.atFinale(id)) return this.finaleSay({ text }, hooks);

    s.steps += 1;
    s.stats.exchanges += 1;
    st.exchanges += 1;
    st.lastStep = s.steps;
    if (text) st.asked[text] = true;

    // Putting evidence on the table is a hard fact the engine records itself.
    let react = null;
    if (shown) {
      st.shown[shown.id] = s.steps;
      react = (npc.react ?? []).find((r) => [].concat(r.ev).includes(shown.id) && check(r.if, s)) ?? null;
      st.log.push({ who: 'show', text: shown.name, step: s.steps });
      this.log('present', { id, item: shown.id });
    }
    if (text) st.log.push({ who: 'you', text, step: s.steps });
    this.log('say', { id });

    const reply = await this.brain.npcReply(s, id, { text, shown, react }, hooks);

    // Credit what was told. Hard gates are enforced here, not left to the model.
    const told = new Set(reply.told ?? []);
    for (const t of react?.tells ?? []) told.add(t);
    // Walk the items in script order so a chain (truth, then what followed)
    // can be credited from a single reply.
    for (const item of npc.know) {
      if (!told.has(item.id) || !itemUnlocked(item, st, s)) continue;
      if (st.told[item.id] === undefined) st.told[item.id] = s.steps;
      for (const f of item.facts ?? []) this.addFact(f, `npc:${id}`);
      this.applyEffects(item.effects, `npc:${id}`);
    }
    for (const f of react?.facts ?? []) this.addFact(f, `npc:${id}`);
    this.applyEffects(react?.effects, `npc:${id}`);
    const acts = new Set(reply.acts ?? []);
    for (const a of react?.acts ?? []) acts.add(a);
    for (const aid of acts) {
      const act = (npc.acts ?? []).find((a) => a.id === aid);
      if (!act || st.acts[aid] !== undefined || !check(act.if, s)) continue;
      st.acts[aid] = s.steps;
      this.applyEffects(act.effects, `npc:${id}`);
    }

    st.mood = reply.mood ?? st.mood;
    st.log.push({ who: 'npc', text: reply.say, step: s.steps, mood: st.mood });
    trim(st.log, MAX_LOG);
    if (reply.turn) {
      st.convo.push({ role: 'user', content: reply.turn }, { role: 'assistant', content: reply.raw });
      while (st.convo.length > MAX_CONVO) st.convo.splice(0, 2);
    }
    st.pendingOpen = null;

    const left = (npc.acts ?? []).some((a) => a.ends && st.acts[a.id] !== undefined);
    return this.done({
      reply: { say: reply.say, mood: st.mood, degraded: !!reply.degraded, ended: left },
      suggestions: left ? [] : this.suggestions(id),
    });
  }

  async laptopAsk({ query } = {}, hooks = {}) {
    const s = this.requireState();
    const q = sanitizePlayerText(query, 300);
    if (!q) throw new GameError(this.case.laptop.empty);
    s.steps += 1;
    this.log('laptop', { q });
    const result = await this.brain.laptop(s, q, hooks);
    const opened = [];
    for (const rid of result.open ?? []) {
      const rec = this.case.records[rid];
      if (!rec || !check(rec.if, s)) continue;
      opened.push(rid);
      if (s.records[rid] !== undefined) continue;
      s.records[rid] = s.steps;
      this.emit({ type: 'record', id: rid, title: rec.title });
      for (const f of rec.facts ?? []) this.addFact(f, `rec:${rid}`);
      this.applyEffects(rec.effects, `rec:${rid}`);
      if (rec.request) this.applyEffects([{ job: { id: rec.request.job, steps: rec.request.steps, effects: rec.request.effects, notify: rec.request.notify } }], `rec:${rid}`);
    }
    return this.done({ answer: result.answer, opened, degraded: !!result.degraded });
  }

  async labSubmit({ id } = {}) {
    const s = this.requireState();
    const st = s.evidence[id];
    const def = this.evidenceDef(id);
    if (!st || !def?.lab) throw new GameError('The lab has nothing to do with that.');
    if (st.lab !== 'none') return this.done({ status: st.lab });
    st.lab = 'pending';
    st.due = s.steps + def.lab.steps;
    s.flags.lab_used = true;
    s.jobs.push({ id: `lab:${id}`, due: st.due, effects: [], lab: id });
    this.log('lab', { id });
    this.emit({ type: 'notify', text: `${def.name} sent to the lab. They will ring when they have something.` });
    return this.done({ status: 'pending' });
  }

  /** The letter on the desk is written at the moment it is opened. */
  async readLetter(_args = {}, hooks = {}) {
    const s = this.requireState();
    const letter = s.letters.find((l) => !l.read);
    if (!letter) throw new GameError('The tray is empty.');
    const body = await this.brain.letter(s, letter.n, hooks);
    letter.read = true;
    const id = `${this.case.director.prefix}_${letter.n}`;
    s.custom[id] = this.case.letterEvidence(letter.n, body);
    if (!s.letters.some((l) => !l.read)) delete s.flags.letter_waiting;
    s.steps += 1;
    this.addEvidence(id, 'desk');
    this.log('letter', { n: letter.n });
    return this.done({ letter: { id, n: letter.n, body } });
  }

  async deduce({ id, option } = {}) {
    const s = this.requireState();
    const d = this.case.deductions[id];
    const st = s.deductions[id];
    if (!d || st?.open === undefined) throw new GameError('You have nothing to base that on yet.');
    if (st.solved !== undefined) return this.done({ ok: true, text: d.solved });
    const opt = d.options.find((o) => o.id === option);
    if (!opt) throw new GameError('Choose one of the answers.');
    s.steps += 1;
    if (opt.id === d.answer) {
      if (!check(opt.needs, s)) {
        return this.done({ ok: false, unsupported: true, text: 'It feels right. But a feeling is not a case. You need something that proves it before you pin it to the board.' });
      }
      st.solved = s.steps;
      this.log('deduce', { id });
      for (const f of d.facts ?? []) this.addFact(f, `ded:${id}`);
      this.applyEffects(d.effects, `ded:${id}`);
      return this.done({ ok: true, text: d.solved });
    }
    st.attempts += 1;
    s.stats.wrong += 1;
    return this.done({ ok: false, text: opt.no ?? 'That does not fit what you know.' });
  }

  async accuse({ suspect, motive, items = [] } = {}) {
    const s = this.requireState();
    const A = this.case.accuse;
    if (!check(A.if, s) || s.flags.accused) throw new GameError('This is not the moment.');
    if (!A.suspects.includes(suspect) || !this.npcState(suspect).met) throw new GameError('Choose someone you have met.');
    const pillars = A.pillars.filter((p) => check(p.if, s));
    // The case decides what an accusation is worth; the engine only keeps the books.
    const { verdict, final, right = false, flags = [] } = A.judge({ suspect, pillars, state: s, check });
    s.steps += 1;
    s.accusation = { suspect, motive, items: items.slice(0, 8), verdict, at: s.steps, pillars: pillars.map((p) => p.id) };
    this.log('accuse', { suspect, verdict });
    if (final) {
      s.flags.accused = true;
      s.verdict = verdict;
      for (const f of flags) s.flags[f] = true;
      if (right) s.flags.knew_killer = true;
      else s.stats.wrongAccusations += 1;
    } else {
      s.stats.wrongAccusations += 1;
    }
    const reply = A.replies[verdict];
    return this.done({ verdict, final, text: reply.text, speaker: reply.who });
  }

  /** End the day. The next act begins the following morning at the detective's desk. */
  async rest({ forced = false } = {}) {
    const s = this.requireState();
    const r = this.case.rest[s.act];
    if (!r || s.flags.accused) throw new GameError('There is no going home now.');
    if (!check(r.if, s)) return this.done({ ok: false, text: r.why });
    this.log('rest', { act: s.act, forced });
    s.steps += 1;
    this.changeAct(s.act + 1, r.card);
    const hub = this.case.start.hub;
    s.location = hub;
    s.visited[hub] = (s.visited[hub] ?? 0) + 1;
    return this.done({ ok: true });
  }

  /** The detective's own inner voice: a hint toward the nearest open objective. */
  async think(_args = {}, hooks = {}) {
    const s = this.requireState();
    const open = this.case.objectives.filter((o) => s.objectives[o.id]?.seen !== undefined && s.objectives[o.id]?.done === undefined);
    // Prefer the most recently opened thread; fall back to the oldest.
    const target = open.sort((a, b) => (s.objectives[b.id].seen - s.objectives[a.id].seen))[0];
    if (!target) return this.done({ text: 'Nothing nags at you. For once.', objective: null });
    const tier = clamp(s.hints[target.id] ?? 0, 0, target.hints.length - 1);
    s.hints[target.id] = (s.hints[target.id] ?? 0) + 1;
    s.stats.hints += 1;
    const text = await this.brain.think(s, target, tier, hooks);
    return this.done({ text, objective: target.text });
  }

  // ------------------------------------------------------------- puzzles

  puzzleState(id) {
    const s = this.requireState();
    const def = this.case.puzzles[id];
    const st = s.puzzles[id];
    if (!def || st?.open === undefined) throw new GameError('You have not come across that yet.');
    return { def, st };
  }

  /** Offer an answer to an open puzzle. A wrong one costs a little time and nothing else. */
  async solve({ id, answer } = {}) {
    const s = this.requireState();
    const { def, st } = this.puzzleState(id);
    if (st.solved !== undefined) return this.done({ ok: true, text: def.solved, answer: def.answers[0] });
    const given = normalise(sanitizePlayerText(answer, 80));
    if (!given) throw new GameError('Write an answer first.');
    s.steps += 1;
    if (def.answers.some((a) => normalise(a) === given)) {
      st.solved = s.steps;
      this.log('solve', { id });
      for (const f of def.facts ?? []) this.addFact(f, `puz:${id}`);
      this.applyEffects(def.effects, `puz:${id}`);
      this.emit({ type: 'puzzle', id, title: def.title, solved: true });
      return this.done({ ok: true, text: def.solved, answer: def.answers[0] });
    }
    st.attempts += 1;
    s.stats.misses += 1;
    const near = (def.near ?? []).find((n) => n.match.some((m) => normalise(m) === given));
    return this.done({ ok: false, text: near?.say ?? this.case.puzzleMiss[st.attempts % this.case.puzzleMiss.length] });
  }

  /** The next hint for a puzzle. The last one gives the answer, and the report says so. */
  async hint({ id } = {}) {
    const s = this.requireState();
    const { def, st } = this.puzzleState(id);
    if (st.solved !== undefined) return this.done({ text: def.solved, last: true, tier: st.hints });
    const tier = Math.min(st.hints, def.hints.length - 1);
    if (st.hints < def.hints.length) {
      st.hints += 1;
      s.stats.puzzleHints += 1;
      s.steps += 1;
      if (st.hints === def.hints.length) s.stats.spoiled += 1;
    }
    return this.done({ text: def.hints[tier], tier: tier + 1, of: def.hints.length, last: tier === def.hints.length - 1 });
  }

  // -------------------------------------------------------------- finale

  atFinale(id) {
    const s = this.requireState();
    const F = this.case.finale;
    return s.act >= F.act && id === F.npc && s.location === F.location;
  }

  finaleLevers() {
    const s = this.requireState();
    return this.case.finale.levers.filter((l) => check(l.if, s));
  }

  openFinale() {
    const s = this.requireState();
    const F = this.case.finale;
    const f = s.finale;
    this.npcState(F.npc).met = true;
    if (!f.opened) {
      f.opened = true;
      const knew = !!s.flags.knew_killer || check(F.knewIf, s);
      if (knew) s.flags.knew_killer = true;
      f.open = knew ? F.open.knew : F.open.blind;
      f.log.push({ who: 'npc', text: f.open });
    }
    return this.done({ talk: { id: F.npc, name: this.case.npcs[F.npc].name, short: F.title, finale: true, greeting: f.log.length === 1 ? f.open : null, mood: f.stance, log: f.log.slice(-40), suggestions: this.finaleChips() } });
  }

  finaleChips() {
    const f = this.requireState().finale;
    if (!f || f.ended) return [];
    return this.finaleLevers().filter((l) => !f.landed[l.id]).slice(0, 4).map((l) => l.chip);
  }

  async finaleSay({ text } = {}, hooks = {}) {
    const s = this.requireState();
    const F = this.case.finale;
    const f = s.finale;
    if (!f?.opened || s.location !== F.location) throw new GameError('There is nobody to say it to.');
    if (f.ended) throw new GameError('It is over.');
    const line = sanitizePlayerText(text);
    if (!line) throw new GameError('Say something.');
    f.turn += 1;
    s.steps += 1;
    const last = f.turn >= F.maxTurns;
    f.log.push({ who: 'you', text: line });
    const levers = this.finaleLevers();
    const reply = await this.brain.finale(s, { text: line, levers, last }, hooks);

    for (const id of reply.landed ?? []) {
      if (levers.some((l) => l.id === id)) f.landed[id] ??= f.turn;
    }
    const weight = levers.filter((l) => f.landed[l.id]).reduce((n, l) => n + l.weight, 0);
    const personal = F.personal.some((id) => f.landed[id]);
    let end = reply.end ?? null;
    // The model proposes an ending; the rules decide whether it has been earned.
    if (end === 'surrender' && !(weight >= 5 && personal)) end = weight >= 3 ? 'spare' : null;
    if (end === 'spare' && weight < 3) end = null;
    if (end === 'finish' && !last && f.turn < 3) end = null;
    if (last && !end) end = weight >= 5 && personal ? 'surrender' : weight >= 3 ? 'spare' : 'finish';
    // Whoever has already been got out of danger cannot be lost by losing the argument.
    if (end === 'finish' && check(F.safeIf, s)) end = 'spare';

    f.stance = reply.stance ?? f.stance;
    let say = reply.say;
    if (end && (reply.scripted || reply.end !== end)) say = `${say}\n\n${F.ends[end]}`;
    f.log.push({ who: 'npc', text: say, mood: f.stance });
    if (reply.turn) f.convo.push({ role: 'user', content: reply.turn }, { role: 'assistant', content: reply.raw });

    if (end) {
      f.ended = end;
      s.flags.finale_done = true;
      this.applyEffects(F.onEnd?.[end], 'finale');
      s.ending = this.computeEnding(end);
      this.emit({ type: 'ended', how: end });
      this.log('finale', { end });
    }
    return this.done({
      reply: { say, mood: f.stance, ended: !!end, degraded: !!reply.degraded },
      suggestions: this.finaleChips(),
      turnsLeft: Math.max(0, F.maxTurns - f.turn),
      ending: s.ending,
    });
  }

  computeEnding(how) {
    const s = this.requireState();
    const E = this.case.endings;
    const truths = E.truths.map((t) => ({ id: t.id, label: t.label, found: check(t.if, s) }));
    const found = truths.filter((t) => t.found).length;
    let score = (found / truths.length) * 60;
    score += E.bonus.how[how] ?? 0;
    score += E.bonus.verdict[s.verdict] ?? (s.flags.knew_killer ? E.bonus.knew : 0);
    // Puzzles: every one solved counts for a little; hints and given-away answers count against.
    const all = Object.entries(this.case.puzzles);
    const solved = all.filter(([id]) => s.puzzles[id]?.solved !== undefined).length;
    score += (solved / all.length) * 12;
    score -= Math.min(8, s.stats.hints + s.stats.puzzleHints * 0.5);
    score -= Math.min(6, s.stats.wrong + s.stats.spoiled);
    score = Math.round(clamp(score, 0, 100));
    const rank = [...E.ranks].reverse().find((r) => score >= r.min);
    return {
      how,
      outcome: E.outcomes[how],
      truths,
      score,
      rank: rank.title,
      rankLine: rank.line,
      accused: s.accusation ? { suspect: this.case.npcs[s.accusation.suspect].name, verdict: s.accusation.verdict } : null,
      puzzles: { solved, of: all.length, hints: s.stats.puzzleHints, given: s.stats.spoiled },
      ...E.extra({ state: s, how, check }),
      stats: { steps: s.steps, hints: s.stats.hints, wrong: s.stats.wrong, exchanges: s.stats.exchanges },
      text: null,
    };
  }

  async epilogue(_args = {}, hooks = {}) {
    const s = this.requireState();
    if (!s.ending) throw new GameError('The case is not closed.');
    if (!s.ending.text) s.ending.text = await this.brain.epilogue(s, s.ending, hooks);
    return this.done({ ending: s.ending });
  }

  /** Free-text notes the player keeps in the notebook. */
  async note({ text } = {}) {
    const s = this.requireState();
    s.notes = sanitizePlayerText(text, 4000);
    return this.done();
  }
}

function trim(list, max) {
  if (list.length > max) list.splice(0, list.length - max);
}

/** Run the validator once per process so a broken case file is obvious. */
let validated = false;
export function assertCaseValid() {
  if (validated) return;
  validated = true;
  const problems = validateCase(CASE);
  if (problems.length) {
    const msg = `Case file has ${problems.length} problem(s):\n  ${problems.slice(0, 20).join('\n  ')}`;
    throw new Error(msg);
  }
}

export { clone, hashString };
