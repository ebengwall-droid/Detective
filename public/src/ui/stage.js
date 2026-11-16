// The puzzle stage: a puzzle as the thing itself, close up, to handle.
//
// Every puzzle opens as its object (a lock, a cipher wheel, a chessboard, a
// tray of tiles) with one line saying what to do, and is solved by handling
// it. What the thing is and where it came from waits behind the ? button;
// hints wait behind the bulb. When it is solved, what it meant slides up over
// it. The game core checks every answer: nothing here knows one.

import { el, add, icon, leave, prose } from './dom.js';
import { drawWriting } from './writing.js';
import { enlargePicture } from './guide.js';
import { confirmCard } from './hud.js';
import { ringRow } from './lock.js';
import { KINDS } from './stage-kinds.js';
import { normalise } from '../../../core/ciphers.js';

const SETTERS = { invigilator: 'Set by the Invigilator', fold: "The Fold's own", hesper: 'Dame Hesper' };

/**
 * Open a puzzle on the stage. Resolves when it is put down, with what to do next, if anything.
 * @param {HTMLElement} host  the panels layer
 * @param {any} game
 * @param {string} id
 * @param {{ intro?: string|null }} [opts]  what examining the thing said, kept behind the ? button
 * @returns {Promise<{ lectern?: string } | null>}
 */
