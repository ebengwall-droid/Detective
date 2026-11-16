// The puzzles the detective has come across, listed in the notebook with
// where each one lies. A puzzle is never worked here: it is picked up by
// tapping the thing it lies on, in its room (ui/stage.js). The game core
// decides what is open and what is solved; nothing here knows an answer.

import { el, add, icon } from './dom.js';

const GROUPS = [
  ['invigilator', "The Invigilator's Papers"],
  ['fold', "The Fold's own"],
  ['hesper', 'Dame Hesper'],
];

const tierDots = (n) => el('span', { class: 'tier', title: `Difficulty ${n} of 5`, 'aria-label': `Difficulty ${n} of 5` }, [1, 2, 3, 4, 5].map((i) => el('i', { class: i <= n ? 'on' : '' })));

/**
 * Draw the Papers tab.
 * @param {HTMLElement} body
 * @param {any} game
 */
export function renderPapers(body, game) {
  const v = game.view;
  const puzzles = v.puzzles ?? [];
  if (!puzzles.length) {
    add(body, el('div', { class: 'empty', text: 'No puzzles yet. You will get your first one soon.' }));
    return;
  }
  const open = puzzles.filter((p) => !p.solved);
  add(body, el('p', { class: 'muted papers-count' }, open.length ? `${open.length} unanswered. Each one waits where you found it: go there and tap it.` : 'Nothing unanswered. For now.'));
  for (const [key, label] of GROUPS) {
    const list = puzzles.filter((p) => p.setter === key);
    if (!list.length) continue;
    add(body, el('div', { class: 'section-label list-label', text: label }));
    add(
      body,
      el(
        'div',
        { class: 'list' },
        list.map((p) =>
          el(
            'div',
            { class: `row static paper-row ${p.solved ? 'answered' : ''} ${key}` },
            icon(p.solved ? 'check' : 'pin', 20),
            el('div', { class: 'row-main' }, el('div', { class: 'row-title', text: p.title }), el('div', { class: 'row-sub' }, p.solved ? `Answered: ${p.answer}` : p.where ?? '')),
            tierDots(p.tier),
          ),
        ),
      ),
    );
  }
}
