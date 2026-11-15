// Understanding the detective without a model: what kind of remark was that,
// which of the things this person knows is it about, and which words in a
// reply are threads the detective could pull next.
//
// Claude does all of this better when it is answering. This is what keeps a
// conversation coherent when it is not: the scripted game, a declined
// permission, a call that failed.

import { check } from './conditions.js';
import { keywordScore, tokenize } from './util.js';

/** Words that carry no subject. */
const STOP = new Set(
  'a an the is are was were be been am do does did done you your yours me my mine i to of in on at it its that this these those and or for with about what whats who whos how why when where which tell say said can could would should will shall may might please so there any some know think well then them they he she his her him us we our from by as if but not no yes up out get got go going just really here one ever still also too very much many more most over again more'.split(' '),
);

/** Different words for the same thing, folded onto one. */
const SAME = {
  died: 'dead', die: 'dead', death: 'dead', deaths: 'dead', killed: 'dead', kill: 'dead', killing: 'dead', murder: 'dead', murdered: 'dead', murders: 'dead', body: 'dead', corpse: 'dead', victim: 'dead', victims: 'dead',
  poisoned: 'poison', poisoning: 'poison', foxgloves: 'foxglove', digitalis: 'foxglove',
  locked: 'lock', locks: 'lock', letterlock: 'lock',
  letters: 'letter', note: 'letter', notes: 'letter',
  papers: 'paper',
  selling: 'sale', sell: 'sale', sold: 'sale', buyer: 'sale', buyers: 'sale',
  clocks: 'clock', watches: 'clock',
  mum: 'mother', mom: 'mother',
  gran: 'grandmother', granny: 'grandmother', nan: 'grandmother',
  boss: 'warden',
  cops: 'police', copper: 'police',
  helped: 'save', rescue: 'save', rescued: 'save', saved: 'save', saving: 'save', cure: 'save', cured: 'save', antidote: 'save', treated: 'save', treatment: 'save', survive: 'save', survived: 'save',
  enemies: 'enemy', hated: 'enemy', grudge: 'enemy', motive: 'enemy',
  robot: 'automaton', machine: 'engine',
  ai: 'engine', computer: 'engine', lectern: 'engine',
  crossword: 'crossword', crosswords: 'crossword', puzzle: 'puzzle', puzzles: 'puzzle', cipher: 'cipher', ciphers: 'cipher', code: 'cipher', codes: 'cipher',
};

function stem(word) {
  let w = word;
  if (SAME[w]) return SAME[w];
  if (w.length > 4 && w.endsWith('ies')) w = `${w.slice(0, -3)}y`;
  else if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
  if (SAME[w]) return SAME[w];
  // "save" and "saved", "poison" and "poisons" should meet.
  return w.length > 3 && w.endsWith('e') ? w.slice(0, -1) : w;
}

/** The words of a remark that are about something. */
export function subjects(text) {
  return tokenize(text)
    .map((w) => w.replace(/:+$/, ''))
    .filter((w) => w && !STOP.has(w))
    .map(stem);
}

