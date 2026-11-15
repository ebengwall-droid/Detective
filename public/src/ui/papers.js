// The Papers: every puzzle the detective has come across, the bench to work
// them on, and the solving tools they have earned.
//
// This is drawn inside the notebook. The game core decides what is open, what
// is solved and what a hint says; nothing here knows an answer.

import { el, add, icon } from './dom.js';
import { showCard, confirmCard } from './hud.js';
import { caesar, frequencies, unRailFence, vigenere, playfair, playfairSquare, lettersOf } from '../../../core/ciphers.js';

const SETTERS = { invigilator: 'Set by the Invigilator', fold: "The Fold's own", hesper: 'Dame Hesper' };
const GROUPS = [
  ['invigilator', 'The Invigilator\'s Papers'],
  ['fold', "The Fold's own"],
  ['hesper', 'Dame Hesper'],
  ['extra', 'From the Wall of Tithes'],
];

const tierDots = (n) => el('span', { class: 'tier', title: `Difficulty ${n} of 5`, 'aria-label': `Difficulty ${n} of 5` }, [1, 2, 3, 4, 5].map((i) => el('i', { class: i <= n ? 'on' : '' })));

// ------------------------------------------------------------------ pigpen

const NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}, ...kids) => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  node.append(...kids);
  return node;
};

/** The strokes of one pigpen sign, in a 20 x 20 box. */
function pigpenPath(ch) {
  const i = ch.charCodeAt(0) - 65;
  const a = 3;
  const b = 17;
  if (i < 18) {
    // Two noughts-and-crosses grids; the second carries a dot.
    const cell = i % 9;
    const r = Math.floor(cell / 3);
    const c = cell % 3;
    let d = '';
    if (r > 0) d += `M${a} ${a}H${b}`;
    if (r < 2) d += `M${a} ${b}H${b}`;
    if (c > 0) d += `M${a} ${a}V${b}`;
    if (c < 2) d += `M${b} ${a}V${b}`;
    return { d, dot: i >= 9 ? [10, 10] : null };
  }
  // Two crosses; the second carries a dot. S top, T left, U right, V bottom.
  const arm = (i - 18) % 4;
  const d = [`M${a} ${a + 2}L10 ${b - 1}L${b} ${a + 2}`, `M${a + 2} ${a}L${b - 1} 10L${a + 2} ${b}`, `M${b - 2} ${a}L${a + 1} 10L${b - 2} ${b}`, `M${a} ${b - 2}L10 ${a + 1}L${b} ${b - 2}`][arm];
  const dot = [[10, 7], [7, 10], [13, 10], [10, 13]][arm];
  return { d, dot: i >= 22 ? dot : null };
}

