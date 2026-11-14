// Screens outside the investigation: title, menu and settings, how to play,
// the Lamplighter's letters, and the closing report.

import { el, add, icon, prose } from './dom.js';

function aiLine(ai) {
  const text = ai?.live
    ? `Every character is played live by ${ai.label}.`
    : ai?.hosted
      ? 'Claude is not available in this view. Characters follow the script.'
      : 'Scripted mode. Add an Anthropic API key to bring the characters to life.';
  return el('div', { class: 'ai-line' }, el('span', { class: `ai-dot ${ai?.live ? 'live' : ''}` }), text);
}

/** @returns {Promise<{action: 'new'|'continue', name?: string}>} */
export function showTitle(cards, game, { hasSave, savedName }) {
  return new Promise((resolve) => {
    const name = el('input', { class: 'field', id: 'detective-name', type: 'text', placeholder: 'Your name, Detective', maxlength: '40', autocomplete: 'off', value: savedName ?? '' });
    name.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') begin();
    });
    const finish = (value) => {
      game.audio.unlock();
      card.style.transition = 'opacity 0.5s';
      card.style.opacity = '0';
      setTimeout(() => {
        card.remove();
        resolve(value);
      }, 480);
    };
    const begin = () => finish({ action: 'new', name: name.value.trim() || 'Detective' });
    const card = el(
      'section',
      { class: 'card title', 'aria-label': 'Greyhaven: The Lamplighter' },
      el(
        'div',
        { class: 'card-inner' },
        el('div', { class: 'title-series', text: game.caseInfo.series }),
        el('h1', { class: 'title-name', text: game.caseInfo.title }),
        el('p', { class: 'title-tag', text: game.caseInfo.tagline }),
        el(
          'div',
          { class: 'title-form' },
          hasSave ? el('button', { class: 'btn solid', type: 'button', text: 'Continue the case', onClick: () => finish({ action: 'continue' }) }) : null,
          name,
          el('button', { class: hasSave ? 'btn' : 'btn solid', type: 'button', text: hasSave ? 'Start over' : 'Begin', onClick: begin }),
          el('button', { class: 'btn quiet small', type: 'button', text: 'How to play', onClick: () => showHelp(cards, game) }),
        ),
        aiLine(game.client.ai),
      ),
    );
    cards.append(card);
  });
}

export function showHelp(cards, game) {
  return new Promise((resolve) => {
    const touch = game.isTouch;
    const items = [
      ['Move', touch ? 'Left thumb is a joystick. Or just tap the floor, or a thing, and you will walk to it.' : 'W A S D or the arrow keys. Or click the floor, or a thing, and you will walk to it.'],
      ['Look', touch ? 'Drag anywhere on the right of the screen.' : 'Hold the mouse button and drag. Press F for full mouse-look.'],
      ['Examine', 'Glowing diamonds mark what can be examined. Tap one. What matters is bagged as evidence. The eye button lights up everything in the room.'],
      ['Talk', 'Speech bubbles are people. Ask them anything, in your own words, or tap a suggested question. They remember. Some of them lie.'],
      ['Break a lie', 'While talking, use the bag button to put a piece of evidence in front of someone. That is how liars come apart.'],
      ['Notebook', 'Everything you establish is written down for you: objectives, evidence, people, leads. The Board tab is where you reason and, in the end, name the killer.'],
      ['Laptop', 'HARBORNET answers plain questions from police records: names, places, number plates, objects. It is also where you send evidence to the lab.'],
      ['Map', 'Travel between places. When a day has given you all it will, call it a night.'],
      ['Stuck?', 'The lamp button lets you stop and think. It costs a little off your final rating and is worth it.'],
    ];
    const close = () => {
      window.removeEventListener('keydown', onKey, true);
      card.remove();
      resolve();
    };
    const onKey = (e) => {
      if (e.code !== 'Escape' && e.code !== 'Enter') return;
      e.stopPropagation();
      close();
    };
    window.addEventListener('keydown', onKey, true);
    const card = el(
      'section',
      { class: 'card', role: 'dialog', 'aria-label': 'How to play' },
      el('div', { class: 'card-inner', style: { width: 'min(100%, 760px)' } }, el('div', { class: 'card-kicker', text: 'How to play' }), el('div', { class: 'rule' }), el('div', { class: 'help-grid' }, items.map(([h, p]) => el('div', { class: 'help-item' }, el('h4', { text: h }), el('p', { text: p })))), el('div', { class: 'card-actions' }, el('button', { class: 'btn solid', type: 'button', text: 'Understood', onClick: close }))),
    );
    cards.append(card);
  });
}