const INTENTS = [
  // Ordered: the first that fits wins.
  ['accuse', /\b(did|was it|is it|were) you\b[^?.!]*\b(kill|murder|poison|do it|did it|the (killer|murderer|invigilator|one))|\byou (killed|murdered|poisoned|did it|did this|are the (killer|murderer|invigilator))\b|\bit was you\b|\byou('re| are) lying\b/],
  ['hello', /^(hi+|hello+|hey+|hiya|howdy|yo|good (morning|afternoon|evening|day)|greetings|morning|evening|afternoon)\b[\s!.,]*(there|detective|kit|sir|madam|ma'?am|miss|mate|again)?[\s!.,]*$/],
  ['who', /\b(who are you|who (r|are) u|your name|whats your name|what is your name|what do you do|what is your (job|role|work)|whats your (job|role)|introduce yourself|and you are|who am i (talking|speaking) to|tell me about yourself|how long have you (worked|been|lived)|how many years)\b/],
  ['how', /\b(how are you|how r u|how (are|re) you (feeling|doing|holding up|keeping|bearing up)|how do you feel|are you (ok|okay|alright|all right|well)|you (ok|okay|alright|all right)|how is it going|hows it going|how have you been)\b/],
  ['thanks', /^(thanks|thank you|thankyou|thx|ty|cheers|much obliged|ta|appreciated?|thanks a lot|thank you very much)\b[^?]*$/],
  ['bye', /^(bye|goodbye|good bye|see you|see ya|later|farewell|that'?s all|that is all|nothing else|no more questions|i'?ll go|i'?m done|i am done|i must go|i have to go|good night|goodnight)\b[^?]*$/],
  ['next', /\b(what (should|do|can|shall|must) (i|we) do|what now|what next|whats next|what is next|where (should|do|shall|can) (i|we) (go|start|begin|look)|where to (now|next)|i'?m (stuck|lost)|i am (stuck|lost)|any (advice|ideas|tips|hints?)|give me a hint|a hint|help me|what am i (supposed|meant) to do|how do i (start|begin|play))\b|^(help|hint|advice)\W*$/],
  ['ack', /^(ok+|okay|k|kk|right|alright|all right|i see|sure|fine|yes|yeah|yep|yup|no|nope|nah|h+m+|uh+|um+|oh+|ah+|wow|really|interesting|got it|understood|noted|go on|carry on|continue|and|so|cool|nice|good|great|fair enough|true|maybe|perhaps|whatever|never mind|nevermind|nothing|\.+|\?+)[\s!.,?]*$/],
  ['case', /\b(who (died|is dead|was killed|got killed|was murdered|is the victim)|what happened|whats going on|what is going on|what'?s happening|what is happening|what is this about|the (murder|murders|deaths?|killings?|case|crime)|tell me (everything|what you know|what happened|what you saw|about (it|the case|the murder|the death))|how did (he|she|they) die|who is dead|what did you (see|hear|find|notice)|what do you (know|think happened|make of it|reckon)|when did you find|what can you tell me)\b/],
];

/**
 * What kind of remark is this, apart from its subject?
 * @returns {'accuse'|'hello'|'who'|'how'|'thanks'|'bye'|'next'|'ack'|'case'|null}
 */
export function intentOf(text) {
  const plain = String(text ?? '')
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[^a-z0-9'?!., ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return null;
  for (const [name, re] of INTENTS) if (re.test(plain) || re.test(plain.replace(/'/g, ''))) return name;
  return null;
}

/**
 * How strongly a remark is about one thing a character knows.
 * The item's own keywords count most; the wording of the suggested question
 * that leads to it counts too, so a paraphrase of a suggestion still lands.
 * @param {string} text
 * @param {{keys?: string[]}} item
 * @param {string[]} [questions] suggested questions that lead to this item
 */
export function aboutness(text, item, questions = []) {
  let score = keywordScore(text, item.keys);
  const said = new Set(subjects(text));
  if (!said.size) return score;
  const keyWords = new Set((item.keys ?? []).flatMap((k) => subjects(k)));
  const askWords = new Set(questions.flatMap((q) => subjects(q)));
  for (const w of said) {
    if (w.length < 3) continue;
    if (keyWords.has(w)) score += 1.2;
    else if (askWords.has(w)) score += 0.9;
  }
  return score;
}

/** Keys too ordinary to be worth underlining in somebody's speech. */
const DULL = new Set('how help next work time late four word lock map paper letter chair back made here this that what where when who why they them tell said like just'.split(' '));

/**
 * Threads: places in a spoken line where the detective could pull.
 * Each is a phrase that actually occurs in the line and the question it leads to.
 * @param {string} line what was said
 * @param {Array<{q: string, keys: string[]}>} leads questions still worth asking, with the keywords of what they lead to
 * @param {number} [max]
 * @returns {Array<{on: string, ask: string}>}
 */
export function threadsIn(line, leads, max = 3) {
  const text = String(line ?? '');
  const lower = text.toLowerCase();
  const taken = [];
  const out = [];
  for (const lead of leads) {
    if (out.length >= max) break;
    const keys = [...(lead.keys ?? [])].filter((k) => k.length >= 4 && !DULL.has(k.toLowerCase())).sort((a, b) => b.length - a.length);
    let hit = null;
    for (const key of keys) {
      const k = key.toLowerCase();
      let from = 0;
      for (;;) {
        const i = lower.indexOf(k, from);
        if (i < 0) break;
        // Start on a word boundary, and take the whole word the key begins ("clock" finds "clocks").
        const startsWord = i === 0 || !/[a-z0-9]/.test(lower[i - 1]);
        let j = i + k.length;
        while (j < lower.length && /[a-z0-9'’-]/.test(lower[j])) j++;
        const inAside = insideAsterisks(text, i);
        if (startsWord && j - (i + k.length) <= 3 && !inAside && !taken.some(([a, b]) => i < b && j > a)) {
          hit = [i, j];
          break;
        }
        from = i + 1;
      }
      if (hit) break;
    }
    if (hit) {
      taken.push(hit);
      out.push({ on: text.slice(hit[0], hit[1]).replace(/[’']s$/i, ''), ask: lead.q });
    }
  }
  return out;
}

function insideAsterisks(text, index) {
  let open = false;
  for (let i = 0; i < index; i++) if (text[i] === '*') open = !open;
  return open;
}

/**
 * The questions a character could still usefully be asked, each with the
 * keywords of what it leads to. Used for thread-finding and for the model's brief.
 */
export function openLeads(npc, npcState, state) {
  const out = [];
  for (const a of npc.ask ?? []) {
    if (!check(a.if, state) || npcState?.asked?.[a.q]) continue;
    const item = npc.know.find((k) => k.id === a.to);
    const act = (npc.acts ?? []).find((x) => x.id === a.to);
    if (item && npcState?.told?.[item.id] !== undefined) continue;
    if (act && npcState?.acts?.[act.id] !== undefined) continue;
    out.push({ q: a.q, to: a.to, keys: item?.keys ?? act?.keys ?? [] });
  }
  return out;
}

/**
 * Check threads a model proposed: each must quote the line exactly and ask
 * something short. Anything else is dropped rather than shown broken.
 */
export function cleanThreads(line, threads, max = 3) {
  const out = [];
  const text = String(line ?? '');
  for (const t of Array.isArray(threads) ? threads : []) {
    if (out.length >= max) break;
    const on = typeof t?.on === 'string' ? t.on.trim() : '';
    const ask = typeof t?.ask === 'string' ? t.ask.trim().replace(/\s+/g, ' ') : '';
    if (on.length < 3 || on.length > 40 || ask.length < 3 || ask.length > 90) continue;
    if (!text.includes(on) || insideAsterisks(text, text.indexOf(on))) continue;
    if (out.some((o) => o.on === on || o.ask.toLowerCase() === ask.toLowerCase() || o.on.includes(on) || on.includes(o.on))) continue;
    out.push({ on, ask });
  }
  return out;
}
