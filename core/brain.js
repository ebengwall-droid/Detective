// The Brain turns game situations into lines of dialogue and prose.
//
// With a live AI provider every character is improvised by Claude within the
// limits the case file sets. Without one (no credentials, or a call fails),
// each task has a scripted fallback built from the same case data, so the
// game is always completable.

import { check } from './conditions.js';
import { extractJsonString, keywordScore, parseLooseJson } from './util.js';
import { npcSystem, npcSchema, npcTurn, itemExists, itemUnlocked, laptopPrompt, thinkPrompt, letterPrompt, letterContext, finaleSystem, finaleSchema, finaleTurn, epiloguePrompt } from './prompts.js';
import { aboutness, cleanThreads, intentOf } from './talk.js';

const MOODS = new Set(['calm', 'guarded', 'nervous', 'angry', 'sad', 'shaken', 'cold', 'warm', 'amused']);

export class Brain {
  /**
   * @param {any} caseData
   * @param {{ describe: () => {live: boolean}, complete: (req: any) => Promise<{text: string, refused?: boolean}> } | null} ai
   */
  constructor(caseData, ai) {
    this.case = caseData;
    this.ai = ai;
    this.failures = 0;
    this.coolUntil = 0;
    /** The last few calls that went wrong, for the diagnostics a player can copy. */
    this.trouble = [];
    /** Why the last call fell back to the script, if it did: a short code the screen can explain. */
    this.lastFailure = null;
    this.retryMs = 1100;
  }

  get live() {
    return !!this.ai?.describe?.().live && Date.now() >= this.coolUntil;
  }

