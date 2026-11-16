// Help: what to do now. The current goal as a short list of steps, each one ticked
// off as it is done, with the place it happens; one button that takes the player
// to the next step; and the hints, one short sentence at a time, only when asked.

import { el, icon, leave } from './dom.js';

/** What each kind of step asks for, as a word on its tag, and its picture. */
const VERBS = {
  look: ['Look', 'eye'],
  talk: ['Talk', 'speech'],
  solve: ['Solve', 'token'],
  go: ['Go', 'pin'],
  lab: ['Lab', 'flask'],
  answer: ['Answer', 'board'],
  lectern: ['Ask', 'laptop'],
  rest: ['Rest', 'moon'],
};

/** What the big button says for a target. */
export function goLabel(t) {
  if (!t) return null;
  if (t.type === 'lab') return 'Open the lab';
  if (t.type === 'lectern') return 'Open the Lectern';
  if (t.type === 'board') return 'Open the case board';
  if (t.type === 'map') return 'Open the map';
  if (!t.here && !t.open) return 'Open the map';
  if (t.type === 'place') return t.here ? null : 'Take me there';
  return t.here ? 'Show me' : 'Take me there';
}

/**
 * Open the help sheet. Resolves with the target to go to, or null.
 * @param {HTMLElement} panels
 * @param {any} game
 */
export function showNextSteps(panels, game) {
  return new Promise((resolve) => {
    const kicker = el('div', { class: 'panel-kicker', text: 'What to do now' });
    const title = el('div', { class: 'panel-title help-title' });
    const body = el('div', { class: 'panel-body' }, el('div', { class: 'dots' }, el('i'), el('i'), el('i')));
    const hintBtn = el('button', { class: 'btn small', type: 'button', text: 'Hint' });
    const goBtn = el('button', { class: 'btn small solid', type: 'button', text: 'Take me there' });
    const foot = el('div', { class: 'inspect-actions help-foot' }, hintBtn, goBtn);
    let g = null;
    let next = null;
    // Where the big button goes: the next step, or, when that is only to go somewhere, the first
    // thing to do once there, so one tap travels and walks on.
    let goTarget = null;
    const close = (target = null) => {
      window.removeEventListener('keydown', onKey);
      leave(panel, scrim);
      resolve(target);
    };
    const onKey = (e) => {
      if (e.code === 'Escape' || e.code === 'KeyT') {
        e.preventDefault();
        close(null);
      }
    };
    const scrim = el('div', { class: 'scrim', onClick: () => close(null) });
    const panel = el(
      'section',
      { class: 'panel think help', role: 'dialog', 'aria-label': 'What to do now' },
      el('div', { class: 'panel-head' }, el('div', { class: 'think-head' }, kicker, title), el('button', { class: 'xbtn', type: 'button', 'aria-label': 'Close', 'data-back': '', onClick: () => close(null) }, icon('close'))),
      body,
      el('div', { class: 'inspect-foot' }, foot),
    );

    function step(st, i) {
      const [word, pic] = VERBS[st.verb] ?? ['Do', 'star'];
      const t = st.target;
      const where = t && !t.here && t.place ? t.place : null;
      const lines = [
        el('div', { class: 'row-title' }, st.label, st.count ? el('span', { class: 'help-count', text: ` · ${st.count[0]} of ${st.count[1]}` }) : null),
        st.ask && !st.done ? el('div', { class: 'row-sub help-ask', text: `Ask: “${st.ask}”` }) : null,
        where && !st.done ? el('div', { class: 'row-sub', text: where }) : null,
      ];
      const can = !st.done && !!goLabel(t);
      return el(
        can ? 'button' : 'div',
        { class: `row help-step ${st.done ? 'done' : ''} ${next === st ? 'next' : ''}`, type: can ? 'button' : undefined, onClick: can ? () => close(t) : undefined, 'aria-label': `${st.done ? 'Done: ' : `Step ${i + 1}: `}${word} ${st.label}${where && !st.done ? `, at ${where}` : ''}` },
        st.done ? el('span', { class: 'help-tick done' }, icon('check', 16)) : el('span', { class: 'help-tick', text: String(i + 1) }),
        el('div', { class: 'row-main' }, el('div', { class: 'help-verb' }, icon(pic, 14), word), lines),
        can ? el('span', { class: 'help-chev', 'aria-hidden': 'true' }, icon('back', 16)) : null,
      );
    }

    function draw() {
      if (!g.objective) {
        title.textContent = 'Nothing left to do here';
        body.replaceChildren(el('p', { class: 'note', text: 'Every thread you have found is followed up. Look around, or open the map.' }));
        hintBtn.hidden = true;
        goBtn.textContent = 'Open the map';
        next = null;
        goTarget = { type: 'map' };
        return;
      }
      title.textContent = g.objective.text;
      next = g.steps.find((s) => !s.done && goLabel(s.target)) ?? null;
      goTarget = next?.target ?? null;
      if (goTarget?.type === 'place') {
        const there = g.steps.slice(g.steps.indexOf(next) + 1).find((s) => !s.done && s.target?.loc === goTarget.loc && s.target.type !== 'place');
        if (there) goTarget = there.target;
      }
      const steps = el('div', { class: 'help-steps' }, g.steps.map(step));
      const hints = g.hints.length ? el('div', { class: 'help-hints' }, g.hints.map((h) => el('p', { class: 'help-hint' }, icon('bulb', 16), el('span', { text: h })))) : null;
      // The other open goals, folded away under one line until wanted.
      const others = g.others.length
        ? el(
            'details',
            { class: 'help-others' },
            el('summary', { class: 'help-others-sum' }, icon('list', 16), `Other things to do (${g.others.length})`),
            g.others.map((o) => el('button', { class: 'row help-other', type: 'button', onClick: () => load(o.id) }, el('div', { class: 'row-main' }, el('div', { class: 'row-title', text: o.text })), el('span', { class: 'help-chev', 'aria-hidden': 'true' }, icon('back', 16)))),
          )
        : null;
      body.replaceChildren(...[steps, hints, others].filter(Boolean));
      hintBtn.hidden = false;
      hintBtn.disabled = g.hintsLeft <= 0;
      hintBtn.textContent = g.hintsLeft <= 0 ? 'No more hints' : g.hints.length ? 'Another hint' : 'Hint';
      goBtn.hidden = !goTarget;
      if (goTarget) goBtn.textContent = goLabel(goTarget);
    }

    async function load(id = null) {
      try {
        g = await game.call('guide', id ? { id } : {});
        draw();
        body.scrollTop = 0;
      } catch (err) {
        body.replaceChildren(el('p', { class: 'muted', text: err.message || 'Nothing comes.' }));
      }
    }

    hintBtn.addEventListener('click', async () => {
      if (!g?.objective || hintBtn.disabled) return;
      hintBtn.disabled = true;
      try {
        const res = await game.call('think', { id: g.objective.id, plain: true });
        g.hints = [...g.hints, res.text];
        g.hintsLeft = res.hintsLeft ?? Math.max(0, g.hintsLeft - 1);
        draw();
        body.querySelector('.help-hint:last-child')?.scrollIntoView({ block: 'nearest' });
      } catch {
        hintBtn.disabled = false;
      }
    });
    goBtn.addEventListener('click', () => close(goTarget));

    panels.append(scrim, panel);
    window.addEventListener('keydown', onKey);
    load();
  });
}
