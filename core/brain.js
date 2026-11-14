// The Brain turns game situations into lines of dialogue and prose.
//
// With a live AI provider every character is improvised by Claude within the
// limits the case file sets. Without one (no credentials, or a call fails),
// each task has a scripted fallback built from the same case data, so the
// game is always completable.

import { check } from './conditions.js';
import { extractJsonString, keywordScore, parseLooseJson } from './util.js';
import { npcSystem, npcSchema, npcTurn, itemExists, itemUnlocked, laptopPrompt, thinkPrompt, letterPrompt, letterContext, finaleSystem, finaleSchema, finaleTurn, epiloguePrompt } from './prompts.js';

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
      if (out.refused || !out.text?.trim()) throw new Error(out.refused ? 'model declined' : 'empty reply');
      this.failures = 0;
      return out.text;
    } catch (err) {
      if (hooks.signal?.aborted) throw err;
      this.failures += 1;
      // After repeated failures stop trying for a while rather than making
      // the player wait on every line.
      if (this.failures >= 3) this.coolUntil = Date.now() + 90_000;
      console.warn(`[brain] AI call failed (${this.failures}): ${err?.message ?? err}`);
      return null;
    }
  }

  // ----------------------------------------------------------- characters

  async npcReply(state, id, { text, shown, react }, hooks) {
    const turn = npcTurn(this.case, id, state, { text, shown, react });
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
        return {
          say: tidy(parsed.say),
          mood: MOODS.has(parsed.mood) ? parsed.mood : 'calm',
          told: Array.isArray(parsed.told) ? parsed.told.filter((x) => typeof x === 'string') : [],
          acts: Array.isArray(parsed.acts) ? parsed.acts.filter((x) => typeof x === 'string') : [],
          turn,
          raw,
        };
      }
    }
    const scripted = this.scriptedReply(state, id, { text, shown, react });
    // Keep the transcript the model will see next time consistent.
    const raw = JSON.stringify({ say: scripted.say, mood: scripted.mood, told: scripted.told, acts: scripted.acts });
    return { ...scripted, turn, raw, degraded: !!this.ai?.describe?.().live };
  }

  scriptedReply(state, id, { text, shown, react }) {
    const npc = this.case.npcs[id];
    const st = state.npcs[id];
    const fallback = npc.fallback[st.exchanges % npc.fallback.length];
    if (shown) {
      if (react) return { say: react.line, mood: react.tells?.length ? 'shaken' : 'guarded', told: react.tells ?? [], acts: react.acts ?? [] };
      return { say: `*A glance at it, and a shake of the head.* ${fallback}`, mood: 'calm', told: [], acts: [] };
    }
    let best = null;
    let bestScore = 1;
    // A suggested question is routed straight to its subject.
    const chip = (npc.ask ?? []).find((a) => a.q === text && a.to);
    if (chip) {
      const item = npc.know.find((k) => k.id === chip.to);
      const act = (npc.acts ?? []).find((a) => a.id === chip.to);
      if (item && itemExists(item, state)) best = { item };
      else if (act && st.acts[act.id] === undefined && check(act.if, state)) best = { act };
      if (best) bestScore = Infinity;
    }
    for (const item of npc.know) {
      if (!itemExists(item, state)) continue;
      let score = keywordScore(text, item.keys);
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
      const raw = keywordScore(text, act.keys);
      const score = raw > 0 ? raw + 1.5 : 0;
      if (score > bestScore) {
        best = { act };
        bestScore = score;
      }
    }
    if (best?.act) return { say: best.act.say, mood: 'calm', told: [], acts: [best.act.id] };
    if (best?.item) {
      const item = best.item;
      const locked = (item.need || item.hide) && !check(item.if, state);
      if (locked) return { say: item.hide ?? fallback, mood: 'guarded', told: [], acts: [] };
      if (!itemUnlocked(item, st, state)) return { say: fallback, mood: 'guarded', told: [], acts: [] };
      return { say: item.line, mood: item.need ? 'shaken' : 'calm', told: [item.id], acts: [] };
    }
    return { say: fallback, mood: 'calm', told: [], acts: [] };
  }

  // ------------------------------------------------------------ HARBORNET

  async laptop(state, query, hooks) {
    if (this.live) {
      const raw = await this.call({ ...laptopPrompt(this.case, state, query), tag: 'laptop' }, hooks, 'answer');
      const parsed = raw && parseLooseJson(raw);
      if (parsed && typeof parsed.answer === 'string') {
        return { answer: tidy(parsed.answer), open: Array.isArray(parsed.open) ? parsed.open.slice(0, 3) : [] };
      }
    }
    return { ...this.scriptedLaptop(state, query), degraded: !!this.ai?.describe?.().live };
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
      return { answer: 'NO RECORD FOUND.\nTry a surname, a place, an object, or a number from the evidence.', open: [] };
    }
    const lead = top[0].rec;
    const lines = lead.body.split('\n').filter((l) => l.trim()).slice(0, 3).join('\n');
    return { answer: `${top.length} RECORD${top.length > 1 ? 'S' : ''} FOUND.\n${lead.title}\n${lines}`, open: top.map((t) => t.id) };
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
      if (text && /L\.\s*$/.test(text.trim()) && text.length > 200) return text.trim();
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
    return { ...scripted, turn, raw: JSON.stringify(scripted), degraded: !!this.ai?.describe?.().live };
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
    const end = weight >= 5 && (landed.has('name') || landed.has('father')) ? 'surrender' : null;
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
    const paras = [];
    if (ending.how === 'surrender') {
      paras.push('You brought her down ninety-one steps in her own handcuffs, and she counted them aloud. At the bottom she asked what time it was. Ten past three, you said. She nodded, as if that settled something.');
    } else if (ending.how === 'spare') {
      paras.push('The lifeboat searched the Teeth until noon and found a police cape and nothing in it. The coxswain said the set of the tide would have taken a body south. Toward Harrowgate, he said. You did not write that down.');
    } else {
      paras.push('They brought the Captain down on a hatch cover at first light. Someone had put a lantern out, and nobody could say who. Four lights for four men. The Lamplighter kept her word to the minute.');
    }
    if (state.verdict === 'fenn' && ending.how === 'finish') {
      paras.push('Tobias Fenn was still in a cell that morning, charged on your signature. It took the lawyers until Christmas to let him out. He never once asked who had put him there.');
    } else {
      paras.push("Tobias Fenn went home to Lamp Row. The sign still says '& Daughter'. Somebody saw him regilding it, slowly, with hands that would not hold still.");
    }
    paras.push(ending.truthPublic
      ? 'The Ledger ran the Calliope across six columns: the tape, the logbook, the hour the police boat turned. Thirty-one names, in full, on the front page. Milo Strand did not put his own name on it.'
      : 'The inquiry file went back in its box with a fresh seal. Officially the lamp at Marrow Point failed mechanically, and no person was culpable. You know better. Knowing is not proof.');
    const found = ending.truths.filter((t) => t.found).length;
    paras.push(found >= ending.truths.length - 1
      ? 'You missed very little. That is not always a comfort.'
      : `There were things in this case you never saw. ${ending.truths.length - found} of them, by the reckoning of the dead.`);
    paras.push(ending.how === 'finish' ? 'It is still raining in Greyhaven.' : 'That night, for the first time in twenty years, there was a light at Marrow Point.');
    return paras.join('\n\n');
  }
}

/** Models sometimes wrap a line in quotes or leave stray whitespace. */
function tidy(text) {
  let t = String(text).trim();
  if (t.length > 1 && t.startsWith('"') && t.endsWith('"') && !t.slice(1, -1).includes('"')) t = t.slice(1, -1);
  return t.replace(/\n{3,}/g, '\n\n');
}
