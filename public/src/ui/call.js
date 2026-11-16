// A video call with Milo Hart, the tech at Ravel CID, from the Lectern. You show him what
// you have found (a puzzle you have open) or ask him to look something up; he recognises
// it in one line, searches it, and the how-to plays: a short animated film and a try-it.
// Then one tip. Nothing to read but what he says.

import { el, icon } from './dom.js';
import { mountDemo, hasDemo } from './demo-player.js';
import { drawLesson } from './lessons.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}, ...kids) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  for (const c of kids) if (c) n.append(c);
  return n;
};

/** Milo, drawn: dark curls, round glasses, a headset, a teal hoodie. */
function face() {
  const mouth = sv('ellipse', { cx: 50, cy: 62, rx: 5, ry: 2.2, fill: '#5a2a1e', class: 'call-mouth' });
  return sv(
    'svg',
    { viewBox: '0 0 100 100', class: 'call-face', 'aria-hidden': 'true' },
    sv('circle', { cx: 50, cy: 50, r: 50, fill: '#24485a' }),
    sv('path', { d: 'M14 100 C16 80 30 72 50 72 C70 72 84 80 86 100 Z', fill: '#2f8a86' }),
    sv('path', { d: 'M34 76 C38 86 62 86 66 76', fill: 'none', stroke: '#236b68', 'stroke-width': 3 }),
    sv('rect', { x: 43, y: 62, width: 14, height: 14, rx: 5, fill: '#a86f4a' }),
    sv('circle', { cx: 30, cy: 47, r: 5, fill: '#a86f4a' }),
    sv('circle', { cx: 70, cy: 47, r: 5, fill: '#a86f4a' }),
    sv('ellipse', { cx: 50, cy: 46, rx: 19, ry: 22, fill: '#b47a52' }),
    sv('path', { d: 'M30 42 C28 24 40 16 50 17 C62 16 74 24 70 42 C66 34 60 30 52 31 C44 30 36 33 30 42 Z', fill: '#1f1a17' }),
    sv('circle', { cx: 36, cy: 26, r: 5, fill: '#1f1a17' }),
    sv('circle', { cx: 45, cy: 21, r: 5.5, fill: '#1f1a17' }),
    sv('circle', { cx: 56, cy: 20, r: 5.5, fill: '#1f1a17' }),
    sv('circle', { cx: 65, cy: 25, r: 5, fill: '#1f1a17' }),
    sv('circle', { cx: 42, cy: 47, r: 6.2, fill: 'rgba(255,255,255,0.18)', stroke: '#1b1b1b', 'stroke-width': 1.8 }),
    sv('circle', { cx: 58, cy: 47, r: 6.2, fill: 'rgba(255,255,255,0.18)', stroke: '#1b1b1b', 'stroke-width': 1.8 }),
    sv('path', { d: 'M48 47 H52', stroke: '#1b1b1b', 'stroke-width': 1.8 }),
    sv('circle', { cx: 42, cy: 47.5, r: 1.7, fill: '#1b1b1b', class: 'call-eye' }),
    sv('circle', { cx: 58, cy: 47.5, r: 1.7, fill: '#1b1b1b', class: 'call-eye' }),
    mouth,
    sv('path', { d: 'M27 46 C27 16 73 16 73 46', fill: 'none', stroke: '#2b2b2b', 'stroke-width': 3.2, 'stroke-linecap': 'round' }),
    sv('rect', { x: 23, y: 42, width: 8, height: 13, rx: 3, fill: '#2b2b2b' }),
    sv('path', { d: 'M27 55 C28 64 34 66 43 64', fill: 'none', stroke: '#2b2b2b', 'stroke-width': 2, 'stroke-linecap': 'round' }),
    sv('circle', { cx: 44, cy: 64, r: 2.2, fill: '#2b2b2b' }),
  );
}

/**
 * The call, built once and kept while the Lectern is open.
 * @param {any} game
 */
