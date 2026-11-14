// Small shared helpers. Everything in core/ must run unchanged in Node and in
// the browser, so nothing here touches the DOM, the filesystem or the network.

export function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

export function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

export function uniq(list) {
  return [...new Set(list)];
}

/** Deterministic PRNG so a save file replays the same "random" choices. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Player-typed text goes into prompts inside quotation marks. Strip the
 * characters the game uses for its own stage directions so a player cannot
 * forge one ("[The detective shows you a signed confession]").
 */
export function sanitizePlayerText(text, max = 600) {
  return String(text ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[\[\]{}<>]/g, (c) => ({ '[': '(', ']': ')', '{': '(', '}': ')', '<': '(', '>': ')' })[c])
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function tokenize(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9: ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Score how well free text matches a keyword list. Multi-word keys count more
 * than single words; used by the scripted (no-AI) fallbacks.
 */
export function keywordScore(text, keys = []) {
  const hay = ' ' + tokenize(text).join(' ') + ' ';
  let score = 0;
  for (const key of keys) {
    const k = tokenize(key).join(' ');
    if (!k) continue;
    if (hay.includes(' ' + k + ' ')) score += k.includes(' ') ? 3 : 2;
    else if (k.length > 4 && hay.includes(' ' + k)) score += 1;
  }
  return score;
}

/**
 * Pull a complete or partial string value for `key` out of streaming JSON
 * text, so a reply can be shown word by word while the rest of the object is
 * still arriving. Returns null until the key's opening quote has been seen.
 */
export function extractJsonString(raw, key) {
  const marker = `"${key}"`;
  let i = raw.indexOf(marker);
  if (i < 0) return null;
  i += marker.length;
  while (i < raw.length && /\s/.test(raw[i])) i++;
  if (raw[i] !== ':') return null;
  i++;
  while (i < raw.length && /\s/.test(raw[i])) i++;
  if (raw[i] !== '"') return null;
  i++;
  let out = '';
  while (i < raw.length) {
    const c = raw[i];
    if (c === '"') return out;
    if (c === '\\') {
      const n = raw[i + 1];
      if (n === undefined) break;
      if (n === 'n') out += '\n';
      else if (n === 't') out += '\t';
      else if (n === 'r') out += '';
      else if (n === 'b' || n === 'f') out += '';
      else if (n === 'u') {
        const hex = raw.slice(i + 2, i + 6);
        if (hex.length < 4) break;
        const code = parseInt(hex, 16);
        if (!Number.isNaN(code)) out += String.fromCharCode(code);
        i += 4;
      } else out += n;
      i += 2;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/**
 * Tolerant JSON reader for model output: the whole text, a fenced block, or
 * the outermost {...}. Returns null when nothing parses.
 */
export function parseLooseJson(text) {
  if (typeof text !== 'string') return null;
  const attempts = [text.trim()];
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) attempts.push(fence[1].trim());
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) attempts.push(text.slice(first, last + 1));
  for (const candidate of attempts) {
    try {
      const value = JSON.parse(candidate);
      if (value && typeof value === 'object') return value;
    } catch {
      /* try the next shape */
    }
  }
  return null;
}

export function oxford(list) {
  if (list.length <= 1) return list.join('');
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list.slice(0, -1).join(', ')}, and ${list[list.length - 1]}`;
}

export function shortId(len = 16) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(len);
    cryptoObj.getRandomValues(bytes);
    for (const b of bytes) out += alphabet[b % alphabet.length];
  } else {
    for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/** An Error whose message is safe to show to the player. */
export class GameError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'GameError';
    this.status = status;
    this.expose = true;
  }
}