function pigpenSign(ch, size = 22) {
  const { d, dot } = pigpenPath(ch);
  const s = svg('svg', { viewBox: '0 0 20 20', width: size, height: size, class: 'pig' }, svg('path', { d, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  if (dot) s.append(svg('circle', { cx: dot[0], cy: dot[1], r: 1.5, fill: 'currentColor' }));
  return s;
}

function pigpenLine(text) {
  return el(
    'div',
    { class: 'glyphs', role: 'img', 'aria-label': 'A message written in pigpen signs' },
    String(text)
      .toUpperCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => {
        const signs = word.replace(/[^A-Z.]/g, '').split('');
        return el('span', { class: 'glyph-word' }, signs.map((ch) => (ch === '.' ? el('span', { class: 'glyph-stop' }) : pigpenSign(ch))));
      }),
  );
}

/** The key to the pigpen: the four frames with their letters in. */
function pigpenKey() {
  const frame = (letters, kind) => {
    const s = svg('svg', { viewBox: '0 0 66 66', width: 104, height: 104, class: 'pig-key' });
    const stroke = { fill: 'none', stroke: 'currentColor', 'stroke-width': 1.4, 'stroke-linecap': 'round' };
    if (kind === 'grid' || kind === 'grid.') {
      s.append(svg('path', { d: 'M23 3V63M43 3V63M3 23H63M3 43H63', ...stroke }));
      letters.forEach((ch, i) => {
        const x = 13 + (i % 3) * 20;
        const y = 13 + Math.floor(i / 3) * 20;
        const t = svg('text', { x, y: y + 4, 'text-anchor': 'middle', 'font-size': 10, fill: 'currentColor' });
        t.textContent = ch;
        s.append(t);
        if (kind === 'grid.') s.append(svg('circle', { cx: x + 6, cy: y - 5, r: 1.3, fill: 'currentColor' }));
      });
    } else {
      s.append(svg('path', { d: 'M8 8L58 58M58 8L8 58', ...stroke }));
      const at = [[33, 16], [16, 36], [50, 36], [33, 56]];
      letters.forEach((ch, i) => {
        const t = svg('text', { x: at[i][0], y: at[i][1], 'text-anchor': 'middle', 'font-size': 10, fill: 'currentColor' });
        t.textContent = ch;
        s.append(t);
        if (kind === 'x.') s.append(svg('circle', { cx: at[i][0] + 6, cy: at[i][1] - 8, r: 1.3, fill: 'currentColor' }));
      });
    }
    return s;
  };
  return el('div', { class: 'pig-keys' }, frame('ABCDEFGHI'.split(''), 'grid'), frame('JKLMNOPQR'.split(''), 'grid.'), frame('STUV'.split(''), 'x'), frame('WXYZ'.split(''), 'x.'));
}

// ------------------------------------------------------------------ blocks

function letterGrid(block) {
  const rows = block.grid.map((row) => (block.numbers ? row.trim().split(/\s+/) : row.split('')));
  return el(
    'figure',
    { class: 'gridfig' },
    el('table', { class: `lettergrid ${block.numbers ? 'numbers' : ''}` }, rows.map((row) => el('tr', {}, row.map((ch) => el('td', { class: ch === '?' || ch === '_' ? 'gap' : '', text: ch === '_' ? '' : ch }))))),
    block.caption ? el('figcaption', { text: block.caption }) : null,
  );
}

function chessBoard(block) {
  const rows = block.board.rows;
  const table = el('table', { class: 'chess' });
  rows.forEach((row, r) => {
    add(table, el('tr', {}, el('th', { text: String(8 - r) }), row.split('').map((ch, f) => el('td', { class: (r + f) % 2 ? 'dark' : 'light', text: ch }))));
  });
  add(table, el('tr', {}, el('th'), 'abcdefgh'.split('').map((f) => el('th', { text: f }))));
  return el('figure', { class: 'gridfig' }, table);
}

function feedList(block) {
  return el(
    'ol',
    { class: 'feeds' },
    block.feeds.map((f) => el('li', {}, el('span', { class: 'feed-title', text: f.title }), f.answer ? el('span', { class: 'feed-answer', text: f.answer }) : el('span', { class: 'feed-answer none', text: 'not answered' }))),
  );
}

// ------------------------------------------------------------------- tools

function toolWheel(text) {
  const input = el('textarea', { class: 'field tool-text', rows: '3', spellcheck: 'false', 'aria-label': 'Cipher text' });
  input.value = text;
  const out = el('div', { class: 'tool-out' });
  const label = el('span', { class: 'tool-num' });
  const count = el('div', { class: 'muted tool-note' });
  const range = el('input', { type: 'range', min: '0', max: '25', value: '0', 'aria-label': 'Places to turn back' });
  const draw = () => {
    const n = Number(range.value);
    label.textContent = n === 0 ? 'as written' : `${n} back`;
    out.textContent = caesar(input.value, -n);
    const top = frequencies(input.value).slice(0, 4);
    count.textContent = top.length ? `Commonest letters as written: ${top.map(([ch, k]) => `${ch} (${k})`).join(', ')}` : '';
  };
  range.addEventListener('input', draw);
  input.addEventListener('input', draw);
  draw();
  return el('div', { class: 'tool' }, input, el('div', { class: 'tool-row' }, el('span', { text: 'Turn' }), range, label), out, count);
}

function toolFence(text) {
  const input = el('textarea', { class: 'field tool-text', rows: '3', spellcheck: 'false', 'aria-label': 'Cipher text' });
  input.value = text;
  const out = el('div', { class: 'tool-out' });
  let rails = 2;
  const buttons = [2, 3, 4, 5, 6].map((n) => el('button', { class: 'filter', type: 'button', text: String(n), 'aria-pressed': String(n === rails) }));
  const draw = () => {
    buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(i + 2 === rails)));
    out.textContent = lettersOf(input.value) ? unRailFence(input.value, rails) : '';
  };
  buttons.forEach((b, i) => b.addEventListener('click', () => { rails = i + 2; draw(); }));
  input.addEventListener('input', draw);
  draw();
  return el('div', { class: 'tool' }, input, el('div', { class: 'tool-row' }, el('span', { text: 'Rails' }), buttons), out);
}