/** Menu and settings. Resolves when closed; "new" means the player asked to start over. */
export function showMenu(cards, game) {
  return new Promise((resolve) => {
    const s = game.settings;
    const close = (value) => {
      window.removeEventListener('keydown', onKey);
      card.remove();
      resolve(value);
    };
    const onKey = (e) => {
      // Only when the menu is the top card (How to play may be open over it).
      if (e.code === 'Escape' && cards.lastElementChild === card) close(null);
    };
    window.addEventListener('keydown', onKey);
    const seg = (options, current, onPick) => {
      const wrap = el('div', { class: 'seg', role: 'group' });
      for (const [value, label] of options) {
        const b = el('button', { type: 'button', 'aria-pressed': String(value === current), text: label });
        b.addEventListener('click', () => {
          for (const x of wrap.children) x.setAttribute('aria-pressed', 'false');
          b.setAttribute('aria-pressed', 'true');
          onPick(value);
        });
        add(wrap, b);
      }
      return wrap;
    };
    const range = (id, min, max, step, value, onInput) => {
      const r = el('input', { id, type: 'range', min, max, step, value });
      r.addEventListener('input', () => onInput(Number(r.value)));
      return r;
    };
    const ai = game.client.ai;
    const rows = [
      el('div', { class: 'setting' }, el('label', { text: 'Sound' }), seg([[true, 'On'], [false, 'Off']], s.sound, (v) => game.setSetting('sound', v))),
      el('div', { class: 'setting' }, el('label', { for: 'set-bright' }, 'Brightness', el('small', { text: 'Turn it up if the rooms are too dark on your screen.' })), range('set-bright', 0.7, 1.9, 0.05, s.bright, (v) => game.setSetting('bright', v))),
      el('div', { class: 'setting' }, el('label', { for: 'set-sens', text: 'Look speed' }), range('set-sens', 0.4, 2.2, 0.05, s.sens, (v) => game.setSetting('sens', v))),
      el('div', { class: 'setting' }, el('label', {}, 'Graphics', el('small', { text: 'Lower it if movement feels choppy.' })), seg([['low', 'Low'], ['medium', 'Medium'], ['high', 'High']], game.world.quality, (v) => game.setSetting('quality', v))),
    ];
    if (ai?.hosted && ai.live) {
      rows.push(el('div', { class: 'setting' }, el('label', {}, 'Characters played by', el('small', { text: 'Opus acts best. Fast answers sooner.' })), seg([['opus', 'Opus'], ['quick', 'Fast']], ai.pref ?? 'opus', (v) => game.setAiPreference(v))));
    }
    const card = el(
      'section',
      { class: 'card veil', role: 'dialog', 'aria-label': 'Menu' },
      el(
        'div',
        { class: 'card-inner' },
        el('div', { class: 'card-kicker', text: 'Paused' }),
        el('h2', { class: 'card-title', style: { fontSize: 'clamp(26px, 6vw, 36px)' }, text: game.caseInfo.title }),
        el('div', { class: 'rule' }),
        rows,
        aiLine(ai),
        el(
          'div',
          { class: 'card-actions' },
          el('button', { class: 'btn solid', type: 'button', text: 'Back to the case', onClick: () => close(null) }),
          el('button', { class: 'btn', type: 'button', text: 'How to play', onClick: () => showHelp(cards, game) }),
          game.view?.ending?.text ? el('button', { class: 'btn', type: 'button', text: 'Case report', onClick: () => close('report') }) : null,
          el('button', { class: 'btn danger', type: 'button', text: 'Start over', onClick: () => close('new') }),
        ),
      ),
    );
    cards.append(card);
  });
}