export function openStage(host, game, id, { intro = null, figure = null } = {}) {
  return new Promise((resolve) => {
    let p = game.view.puzzles.find((x) => x.id === id);
    if (!p) {
      resolve(null);
      return;
    }
    const spec = p.stage ?? { kind: 'write' };
    const build = KINDS[spec.kind] ?? KINDS.write;
    const cards = host.parentElement?.querySelector('#cards') ?? host;

    let value = null;
    let label = '';
    let busy = false;
    let sheet = null;
    let closed = false;

    const status = el('div', { class: 'stage-status', role: 'status', 'aria-live': 'polite' });
    const goal = el('div', { class: 'stage-goal', text: p.goal ?? p.ask });
    const go = el('button', { class: 'btn solid stage-go', type: 'button', disabled: true });
    const actions = el('div', { class: 'stage-actions' }, go);
    const body = el('div', { class: 'stage-body' });
    const hintCount = el('span', { class: 'stage-count', hidden: !p.hints.length, text: String(p.hints.length) });

    const stage = el(
      'section',
      { class: `stage kind-${spec.kind} ${p.setter} ${p.solved ? 'is-solved' : ''}`, role: 'dialog', 'aria-label': p.title },
      el(
        'header',
        { class: 'stage-top' },
        el('button', { class: 'stage-icon', type: 'button', 'aria-label': 'Put it down', 'data-back': '', onClick: () => close() }, icon('back', 20)),
        el('div', { class: 'stage-title' }, el('div', { class: 'stage-kicker', text: p.on?.includes('tithe_wall') ? 'From the Wall of Tithes' : SETTERS[p.setter] ?? '' }), el('div', { class: 'stage-name', text: p.title })),
        el('button', { class: 'stage-icon', type: 'button', 'aria-label': 'What is this?', onClick: () => about() }, icon('help', 20)),
        p.solved ? null : el('button', { class: 'stage-icon', type: 'button', 'aria-label': 'Hints', onClick: () => hints() }, icon('bulb', 20), hintCount),
      ),
      body,
      el('footer', { class: 'stage-foot' }, goal, status, actions),
    );

    // ------------------------------------------------------------ what a puzzle can do

    const ctx = {
      p,
      spec,
      game,
      solved: p.solved,
      /** The tools the detective has earned, by id. */
      tools: new Set((game.view.tools ?? []).map((t) => t.id)),
      /** What the main button would hand in, and what it says. Null: nothing to hand in yet. */
      offer(v, text) {
        value = v === undefined || v === null || v === '' ? null : String(v);
        label = text ?? label;
        drawGo();
      },
      /** Several ways to answer instead of one (Yes, No). */
      choices(list) {
        actions.replaceChildren(
          ...list.map((c) =>
            el('button', { class: `btn ${c.solid ? 'solid' : ''} stage-go`, type: 'button', text: c.label, disabled: p.solved, onClick: () => submit(c.value) }),
          ),
        );
      },
      say(text = '') {
        status.textContent = text;
      },
      goal(text) {
        goal.textContent = text;
      },
      submit: (v) => submit(v),
      tick: () => game.audio.tick?.(),
      tap: () => game.audio.click(),
      /** A written thing, drawn, that grows when tapped. */
      picture(figure, cls = '') {
        const svg = drawWriting(figure);
        if (!svg) return null;
        return el('button', { class: `stage-pic ${cls}`, type: 'button', 'aria-label': `${figure.alt ?? 'A close-up'} Tap to see it larger.`, onClick: () => enlargePicture(svg, figure.alt ?? '', cards) }, svg);
      },
    };

    function drawGo() {
      go.textContent = p.solved ? 'Solved' : label || 'Answer';
      go.disabled = p.solved || busy || value === null;
    }

    async function submit(v) {
      if (busy || p.solved || v === null || v === undefined || closed) return;
      busy = true;
      drawGo();
      for (const b of actions.querySelectorAll('button')) b.disabled = true;
      try {
        const res = await game.call('solve', { id: p.id, answer: String(v) }, {}, { deferEvents: true });
        if (res.ok) {
          p = game.view.puzzles.find((x) => x.id === id) ?? p;
          game.audio.sting();
          game.buzz?.(24);
          ctx.say('');
          stage.classList.add('is-solved');
          await built.right?.(res);
          await wait(matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 520);
          solvedSheet(res);
        } else {
          if (!built.quietWrong) {
            game.audio.clunk?.();
            game.buzz?.([12, 40, 12]);
          }
          await built.wrong?.(res);
          ctx.say(res.text);
          // A wrong answer is a try at it: the hint ladder may have something new.
          p = game.view.puzzles.find((x) => x.id === id) ?? p;
        }
      } catch (err) {
        ctx.say(err.message);
      }
      busy = false;
      drawGo();
      for (const b of actions.querySelectorAll('button')) b.disabled = p.solved;
    }

    // ---------------------------------------------------------------- the object

    // What lies beside it: its own clue pictures, or else the picture of the thing it was found on.
    const clues = spec.clues?.length ? spec.clues : figure ? [figure] : [];
    if (clues.length) add(body, el('div', { class: `stage-clues ${clues.length === 1 ? 'one' : ''}` }, clues.map((f) => ctx.picture(f, 'stage-clue'))));
    const built = build(ctx) ?? { node: el('div') };
    add(body, built.node);
    // A key you tap again and again (a square of letters, a code card) stays in reach under the thing.
    if (built.dock) stage.querySelector('.stage-foot').prepend(el('div', { class: 'stage-dock' }, built.dock));

    // Where the answer is a word found somewhere else, it is set on rings of its own under the thing.
    if (spec.give?.rings) {
      let touched = false;
      const row = ringRow({
        count: spec.give.rings,
        label: 'Letter',
        tick: ctx.tick,
        onChange: () => {
          touched = true;
          ctx.offer(row.value, 'Answer');
          status.textContent = '';
        },
        onEnter: () => go.click(),
      });
      add(body, el('div', { class: 'stage-answer' }, el('div', { class: 'stage-ask', text: p.ask }), row.node));
      label = 'Answer';
      if (p.solved) row.rings.forEach((r, i) => r.setTo(p.answer.replace(/[^A-Z]/g, '')[i] ?? 'A'));
      ctx.offer(touched ? row.value : null, 'Answer');
    }

    go.addEventListener('click', () => submit(value));
    drawGo();

    // ---------------------------------------------------------------- sheets

    /** A sheet that slides up over the object; one at a time. */
    function openSheet(cls, children, { onClose } = {}) {
      closeSheet();
      const shut = el('button', { class: 'stage-icon sheet-x', type: 'button', 'aria-label': 'Close', 'data-back': '', onClick: () => closeSheet() }, icon('close', 18));
      sheet = el('div', { class: `stage-sheet ${cls}`, role: 'dialog' }, shut, el('div', { class: 'sheet-scroll' }, children));
      sheet.onClose = onClose;
      stage.append(sheet);
      return sheet;
    }
    function closeSheet() {
      if (!sheet) return;
      const s = sheet;
      sheet = null;
      leave(s);
      s.onClose?.();
    }

    function about() {
      const parts = [];
      if (intro) parts.push(prose(intro, 'sheet-prose'));
      for (const b of p.blocks) {
        if (b.p) parts.push(prose(b.p, 'sheet-prose'));
        else if (b.quote) parts.push(el('blockquote', { class: 'hand', text: b.quote }));
        else if (b.list) parts.push(el('ol', { class: 'plain-list' }, b.list.map((line) => el('li', { text: line }))));
      }
      openSheet('about', [el('div', { class: 'sheet-kicker', text: 'What this is' }), el('h3', { class: 'sheet-title', text: p.title }), ...parts, el('div', { class: 'sheet-ask' }, el('span', { text: 'The question' }), p.ask)]);
    }

    function hints() {
      const list = el('div', { class: 'sheet-hints' });
      const draw = () => {
        p = game.view.puzzles.find((x) => x.id === id) ?? p;
        hintCount.hidden = !p.hints.length;
        hintCount.textContent = String(p.hints.length);
        list.replaceChildren(...p.hints.map((h, i) => el('div', { class: 'hint' }, el('span', { class: 'lead-tag', text: `Hint ${i + 1}` }), h)));
        if (!p.hints.length) list.append(el('p', { class: 'muted', text: 'Each hint tells you a little more. The last one gives the answer away.' }));
        if (p.hintsLeft > 0 && !p.solved) {
          const last = p.hintsLeft === 1;
          const btn = el('button', { class: 'btn small', type: 'button' }, icon('bulb', 16), last ? 'Last hint (gives the answer)' : p.hints.length ? 'Another hint' : 'A hint');
          btn.addEventListener('click', async () => {
            if (last && !(await confirmCard(game.cards, { title: 'Take the last hint?', text: 'It gives you the answer, and your final report will show it.', yes: 'Show me', no: 'Not yet' }))) return;
            btn.disabled = true;
            try {
              await game.call('hint', { id: p.id }, {}, { deferEvents: true });
            } catch (err) {
              ctx.say(err.message);
            }
            draw();
          });
          list.append(btn);
        }
        if (p.lesson) list.append(el('button', { class: 'btn small quiet', type: 'button', onClick: () => close({ lectern: p.lesson, about: p.title }) }, icon('laptop', 16), 'Ask the Lectern how this is done'));
      };
      draw();
      openSheet('hints', [el('div', { class: 'sheet-kicker', text: 'Hints' }), el('h3', { class: 'sheet-title', text: p.title }), list]);
    }

    function solvedSheet(res) {
      // The first lines of a solution often just say the answer again: the big letters already do.
      const paras = String(res.text ?? '').split(/\n{2,}/);
      if (paras.length > 1 && normalise(paras[0]) === normalise(res.answer)) paras.shift();
      const done = el('button', { class: 'btn solid', type: 'button', text: res.travelled ? 'Go through' : 'Continue', onClick: () => close() });
      const s = openSheet('solved', [el('div', { class: 'sheet-kicker', text: 'Solved' }), el('div', { class: 'sheet-answer', text: res.answer }), prose(paras.join('\n\n'), 'sheet-prose'), el('div', { class: 'sheet-foot' }, done)], { onClose: () => close() });
      s.querySelector('.sheet-x')?.remove();
      done.setAttribute('data-back', '');
      requestAnimationFrame(() => done.focus({ preventScroll: true }));
    }

    // ---------------------------------------------------------------- open and close

    function close(then = null) {
      if (closed) return;
      closed = true;
      window.removeEventListener('keydown', onKey);
      built.dispose?.();
      leave(stage);
      resolve(then);
    }
    const onKey = (e) => {
      if (e.code !== 'Escape') return;
      e.preventDefault();
      if (sheet) closeSheet();
      else close();
    };

    host.append(stage);
    setTimeout(() => window.addEventListener('keydown', onKey), 150);
    // An answered puzzle opens on what it meant; the thing itself is underneath.
    if (p.solved) {
      ctx.say('');
      solvedSheet({ answer: p.answer, text: p.note, travelled: false });
      sheet?.querySelector('.sheet-foot .btn')?.replaceWith(el('button', { class: 'btn', type: 'button', text: 'Look at it again', 'data-back': '', onClick: () => closeSheet() }));
      if (sheet) sheet.onClose = null;
    } else requestAnimationFrame(() => built.focus?.());
  });
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------ a surface with several puzzles on it

const SURFACE_KICKER = { desk: 'On your desk', wall: 'Pinned to the wall' };

/** A small picture of what kind of thing a puzzle is, for its card on a desk or a wall. */
function thumb(p) {
  const kind = p.stage?.kind ?? 'write';
  const mono = p.blocks.find((b) => b.mono)?.mono;
  if (mono) return el('div', { class: 'thumb-mono', text: mono.slice(0, 34) });
  if (kind === 'pigpen') return el('div', { class: 'thumb-mono', text: '⊔ ⊓ ⊏ ⊐ ⌜ ⌝' });
  const grid = p.blocks.find((b) => b.grid);
  if (grid) return el('div', { class: 'thumb-grid' }, grid.grid.slice(0, 4).map((r) => el('span', { text: r.trim().split(/\s+/).join(' ').slice(0, 14) })));
  const list = p.blocks.find((b) => b.list);
  if (list) return el('div', { class: 'thumb-mono', text: list.list[0].slice(0, 34) });
  const quote = p.blocks.find((b) => b.quote || b.marked);
  return el('div', { class: 'thumb-hand', text: (quote?.quote ?? quote?.marked ?? p.goal ?? '').slice(0, 60) });
}

/**
 * Several puzzles lie on one thing (the Papers on your desk, the Tithes on the wall): lay them out,
 * and resolve with the one picked up, or null when the detective steps away.
 * @returns {Promise<string|null>}
 */
export function openSurface(host, game, hid) {
  return new Promise((resolve) => {
    const spot = game.view.location.hotspots.find((h) => h.id === hid);
    const kind = spot?.surface ?? 'desk';
    const here = game.view.puzzles.filter((p) => p.on?.includes(hid));
    let closed = false;
    const close = (value = null) => {
      if (closed) return;
      closed = true;
      window.removeEventListener('keydown', onKey);
      leave(screen);
      resolve(value);
    };
    const onKey = (e) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    // Unanswered first, newest first; answered ones stay, stamped.
    const order = [...here].sort((a, b) => Number(a.solved) - Number(b.solved) || (a.feed ?? 99) - (b.feed ?? 99));
    const cards = order.map((p, i) =>
      el(
        'button',
        { class: `sheet-card ${p.setter} ${p.solved ? 'answered' : ''}`, type: 'button', style: { '--tilt': `${((i * 37) % 7) - 3}deg`, animationDelay: `${0.05 + i * 0.05}s` }, onClick: () => close(p.id) },
        kind === 'wall' ? el('i', { class: 'tack', 'aria-hidden': 'true' }) : null,
        el('div', { class: 'sheet-card-kicker', text: p.setter === 'invigilator' ? 'In green ink' : p.extra ? 'A Tithe' : '' }),
        el('div', { class: 'sheet-card-title', text: p.title }),
        thumb(p),
        p.solved ? el('div', { class: 'stamp', text: p.answer }) : el('div', { class: 'sheet-card-goal', text: p.goal ?? p.ask }),
      ),
    );
    const screen = el(
      'section',
      { class: `stage surface surface-${kind}`, role: 'dialog', 'aria-label': spot?.label ?? 'Puzzles' },
      el(
        'header',
        { class: 'stage-top' },
        el('button', { class: 'stage-icon', type: 'button', 'aria-label': 'Step away', 'data-back': '', onClick: () => close() }, icon('back', 20)),
        el('div', { class: 'stage-title' }, el('div', { class: 'stage-kicker', text: SURFACE_KICKER[kind] ?? '' }), el('div', { class: 'stage-name', text: spot?.label ?? '' })),
        el('span', { class: 'stage-icon ghost', 'aria-hidden': 'true' }),
      ),
      el('div', { class: 'stage-body' }, el('div', { class: 'surface-top' }, cards)),
      el('footer', { class: 'stage-foot' }, el('div', { class: 'stage-goal', text: here.some((p) => !p.solved) ? 'Tap one to pick it up.' : 'All answered. Tap one to look at it again.' })),
    );
    host.append(screen);
    setTimeout(() => window.addEventListener('keydown', onKey), 150);
  });
}