export function createCall(game) {
  const tech = () => game.view.techie;
  let state = 'idle';
  let said = 0;
  let started = 0;
  let clock = null;
  let demo = null;
  let token = 0; // bumps on hang-up, so anything still talking or searching stops
  const pick = (list) => list[said++ % list.length];

  const time = el('span', { class: 'call-time' });
  const end = el('button', { class: 'call-btn end', type: 'button', 'aria-label': 'Hang up', onClick: () => hangUp() }, icon('phone', 22));
  const avatar = el('div', { class: 'call-avatar' }, el('div', { class: 'call-rings' }, el('i'), el('i'), el('i')), face());
  const head = el('div', { class: 'call-head' }, avatar, el('div', { class: 'call-who' }, el('div', { class: 'call-name', text: tech().name }), el('div', { class: 'call-role' }, el('span', { text: tech().role }), time)), end);
  const say = el('div', { class: 'call-say', role: 'status', 'aria-live': 'polite' });
  const stage = el('div', { class: 'call-stage' });
  const choices = el('div', { class: 'call-pick' });
  const root = el('div', { class: 'call idle' }, head, say, stage, choices);

  const setState = (s) => {
    state = s;
    root.className = `call ${s}`;
  };
  const tick = () => {
    const sec = Math.floor((Date.now() - started) / 1000);
    time.textContent = ` · ${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  };
  const clearStage = () => {
    demo?.dispose();
    demo = null;
    stage.replaceChildren();
  };

  /** Milo says a line: typed out while his mouth moves. A tap on it finishes it. */
  async function speak(text) {
    const me = token;
    root.classList.add('talking');
    say.textContent = '';
    if (still()) say.textContent = text;
    else {
      let done = false;
      const finish = () => (done = true);
      say.addEventListener('click', finish, { once: true });
      for (let i = 1; i <= text.length && !done; i++) {
        if (me !== token) return false;
        say.textContent = text.slice(0, i);
        if (i % 4 === 0) game.audio.typeKey?.();
        await wait(text[i - 1] === '.' || text[i - 1] === '?' ? 160 : 22);
      }
      say.textContent = text;
    }
    root.classList.remove('talking');
    if (me !== token) return false;
    await wait(250);
    return me === token;
  }

  /** The search box on his screen: the query typed in, then the bar fills. */
  async function search(query) {
    const me = token;
    const q = el('span', { class: 'call-q' });
    const bar = el('i', { class: 'call-bar' });
    clearStage();
    stage.append(el('div', { class: 'call-search' }, el('span', { class: 'call-spark', 'aria-hidden': 'true', text: '✦' }), q, el('span', { class: 'call-caret' })), el('div', { class: 'call-progress' }, bar));
    for (let i = 1; i <= query.length; i++) {
      if (me !== token) return false;
      q.textContent = query.slice(0, i);
      if (i % 3 === 0) game.audio.typeKey?.();
      await wait(still() ? 0 : 34);
    }
    requestAnimationFrame(() => bar.classList.add('go'));
    await wait(still() ? 150 : 950);
    return me === token;
  }

  function buttons(...list) {
    choices.replaceChildren(el('div', { class: 'call-row' }, list.map(([text, fn, solid]) => el('button', { class: `btn ${solid ? 'solid' : ''} call-act`, type: 'button', text, onClick: fn }))));
    seen(choices);
  }

  /** Bring something new on the call into view, without jumping past what is above it. */
  const seen = (node) => requestAnimationFrame(() => node.scrollIntoView?.({ block: 'nearest', behavior: still() ? 'auto' : 'smooth' }));

  /** What to tell him about: the puzzles open now, things to look up, or anything typed. */
  function menu() {
    clearStage();
    // The view lists open puzzles newest first.
    const open = game.view.puzzles.filter((p) => !p.solved && p.lessonId).slice(0, 6);
    const lookups = game.view.laptopHints ?? [];
    const input = el('input', { class: 'field call-input', type: 'text', placeholder: 'Or type what it is…', autocomplete: 'off', enterkeyhint: 'send', maxlength: '120', 'aria-label': 'Tell Milo what it is' });
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
    });
    const form = el('form', { class: 'call-ask' }, input, el('button', { class: 'btn solid call-send', type: 'submit', 'aria-label': 'Send' }, icon('send', 18)));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (q) lookUp(q);
    });
    choices.replaceChildren(
      open.length ? el('div', { class: 'call-sec', text: 'Show him what you found' }) : null,
      open.length ? el('div', { class: 'call-chips' }, open.map((p) => el('button', { class: 'call-chip found', type: 'button', onClick: () => explain(p.lessonId, p.title) }, icon('token', 16), el('span', { text: p.title })))) : null,
      lookups.length ? el('div', { class: 'call-sec', text: 'Or ask him to look up' }) : null,
      lookups.length ? el('div', { class: 'call-chips' }, lookups.map((q) => el('button', { class: 'call-chip', type: 'button', onClick: () => lookUp(q) }, icon('laptop', 16), el('span', { text: q })))) : null,
      form,
    );
  }

  function afterwards() {
    buttons(['Something else', () => menuAgain(), true], ['Thanks, Milo', () => hangUp()]);
  }

  async function menuAgain() {
    clearStage();
    choices.replaceChildren();
    if (await speak(tech().more)) menu();
  }

  /** Show a method: he knows it, searches it, the how-to plays, then a tip. */
  async function explain(lesson, about = null) {
    const L = tech().lessons?.[lesson];
    choices.replaceChildren();
    clearStage();
    if (!(await speak(L?.heard ?? pick(tech().search)))) return;
    if (!(await search(tech().query.replace('{name}', L?.name ?? lesson)))) return;
    // The card is kept under Cards, as if the Lectern had been asked.
    game.call('laptopAsk', { query: about ? `How is “${about}” done?` : L?.name ?? lesson, lesson }).catch(() => {});
    show(lesson, L);
  }

  /** The lesson's whole card, folded under the how-to: some puzzles need its details. */
  function cardBelow(lesson) {
    const rec = game.view.records.find((r) => r.id === `l_${lesson}`);
    if (!rec || stage.querySelector('.call-more')) return;
    const [first, ...rest] = rec.body.split('\n');
    const body = first === first.toUpperCase() && rest.length ? rest.join('\n') : rec.body;
    stage.append(el('details', { class: 'rec-more call-more' }, el('summary', { text: 'Read the card' }), el('div', { class: 'rec-body', text: body })));
  }

  function show(lesson, L) {
    clearStage();
    let ended = false;
    const onEnd = async () => {
      if (ended) return;
      ended = true;
      const me = token;
      if (L?.tip) await speak(L.tip);
      if (me !== token) return;
      cardBelow(lesson);
      afterwards();
    };
    if (hasDemo(lesson)) {
      demo = mountDemo(stage, lesson, { audio: game.audio, onEnd });
      seen(stage);
    } else {
      // No film for this one yet: the lesson's picture and its few sentences.
      const rec = game.view.records.find((r) => r.id === `l_${lesson}`);
      const pic = rec?.pic ? drawLesson(rec.pic) : null;
      stage.append(el('div', { class: 'call-card' }, pic ? el('div', { class: 'call-pic' }, pic.svg) : null, rec ? el('p', { text: rec.short ?? rec.body }) : null));
      onEnd();
    }
  }

  /** Look something up in the Lectern's records, for him to read off. */
  async function lookUp(query) {
    choices.replaceChildren();
    clearStage();
    if (!(await speak(pick(tech().lookup)))) return;
    if (!(await search(query))) return;
    const me = token;
    let res = null;
    try {
      res = await game.call('laptopAsk', { query });
    } catch {
      res = null;
    }
    if (me !== token) return;
    const live = res && !res.degraded && res.answer && game.view.ai?.live;
    // A short line in his voice when the Lectern's machine wrote one; never a page of it.
    const line = live ? res.answer.split(/(?<=[.?!])\s+/).slice(0, 2).join(' ') : null;
    const lesson = (res?.opened ?? []).map((id) => id.replace(/^l_/, '')).find((id) => hasDemo(id));
    if (lesson) {
      const L = tech().lessons?.[lesson];
      if (line ? await speak(line) : await speak(L?.heard ?? tech().found)) show(lesson, L);
      return;
    }
    const recs = (res?.opened ?? []).map((id) => game.view.records.find((r) => r.id === id)).filter(Boolean);
    if (recs.length) {
      stage.append(
        el(
          'div',
          { class: 'call-cards' },
          recs.slice(0, 2).map((r) => {
            const pic = r.pic ? drawLesson(r.pic) : null;
            return el('div', { class: 'call-card' }, el('div', { class: 'call-card-title', text: r.title.replace(/^Lecture · /, '') }), pic ? el('div', { class: 'call-pic' }, pic.svg) : null, el('p', { text: r.short ?? r.body }));
          }),
        ),
      );
      if (await speak(line ?? tech().found)) afterwards();
      return;
    }
    if (await speak(line ?? tech().none)) afterwards();
  }

  /** Ring him; when he answers, say hello, then do `then` or offer the menu. */
  async function dial(then = null) {
    const me = ++token;
    setState('ringing');
    say.textContent = `Calling ${tech().name.split(' ')[0]}…`;
    clearStage();
    choices.replaceChildren();
    game.audio.ring?.();
    await wait(still() ? 300 : 900);
    if (me !== token) return;
    game.audio.ring?.();
    await wait(still() ? 200 : 900);
    if (me !== token) return;
    setState('on');
    started = Date.now();
    tick();
    clearInterval(clock);
    clock = setInterval(tick, 1000);
    const first = !game.settings.metMilo;
    if (first) game.setSetting('metMilo', true);
    if (!(await speak(first ? tech().first : pick(tech().hello)))) return;
    if (then) then();
    else menu();
  }

  function hangUp(quiet = false) {
    token++;
    clearInterval(clock);
    clock = null;
    clearStage();
    if (state === 'on' || state === 'ringing') {
      if (!quiet) game.audio.hangUp?.();
      const sec = started ? Math.floor((Date.now() - started) / 1000) : 0;
      say.textContent = state === 'on' && !quiet ? `${pick(tech().bye)} · Call ended, ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : '';
    }
    setState('idle');
    idle();
  }

  function idle() {
    if (!say.textContent) say.textContent = `Stuck? ${tech().name.split(' ')[0]}, the tech at Ravel CID, will show you how it works.`;
    time.textContent = '';
    choices.replaceChildren(el('div', { class: 'call-row' }, el('button', { class: 'btn solid call-go', type: 'button', onClick: () => dial() }, icon('phone', 18), `Call ${tech().name.split(' ')[0]}`)));
  }

  idle();

  return {
    el: root,
    get state() {
      return state;
    },
    /** Call about a method straight away (from a puzzle), or about something typed. */
    start({ lesson = null, about = null, query = null } = {}) {
      const go = () => (lesson ? explain(lesson, about) : query ? lookUp(query) : menu());
      if (state === 'on') {
        token++;
        go();
      } else dial(go);
    },
    hangUp: () => hangUp(true),
  };
}
