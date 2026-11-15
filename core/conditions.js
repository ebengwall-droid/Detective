// The tiny rule language the case file is written in.
//
// A condition is one of:
//   true / false
//   'fact:x'  'ev:x'  'flag:x'  'ded:x'  'rec:x'  'lab:x' (result back)  'sent:x' (submitted)  'beat:x'
//   'visited:loc'  'examined:hotspot'  'met:npc'  'told:npc.item'  'shown:npc.ev'
//   'puz:x' (puzzle solved)  'puzopen:x' (puzzle open to the detective)  'job:x' (a requested job has come back)
//   'act:2'  'act>=2'  'act<=3'      (prefix any of these with ! to negate)
//   [a, b, c]                         all of
//   { any: [...] }  { all: [...] }  { not: c }  { min: n, of: [...] }
//   { stepsSince: 'flagOrBeat', n }   true once n steps have passed since it was set

/**
 * @param {any} cond
 * @param {import('./engine.js').GameState} s
 * @returns {boolean}
 */
export function check(cond, s) {
  if (cond === undefined || cond === null || cond === true) return true;
  if (cond === false) return false;
  if (typeof cond === 'string') return checkAtom(cond, s);
  if (Array.isArray(cond)) return cond.every((c) => check(c, s));
  if (typeof cond === 'object') {
    if ('all' in cond) return cond.all.every((c) => check(c, s));
    if ('any' in cond) return cond.any.some((c) => check(c, s));
    if ('not' in cond) return !check(cond.not, s);
    if ('min' in cond) return cond.of.filter((c) => check(c, s)).length >= cond.min;
    if ('stepsSince' in cond) {
      const at = s.marks[cond.stepsSince];
      return at !== undefined && s.steps - at >= cond.n;
    }
  }
  throw new Error(`Bad condition: ${JSON.stringify(cond)}`);
}

function checkAtom(atom, s) {
  if (atom.startsWith('!')) return !checkAtom(atom.slice(1), s);
  const cmp = atom.match(/^act(>=|<=|>|<|=|:)(\d+)$/);
  if (cmp) {
    const n = Number(cmp[2]);
    switch (cmp[1]) {
      case '>=': return s.act >= n;
      case '<=': return s.act <= n;
      case '>': return s.act > n;
      case '<': return s.act < n;
      default: return s.act === n;
    }
  }
  const i = atom.indexOf(':');
  if (i < 0) throw new Error(`Bad condition atom: ${atom}`);
  const kind = atom.slice(0, i);
  const id = atom.slice(i + 1);
  switch (kind) {
    case 'fact': return id in s.facts;
    case 'ev': return id in s.evidence;
    case 'flag': return !!s.flags[id];
    case 'ded': return !!s.deductions[id]?.solved;
    case 'rec': return id in s.records;
    case 'lab': return s.evidence[id]?.lab === 'done';
    case 'sent': return !!s.evidence[id] && s.evidence[id].lab !== 'none';
    case 'beat': return id in s.beats;
    case 'visited': return (s.visited[id] ?? 0) > 0;
    case 'examined': return Object.keys(s.examined).some((k) => k === id || k.startsWith(id + '#'));
    case 'met': return !!s.npcs[id]?.met;
    case 'told': {
      const [npc, item] = id.split('.');
      return !!s.npcs[npc]?.told?.[item];
    }
    case 'shown': {
      const [npc, ev] = id.split('.');
      return !!s.npcs[npc]?.shown?.[ev];
    }
    case 'job': return !!s.jobsDone[id];
    case 'puz': return s.puzzles?.[id]?.solved !== undefined;
    case 'puzopen': return s.puzzles?.[id]?.open !== undefined;
    default: throw new Error(`Unknown condition kind: ${atom}`);
  }
}

/** List every id a condition mentions, for the case-file validator. */
export function conditionRefs(cond, out = []) {
  if (cond === undefined || cond === null || typeof cond === 'boolean') return out;
  if (typeof cond === 'string') {
    const atom = cond.replace(/^!/, '');
    if (!/^act/.test(atom)) out.push(atom);
    return out;
  }
  if (Array.isArray(cond)) {
    for (const c of cond) conditionRefs(c, out);
    return out;
  }
  if (cond.all) conditionRefs(cond.all, out);
  if (cond.any) conditionRefs(cond.any, out);
  if (cond.not !== undefined) conditionRefs(cond.not, out);
  if (cond.of) conditionRefs(cond.of, out);
  return out;
}