/** An unstamped letter, typed out as it is read. `run(onText)` resolves to { body }. */
export function showLetter(cards, game, run) {
  return new Promise((resolve) => {
    const paper = el('div', { class: 'paper', style: { textAlign: 'left', minHeight: '220px' } }, el('div', { class: 'dots' }, el('i'), el('i'), el('i')));
    const go = el('button', { class: 'btn solid', type: 'button', text: 'Bag it', disabled: true });
    const card = el(
      'section',
      { class: 'card veil', role: 'dialog', 'aria-label': 'A letter' },
      el('div', { class: 'card-inner' }, el('div', { class: 'card-kicker', text: 'Left on your desk · no stamp' }), el('div', { class: 'rule' }), paper, el('div', { class: 'card-actions' }, go)),
    );
    go.addEventListener('click', () => {
      card.remove();
      resolve();
    });
    cards.append(card);
    let streamed = false;
    let last = 0;
    run((soFar) => {
      streamed = true;
      paper.textContent = soFar;
      if (soFar.length - last > 3) {
        game.audio.typeKey();
        last = soFar.length;
      }
    })
      .then(async ({ body }) => {
        if (!streamed) {
          // Scripted letters arrive whole; type them out anyway.
          await new Promise((done) => {
            const start = performance.now();
            const tick = () => {
              const n = Math.floor(((performance.now() - start) / 1000) * 55);
              paper.textContent = body.slice(0, n);
              if (n % 4 === 0) game.audio.typeKey();
              if (n >= body.length) done();
              else requestAnimationFrame(tick);
            };
            paper.addEventListener('click', () => {
              paper.textContent = body;
              done();
            }, { once: true });
            tick();
          });
        }
        paper.textContent = body;
        go.disabled = false;
      })
      .catch((err) => {
        paper.textContent = err.message || 'The envelope is empty.';
        go.disabled = false;
        go.textContent = 'Close';
      });
  });
}

/** The closing passage and the case report. Resolves to 'new' or 'stay'. */
export function showEnding(cards, game, run) {
  return new Promise((resolve) => {
    const text = el('div', { class: 'epilogue' }, el('div', { class: 'dots' }, el('i'), el('i'), el('i')));
    const report = el('div', { class: 'report', hidden: true });
    const actions = el('div', { class: 'card-actions', hidden: true });
    const card = el(
      'section',
      { class: 'card', role: 'dialog', 'aria-label': 'Epilogue' },
      el('div', { class: 'card-inner', style: { width: 'min(100%, 640px)' } }, el('div', { class: 'card-kicker', text: '14 October' }), el('h1', { class: 'card-title', text: 'After' }), el('div', { class: 'rule' }), text, report, actions),
    );
    cards.append(card);
    const close = (value) => {
      card.remove();
      resolve(value);
    };
    let streamed = false;
    run((soFar) => {
      streamed = true;
      text.replaceChildren(prose(soFar));
    })
      .then(({ ending }) => {
        text.replaceChildren(prose(ending.text));
        report.hidden = false;
        actions.hidden = false;
        const found = ending.truths.filter((t) => t.found).length;
        add(report, 
          el('div', { class: 'rule' }),
          el('div', { class: 'report-rank', text: ending.rank }),
          el('div', { class: 'report-score', text: `CASE RATING ${ending.score} / 100` }),
          el('p', { class: 'muted', style: { textAlign: 'center', margin: '0 0 18px' }, text: ending.rankLine }),
          el('div', { class: 'section-label', text: `What you uncovered · ${found} of ${ending.truths.length}` }),
          ending.truths.map((t) => el('div', { class: `truth ${t.found ? '' : 'missed'}` }, icon(t.found ? 'check' : 'close', 16), t.label)),
          el('p', { class: 'muted', style: { fontSize: '13px', marginTop: '14px' }, text: `${ending.stats.exchanges} questions asked · ${ending.stats.hints} moments of thought · ${ending.stats.wrong} wrong turns on the board` }),
        );
        add(actions, el('button', { class: 'btn solid', type: 'button', text: 'A new case file', onClick: () => close('new') }), el('button', { class: 'btn quiet', type: 'button', text: 'Stay a while', onClick: () => close('stay') }));
        if (!streamed) card.scrollTop = 0;
      })
      .catch((err) => {
        text.replaceChildren(el('p', { class: 'muted', text: err.message || 'The report would not come.' }));
        actions.hidden = false;
        add(actions, el('button', { class: 'btn', type: 'button', text: 'Close', onClick: () => close('stay') }));
      });
  });
}