  /**
   * Call the model. Returns the text, or null if the call could not be
   * completed (the caller then uses its scripted fallback).
   * @param {any} req
   * @param {{onText?: (t: string) => void, signal?: AbortSignal}} hooks
   * @param {string|null} field when set, the reply is JSON and only this string field is streamed
   */
  async call(req, hooks = {}, field = null) {
    if (!this.live) return null;
    this.lastFailure = null;
    // One more go after a moment, but only when the provider says the failure
    // was a passing one (a dropped connection, a busy service). A refusal, a
    // usage limit or a malformed request would only fail the same way again.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const out = await this.ai.complete({
          ...req,
          signal: hooks.signal,
          onText: hooks.onText
            ? (raw) => {
                const shown = field ? extractJsonString(raw, field) : raw;
                if (shown) hooks.onText(shown);
              }
            : undefined,
        });
        if (out.refused || !out.text?.trim()) throw Object.assign(new Error(out.refused ? 'model declined' : 'empty reply'), { final: true });
        this.failures = 0;
        return out.text;
      } catch (err) {
        if (hooks.signal?.aborted) throw err;
        const code = err?.code ?? err?.status ?? null;
        this.trouble.push({ at: Date.now(), tag: req.tag ?? 'call', code: code ? String(code) : null, message: String(err?.message ?? err).slice(0, 160) });
        if (this.trouble.length > 8) this.trouble.shift();
        this.lastFailure = code ? String(code) : err?.final ? 'declined' : 'error';
        const passing = err?.transient === true && !err?.final && this.ai?.describe?.().live;
        if (attempt === 0 && passing) {
          await new Promise((resolve) => setTimeout(resolve, this.retryMs));
          if (hooks.signal?.aborted) throw err;
          continue;
        }
        this.failures += 1;
        // After repeated failures stop trying for a while rather than making
        // the player wait on every line.
        if (this.failures >= 3) this.coolUntil = Date.now() + 45_000;
        console.warn(`[brain] AI call failed (${this.failures}): ${err?.message ?? err}`);
        return null;
      }
    }
    return null;
  }

  // ----------------------------------------------------------- characters

  async npcReply(state, id, { text, shown, react, help = null }, hooks) {
    const turn = npcTurn(this.case, id, state, { text, shown, react, help });
    const st = state.npcs[id];
    if (this.live) {
      const raw = await this.call(
        {
          system: npcSystem(this.case, id, state),
          messages: [...st.convo, { role: 'user', content: turn }],
          schema: npcSchema(this.case, id, state),
          effort: 'low',
          maxTokens: 2000,
          tag: `npc:${id}`,
        },
        hooks,
        'say',
      );
      const parsed = raw && parseLooseJson(raw);
      if (parsed && typeof parsed.say === 'string' && parsed.say.trim()) {
        const say = tidy(parsed.say);
        return {
          say,
          mood: MOODS.has(parsed.mood) ? parsed.mood : 'calm',
          told: Array.isArray(parsed.told) ? parsed.told.filter((x) => typeof x === 'string') : [],
          acts: Array.isArray(parsed.acts) ? parsed.acts.filter((x) => typeof x === 'string') : [],
          threads: cleanThreads(say, parsed.threads),
          turn,
          raw,
        };
      }
    }
    const scripted = this.scriptedReply(state, id, { text, shown, react, help });
    // Keep the transcript the model will see next time consistent.
    const raw = JSON.stringify({ say: scripted.say, mood: scripted.mood, told: scripted.told, acts: scripted.acts, threads: [] });
    return { ...scripted, turn, raw, degraded: !!this.ai?.describe?.().live, why: this.why() };
  }

  /** Why a line came from the script although a model is connected: 'resting' while calls are paused after repeated failures, else the last failure's code. */
  why() {
    if (!this.ai?.describe?.().live) return null;
    if (Date.now() < this.coolUntil) return 'resting';
    return this.lastFailure ?? 'unreadable';
  }

  /**
   * A reply without a model. In order: evidence put in front of them; a
   * suggested question; a plain remark (hello, who are you, was it you, what
   * do I do); whatever they know that the words are about; and only then the
   * admission that they cannot help.
   */
  scriptedReply(state, id, { text, shown, react, help = null }) {
    const npc = this.case.npcs[id];
    const st = state.npcs[id];
    const fallback = npc.fallback[st.exchanges % npc.fallback.length];
    if (shown) {
      if (react) return { say: react.line, mood: react.tells?.length ? 'shaken' : 'guarded', told: react.tells ?? [], acts: react.acts ?? [] };
      return { say: `*A glance at it, and a shake of the head.* ${fallback}`, mood: 'calm', told: [], acts: [] };
    }
    const tell = (item) => {
      const locked = (item.need || item.hide) && !check(item.if, state);
      if (locked) return { say: item.hide ?? fallback, mood: 'guarded', told: [], acts: [] };
      if (!itemUnlocked(item, st, state)) return { say: fallback, mood: 'guarded', told: [], acts: [] };
      return { say: item.line, mood: item.need ? 'shaken' : 'calm', told: [item.id], acts: [] };
    };

    // A suggested question is routed straight to its subject.
    const chip = (npc.ask ?? []).find((a) => a.q === text && a.to);
    if (chip) {
      const item = npc.know.find((k) => k.id === chip.to);
      const act = (npc.acts ?? []).find((a) => a.id === chip.to);
      if (item && itemExists(item, state)) return tell(item);
      if (act && st.acts[act.id] === undefined && check(act.if, state)) return { say: act.say, mood: 'calm', told: [], acts: [act.id] };
    }

    // What, of the things this person knows, are the words about?
    let best = null;
    let bestScore = 1;
    const questionsTo = (to) => (npc.ask ?? []).filter((a) => a.to === to).map((a) => a.q);
    for (const item of npc.know) {
      if (!itemExists(item, state)) continue;
      let score = aboutness(text, item, questionsTo(item.id));
      // Prefer something new over repeating what has already been said.
      if (score > 0 && st.told[item.id] !== undefined) score -= 0.5;
      if (score > bestScore) {
        best = { item };
        bestScore = score;
      }
    }
    for (const act of npc.acts ?? []) {
      if (!act.keys || st.acts[act.id] !== undefined || !check(act.if, state)) continue;
      // An explicit request for a thing outranks merely mentioning its subject.
      const raw = aboutness(text, act, questionsTo(act.id));
      const score = raw > 0 ? raw + 1.5 : 0;
      if (score > bestScore) {
        best = { act };
        bestScore = score;
      }
    }

    // A plain remark gets a plain answer, unless the words are clearly about something ("hello, who pours the tea?").
    const intent = intentOf(text);
    const small = npc.small ?? {};
    // Asked for help, a guide helps, even if the words also touch on something she knows.
    if (intent && (bestScore < 3 || intent === 'accuse' || (intent === 'next' && help))) {
      let line = small[intent];
      if (intent === 'next' && npc.guide) line = this.guidance(state, help) ?? line;
      if (Array.isArray(line)) line = line[st.exchanges % line.length];
      if (typeof line === 'string' && line.startsWith('@')) {
        const item = npc.know.find((k) => k.id === line.slice(1));
        if (item && itemExists(item, state)) return tell(item);
        line = null;
      }
      if (line) {
        const mood = intent === 'accuse' ? (small.accuseMood ?? 'guarded') : st.mood ?? 'calm';
        // Pleasantries cost the detective no time.
        return { say: line, mood, told: [], acts: [], small: !['accuse', 'case', 'next'].includes(intent) };
      }
    }

    if (best?.act) return { say: best.act.say, mood: 'calm', told: [], acts: [best.act.id] };
    if (best?.item) return tell(best.item);
    return { say: fallback, mood: 'calm', told: [], acts: [], lost: true };
  }

  /** What the detective's partner says to "what should I do?": the freshest open objective, in plain words. */
  /** What a guide says when asked for help: the hint the engine has taken, or the first hint for the newest thread. */
  guidance(state, help = null) {
    const lead = this.case.prompts?.guideLead ?? ['If it were me?', "Here's what I'd do."];
    if (help) return `${lead[state.steps % lead.length]} ${help.hint}`;
    const open = this.case.objectives.filter((o) => state.objectives[o.id]?.seen !== undefined && state.objectives[o.id]?.done === undefined);
    const target = open.sort((a, b) => state.objectives[b.id].seen - state.objectives[a.id].seen)[0];
    if (!target) return null;
    return `${lead[state.steps % lead.length]} ${target.hints?.[0] ?? target.text}`;
  }

  // ------------------------------------------------------- the reference desk

  async laptop(state, query, hooks) {
    if (this.live) {
      const raw = await this.call({ ...laptopPrompt(this.case, state, query), tag: 'laptop' }, hooks, 'answer');
      const parsed = raw && parseLooseJson(raw);
      if (parsed && typeof parsed.answer === 'string') {
        return { answer: tidy(parsed.answer), open: Array.isArray(parsed.open) ? parsed.open.slice(0, 3) : [] };
      }
    }
    return { ...this.scriptedLaptop(state, query), degraded: !!this.ai?.describe?.().live, why: this.why() };
  }

  scriptedLaptop(state, query) {
    const scored = [];
    for (const [id, rec] of Object.entries(this.case.records)) {
      if (!check(rec.if, state)) continue;
      const score = keywordScore(query, rec.keys) + keywordScore(query, rec.title.split(/[^A-Za-z0-9-]+/).filter((w) => w.length > 3)) * 0.5;
      if (score >= 2) scored.push({ id, rec, score });
    }
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, scored.length > 1 && scored[1].score >= scored[0].score * 0.7 ? 2 : 1);
    if (!top.length) {
      return { answer: this.case.laptop.none, open: [] };
    }
    // The cards themselves open under the answer, so the answer need not list them.
    return { answer: this.case.laptop.found(top.length), open: top.map((t) => t.id) };
  }

  // ---------------------------------------------------------- inner voice

  async think(state, objective, tier, hooks) {
    if (this.live) {
      const text = await this.call({ ...thinkPrompt(this.case, state, objective, tier), tag: 'think' }, hooks);
      if (text) return tidy(text);
    }
    return objective.hints[tier];
  }

  // -------------------------------------------------------------- letters

  async letter(state, n, hooks) {
    if (this.live) {
      const text = await this.call({ ...letterPrompt(this.case, state, n), tag: 'letter' }, hooks);
      if (text && text.trim().endsWith(this.case.director.signs) && text.length > 200) return text.trim();
    }
    const ctx = letterContext(this.case, state);
    return this.case.director.letters[n].fallback({ did: ctx.did[0], missed: ctx.missed[0] }).replace(/\n{3,}/g, '\n\n').trim();
  }

  // --------------------------------------------------------------- finale

  async finale(state, { text, levers, last }, hooks) {
    const turn = finaleTurn(this.case, state, { text, levers, last });
    if (this.live) {
      const raw = await this.call(
        { system: finaleSystem(this.case, state), messages: [...state.finale.convo, { role: 'user', content: turn }], schema: finaleSchema(this.case), effort: 'medium', maxTokens: 3000, tag: 'finale' },
        hooks,
        'say',
      );
      const parsed = raw && parseLooseJson(raw);
      if (parsed && typeof parsed.say === 'string' && parsed.say.trim()) {
        return {
          say: tidy(parsed.say),
          stance: ['cold', 'listening', 'wavering', 'breaking'].includes(parsed.stance) ? parsed.stance : 'cold',
          landed: Array.isArray(parsed.landed) ? parsed.landed : [],
          end: ['surrender', 'spare', 'finish'].includes(parsed.end) ? parsed.end : null,
          turn,
          raw,
        };
      }
    }
    const scripted = this.scriptedFinale(state, { text, levers });
    return { ...scripted, turn, raw: JSON.stringify(scripted), degraded: !!this.ai?.describe?.().live, why: this.why() };
  }

  scriptedFinale(state, { text, levers }) {
    const f = state.finale;
    const hits = levers
      .filter((l) => !f.landed[l.id])
      .map((l) => ({ l, score: keywordScore(text, l.keys) + (text.trim().toLowerCase() === l.chip.toLowerCase() ? 10 : 0) }))
      .filter((h) => h.score >= 2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
    if (!hits.length) {
      const cold = this.case.finale.cold;
      return { say: cold[f.turn % cold.length], stance: f.stance, landed: [], end: null, scripted: true };
    }
    const landed = new Set([...Object.keys(f.landed), ...hits.map((h) => h.l.id)]);
    const weight = levers.filter((l) => landed.has(l.id)).reduce((n, l) => n + l.weight, 0);
    const stance = landed.size >= 3 ? 'breaking' : landed.size === 2 ? 'wavering' : 'listening';
    // Enough has landed: she does not need to be asked again.
    const end = weight >= 5 && this.case.finale.personal.some((id) => landed.has(id)) ? 'surrender' : null;
    return { say: hits.map((h) => h.l.reply).join('\n\n'), stance, landed: hits.map((h) => h.l.id), end, scripted: true };
  }

  // ------------------------------------------------------------- epilogue

  async epilogue(state, ending, hooks) {
    if (this.live) {
      const text = await this.call({ ...epiloguePrompt(this.case, state, ending), tag: 'epilogue' }, hooks);
      if (text && text.length > 300) return text.trim();
    }
    return this.scriptedEpilogue(state, ending);
  }

  scriptedEpilogue(state, ending) {
    return this.case.endings.scripted({ state, ending, check }).join('\n\n');
  }
}

/** Models sometimes wrap a line in quotes or leave stray whitespace. */
function tidy(text) {
  let t = String(text).trim();
  if (t.length > 1 && t.startsWith('"') && t.endsWith('"') && !t.slice(1, -1).includes('"')) t = t.slice(1, -1);
  return t.replace(/\n{3,}/g, '\n\n');
}