function toolSquare(text) {
  const input = el('textarea', { class: 'field tool-text', rows: '3', spellcheck: 'false', 'aria-label': 'Cipher text' });
  input.value = text;
  const key = el('input', { class: 'field', type: 'text', placeholder: 'Key word', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', maxlength: '24', 'aria-label': 'Key word' });
  const out = el('div', { class: 'tool-out' });
  const draw = () => {
    out.textContent = lettersOf(key.value) ? vigenere(input.value, key.value, true) : 'Give it a key word.';
  };
  key.addEventListener('input', draw);
  input.addEventListener('input', draw);
  draw();
  return el('div', { class: 'tool' }, input, key, out);
}

function toolFrame(text) {
  const input = el('textarea', { class: 'field tool-text', rows: '3', spellcheck: 'false', 'aria-label': 'Cipher text' });
  input.value = text;
  const key = el('input', { class: 'field', type: 'text', placeholder: 'Key word', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', maxlength: '24', 'aria-label': 'Key word' });
  const sq = el('table', { class: 'lettergrid small' });
  const out = el('div', { class: 'tool-out' });
  const draw = () => {
    const square = playfairSquare(key.value);
    sq.replaceChildren(...(square.match(/.{5}/g) ?? []).map((row) => el('tr', {}, row.split('').map((ch) => el('td', { text: ch })))));
    const letters = lettersOf(input.value);
    out.textContent = !lettersOf(key.value) ? 'Give it a key word.' : letters.length % 2 ? 'The cipher text must be an even number of letters.' : playfair(letters, key.value, true);
  };
  key.addEventListener('input', draw);
  input.addEventListener('input', draw);
  draw();
  return el('div', { class: 'tool' }, input, key, el('figure', { class: 'gridfig' }, sq), out);
}

function primer() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const five = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'.match(/.{5}/g);
  const page = (title, ...body) => el('details', { class: 'primer-page' }, el('summary', { text: title }), el('div', { class: 'primer-body' }, body));
  return el(
    'div',
    { class: 'tool primer' },
    page('The alphabet, numbered', el('div', { class: 'alpha' }, alphabet.map((ch, i) => el('span', {}, el('b', { text: ch }), String(i + 1))))),
    page('The pigpen', el('p', { class: 'muted', text: 'Each letter is drawn as the walls of its own cell, with its dot if it has one.' }), pigpenKey()),
    page(
      'The five-by-five square',
      el('p', { class: 'muted', text: 'Read the row number first, then the column. I and J share a square.' }),
      el('table', { class: 'lettergrid small headed' }, el('tr', {}, el('th'), [1, 2, 3, 4, 5].map((n) => el('th', { text: String(n) }))), five.map((row, r) => el('tr', {}, el('th', { text: String(r + 1) }), row.split('').map((ch) => el('td', { text: ch === 'I' ? 'I/J' : ch }))))),
    ),
    page('The chessboard', el('p', { class: 'muted', text: 'Files a to h from the left; ranks 1 to 8 from the bottom. A knight (N) goes two squares one way and one across.' })),
    page(
      'Counting in twos',
      el('p', { class: 'muted', text: 'Each letter is five marks, a or b. A is aaaaa, B is aaaab, and so on.' }),
      el('div', { class: 'alpha wide' }, alphabet.map((ch, i) => el('span', {}, el('b', { text: ch }), i.toString(2).padStart(5, '0').replace(/0/g, 'a').replace(/1/g, 'b')))),
    ),
    page('The rules of the game', el('p', { class: 'muted', text: 'Every puzzle can be solved with what the game gives you. If you are stuck, you probably need to look something up. Ask the Lectern how a method works. People in the Fold will help you, but they will not give you the answer.' })),
  );
}

const TOOL_VIEWS = { wheel: toolWheel, fence: toolFence, square: toolSquare, frame: toolFrame };

// ------------------------------------------------------------------- views

/**
 * Draw the Papers tab.
 * @param {HTMLElement} body
 * @param {any} game
 * @param {{ puzzle: string|null, tool: string|null }} sel
 * @param {{ refresh: (turn?: boolean) => void, close: () => void }} api  refresh(true) when the page itself changes
 */
export function renderPapers(body, game, sel, api) {
  const v = game.view;
  const puzzles = v.puzzles ?? [];
  if (!puzzles.length) {
    add(body, el('div', { class: 'empty', text: 'No puzzles yet. You will get your first one soon.' }));
    return;
  }
  const current = puzzles.find((p) => p.id === sel.puzzle);
  if (current) {
    add(body, el('button', { class: 'btn small quiet back', type: 'button', onClick: () => { sel.puzzle = null; sel.tool = null; api.refresh(true); } }, icon('back', 16), 'All papers'), puzzleView(current, game, sel, api));
    return;
  }
  const open = puzzles.filter((p) => !p.solved);
  const tools = v.tools ?? [];
  add(body, el('p', { class: 'muted papers-count' }, open.length ? `${open.length} unanswered. Choose one to work on it.` : 'Nothing unanswered. For now.'));
  for (const [key, label] of GROUPS) {
    const list = puzzles.filter((p) => (key === 'extra' ? p.extra : !p.extra && p.setter === key));
    if (!list.length) continue;
    add(body, el('div', { class: 'section-label list-label', text: label }));
    add(
      body,
      el(
        'div',
        { class: 'list' },
        list.map((p) =>
          el(
            'button',
            { class: `row paper-row ${p.solved ? 'answered' : ''} ${key}`, type: 'button', onClick: () => { sel.puzzle = p.id; sel.tool = null; api.refresh(true); } },
            icon(p.solved ? 'check' : 'paper', 20),
            el('div', { class: 'row-main' }, el('div', { class: 'row-title', text: p.title }), el('div', { class: 'row-sub' }, p.solved ? `Answered: ${p.answer}` : p.ask)),
            tierDots(p.tier),
          ),
        ),
      ),
    );
  }
  if (tools.length) {
    add(body, el('div', { class: 'section-label list-label', text: 'Your tools' }));
    add(body, el('div', { class: 'list' }, tools.map((t) => el('div', { class: 'row static' }, icon('gear', 20), el('div', { class: 'row-main' }, el('div', { class: 'row-title', text: t.name }), el('div', { class: 'row-sub', text: t.desc }))))));
  }
}

function puzzleView(p, game, sel, api) {
  const tools = game.view.tools ?? [];
  const root = el('div', { class: `puzzle ${p.setter}` });
  add(root, el('div', { class: 'puzzle-head' }, el('div', {}, el('div', { class: 'panel-kicker', text: p.extra ? 'From the Wall of Tithes' : SETTERS[p.setter] ?? '' }), el('h3', { text: p.title })), tierDots(p.tier)));

  let cipher = '';
  for (const b of p.blocks) {
    if (b.p) add(root, el('p', { text: b.p }));
    else if (b.quote) add(root, el('blockquote', { class: 'hand', text: b.quote }));
    else if (b.mono) {
      cipher ||= b.mono;
      add(root, el('pre', { class: 'cipher', text: b.mono }));
    } else if (b.glyphs) add(root, pigpenLine(b.glyphs));
    else if (b.grid) add(root, letterGrid(b));
    else if (b.board) add(root, chessBoard(b));
    else if (b.list) add(root, el('ol', { class: 'plain-list' }, b.list.map((line) => el('li', { text: line }))));
    else if (b.marked) add(root, el('pre', { class: 'cipher marked', text: b.marked }));
    else if (b.feeds) add(root, feedList(b));
  }

  if (p.solved) {
    add(root, el('div', { class: 'question solved' }, el('div', { class: 'answer' }, icon('check', 16), p.answer), el('div', { class: 'verdict yes', text: p.note })));
  } else {
    const input = el('input', { class: 'field', type: 'text', placeholder: 'Your answer', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', enterkeyhint: 'done', maxlength: '60', 'aria-label': p.ask });
    const verdict = el('div', { class: 'verdict no', hidden: true, role: 'status' });
    const go = el('button', { class: 'btn solid', type: 'submit' }, 'Answer');
    const form = el('form', { class: 'answer-form' }, el('label', { class: 'ask', text: p.ask }), el('div', { class: 'answer-row' }, input, go), verdict);
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (!input.value.trim()) return;
      go.disabled = true;
      try {
        const res = await game.call('solve', { id: p.id, answer: input.value }, {}, { deferEvents: true });
        if (res.ok) {
          game.audio.sting();
          game.buzz?.(24);
          // A puzzle that is a way in (the gate) has already taken you through: the new place is behind the card.
          await showCard(game.cards, { kicker: p.title, title: res.answer, lines: res.text.split('\n\n'), veil: true, button: res.travelled ? 'Go through' : 'Continue' });
          if (res.travelled) api.close();
          else api.refresh();
          game.flushEvents();
          return;
        }
        verdict.hidden = false;
        verdict.textContent = res.text;
        game.flushEvents();
      } catch (err) {
        verdict.hidden = false;
        verdict.textContent = err.message;
      }
      go.disabled = false;
    });
    add(root, form);

    // Hints already taken stay on the page.
    const hints = el('div', { class: 'hints' });
    p.hints.forEach((h, i) => add(hints, el('div', { class: 'hint' }, el('span', { class: 'lead-tag', text: `Hint ${i + 1}` }), h)));
    if (p.hintsLeft > 0) {
      const last = p.hintsLeft === 1;
      const btn = el('button', { class: 'btn small quiet', type: 'button' }, icon('bulb', 16), last ? 'Last hint (gives the answer)' : p.hints.length ? 'Another hint' : 'A hint');
      btn.addEventListener('click', async () => {
        if (last && !(await confirmCard(game.cards, { title: 'Take the last hint?', text: 'This hint gives you the answer, and your final report will show it. You could ask the Lectern how the method works first.', yes: 'Show me', no: 'Not yet' }))) return;
        btn.disabled = true;
        try {
          await game.call('hint', { id: p.id });
        } catch (err) {
          game.hud.toast({ kind: 'alert', iconName: 'bulb', title: 'Hint', text: err.message });
        }
        api.refresh();
      });
      add(hints, btn);
    }
    add(root, hints);
  }

  // The bench: whichever tools have been earned, working on this paper's cipher text.
  if (tools.length && !p.solved) {
    const bar = el('div', { class: 'filterbar toolbar' }, tools.map((t) => el('button', { class: 'filter', type: 'button', 'aria-pressed': String(sel.tool === t.id), text: t.name, title: t.desc, onClick: () => { sel.tool = sel.tool === t.id ? null : t.id; api.refresh(); } })));
    add(root, el('div', { class: 'section-label tools-label', text: 'Your tools' }), bar);
    if (sel.tool === 'primer') add(root, primer());
    else if (TOOL_VIEWS[sel.tool]) add(root, TOOL_VIEWS[sel.tool](cipher));
  }
  if (p.lesson) {
    add(root, el('button', { class: 'btn small quiet lesson', type: 'button', onClick: () => game.askLectern?.(p.lesson) }, icon('laptop', 16), 'Ask the Lectern how this is done'));
  }
  return root;
}
