// Screens outside the investigation: title, menu and settings, how to play,
// the Invigilator's Papers, and the closing report.

import { copyDiagnostics } from './diag.js';
import { el, add, icon, prose, setThumb, watchOverflow } from './dom.js';
import { gsap, leaveTitle, lockWord, playTitle, still } from './titlefx.js';

const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/**
 * Each published version is made for one kind of device. Opened on the other
 * kind, it says so, and links to the right one when it knows where that is.
 */
function deviceLine(game) {
  const wrong = game.device === 'mobile' ? !game.touchScreen : game.device === 'web' ? game.touchScreen : false;
  if (!wrong) return null;
  const [made, better, other] = game.device === 'mobile' ? ['phones', 'On a computer', 'web version'] : ['computers', 'On a phone or tablet', 'mobile version'];
  const link = game.otherVersion ? el('a', { class: 'ts-link', href: game.otherVersion, target: '_blank', rel: 'noopener', text: `Open the ${other}` }) : null;
  return el('div', { class: 'ai-line ts-device' }, el('span', { text: `This version is made for ${made}. ${better}, the ${other} works better. ` }), link);
}

function aiLine(game) {
  const ai = game.client.ai;
  // With a server there is a key to add. Without one (the single-file and hosted builds) there is not.
  const offline = game.client.mode === 'local' ? "Claude isn't available here, so the characters follow a script." : 'Characters follow a script. Add an Anthropic API key to have Claude play them.';
  const text = ai?.live ? `Characters are played live by ${ai.label}.` : ai?.hosted ? "Claude isn't available here, so the characters follow a script." : offline;
  return el('div', { class: 'ai-line' }, el('span', { class: `ai-dot ${ai?.live ? 'live' : ''}` }), text);
}

/**
 * The title screen. The room behind it is the wheelwright's shop at night.
 * The name of the case sets itself like the letter-lock on the gate; the menu
 * is a game's menu, and your name is asked for only when you start a case.
 * @returns {Promise<{action: 'new'|'continue', name?: string}>}
 */
export function showTitle(cards, game, { hasSave, savedName }) {
  return new Promise((resolve) => {
    const veil = el('div', { class: 'ts-veil', 'aria-hidden': 'true' });
    const kicker = el('div', { class: 'ts-kicker', text: 'A case in the Fold' });
    const the = lockWord('The', 'ts-the');
    const name = lockWord('Invigilator', 'ts-name');
    const title = el('h1', { class: 'ts-title' }, el('span', { class: 'sr-only', text: `The Fold: ${game.caseInfo.title}` }), the.word, name.word);
    const rule = el('div', { class: 'ts-rule', 'aria-hidden': 'true' });
    const tag = el('p', { class: 'ts-tag', text: 'A murder mystery in a hidden city of puzzle-makers.' });

    const item = (label, cls, onClick) => el('button', { class: `ts-item ${cls}`, type: 'button', onClick }, el('span', { text: label }));
    const menu = el(
      'nav',
      { class: 'ts-menu', 'aria-label': 'Title' },
      hasSave ? item('Continue', 'primary ts-continue', () => finish({ action: 'continue' })) : null,
      item('New case', `${hasSave ? '' : 'primary'} ts-new`, () => askName()),
      item('How to play', 'ts-help', () => showHelp(cards, game)),
    );
    const status = aiLine(game);
    const foot = el('div', { class: 'ts-foot' }, status, deviceLine(game), game.install?.iosHint ? el('div', { class: 'ai-line', text: 'To play full screen: tap Share, then Add to Home Screen.' }) : null);

    // Your name: asked for when you start, on a slip that rises over the menu.
    const input = el('input', { class: 'ts-input', id: 'detective-name', type: 'text', placeholder: 'Detective', maxlength: '40', autocomplete: 'off', autocapitalize: 'words', spellcheck: 'false', enterkeyhint: 'go', value: savedName ?? '' });
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') begin();
      if (e.key === 'Escape') closeName();
    });
    const sheet = el(
      'div',
      { class: 'ts-sheet', role: 'dialog', 'aria-label': 'Your name', hidden: true },
      el('label', { class: 'ts-label', for: 'detective-name', text: 'Your name, Detective' }),
      input,
      el('div', { class: 'ts-note', text: hasSave ? 'Starting a new case replaces the one you have saved.' : 'People in the case will call you by it.' }),
      el('div', { class: 'ts-sheet-actions' }, el('button', { class: 'btn quiet ts-back', type: 'button', text: 'Back', onClick: () => closeName() }), el('button', { class: 'btn solid brass ts-start', type: 'button', text: 'Start the case', onClick: () => begin() })),
    );

    const main = el('div', { class: 'ts-main' }, kicker, title, rule, tag, menu);
    const card = el('section', { class: 'card title ts', 'aria-label': `${game.caseInfo.series}: ${game.caseInfo.title}` }, el('div', { class: 'ts-shade', 'aria-hidden': 'true' }), main, foot, sheet, veil);
    cards.append(card);

    const parts = { root: card, veil, kicker, the, name, rule, rest: [tag, ...menu.children, foot] };
    // Fit the name to the screen once its face has loaded: as large as it will go, never wider.
    // Measured on a loose copy of the word, so nothing on screen (a flex row, an animation) can skew it.
    const fit = () => {
      const pad = parseFloat(getComputedStyle(main).paddingLeft) + parseFloat(getComputedStyle(main).paddingRight);
      const room = Math.min(main.clientWidth - pad, 980);
      const probe = el('span', { text: 'INVIGILATOR', 'aria-hidden': 'true' });
      Object.assign(probe.style, { position: 'absolute', left: '-9999px', top: '0', whiteSpace: 'nowrap', fontFamily: getComputedStyle(name.word).fontFamily, fontWeight: '800', fontSize: '100px', letterSpacing: '0.015em' });
      document.body.append(probe);
      const w = probe.getBoundingClientRect().width || 800;
      probe.remove();
      // Never taller than about an eighth of the screen, so a phone on its side still has room for the menu.
      const tallest = Math.max(30, window.innerHeight * 0.13);
      name.word.style.fontSize = `${Math.max(28, Math.min(124, tallest, Math.floor((100 * room) / (w * 1.05))))}px`;
    };
    fit();
    document.fonts?.load?.('800 100px "Cinzel"').then(fit, () => {});
    window.addEventListener('resize', fit);
    const motion = playTitle(parts);
    Object.assign(parts, motion);

    function askName() {
      game.audio.unlock();
      sheet.hidden = false;
      card.classList.add('naming');
      gsap.fromTo(sheet, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: still() ? 0 : 0.5, ease: 'power3.out' });
      if (!game.isTouch) setTimeout(() => input.focus({ preventScroll: true }), 60);
      else input.focus({ preventScroll: true });
    }
    function closeName() {
      card.classList.remove('naming');
      gsap.to(sheet, { y: 30, autoAlpha: 0, duration: still() ? 0 : 0.3, ease: 'power2.in', onComplete: () => (sheet.hidden = true) });
      input.blur();
    }
    let leaving = false;
    async function finish(value) {
      if (leaving) return;
      leaving = true;
      game.audio.unlock();
      input.blur();
      window.removeEventListener('resize', fit);
      gsap.to(sheet, { autoAlpha: 0, duration: 0.25 });
      await leaveTitle(parts);
      card.remove();
      resolve(value);
    }
    function begin() {
      finish({ action: 'new', name: input.value.trim() || 'Detective' });
    }
  });
}

export function showHelp(cards, game) {
  return new Promise((resolve) => {
    const touch = game.isTouch;
    const items = [
      ['Move', touch ? 'Tap the floor, a marker or a person and you walk there. The ring at the bottom left steers by thumb if you prefer.' : 'Click the floor, a marker or a person and you walk there. Or use W A S D or the arrow keys.'],
      ['Turn', touch ? 'Drag anywhere on the picture.' : 'Hold the mouse button and drag. Press F for full mouse-look.'],
      ['Get around', `Look lists everyone and everything in the room: ${touch ? 'tap' : 'click'} a name and you walk straight to it. Map takes you between places.`],
      ['Examine', `Small rings of light mark what can be examined, and a ring with an arrow is a way out. ${touch ? 'Tap' : 'Click'} one. What matters is bagged as evidence. Look lights up everything in the room.`],
      ['Talk', `A ring with three dots over someone means you can talk to them. Ask anything, in your own words, ${touch ? 'tap' : 'click'} an underlined word in what they say to follow it up, or pick a suggested question. They remember. Some of them lie.`],
      ['Break a lie', `While talking, ${touch ? 'tap' : 'click'} Show to put a piece of evidence in front of someone. This is how you catch a lie. Read tells you what you notice about them. Log shows everything that was said.`],
      ['Papers', 'This is a puzzle game. Every puzzle you are set is kept in your notebook under Papers, with your solving tools. Type an answer; a wrong one costs nothing. Each paper has hints, and the last hint gives the answer.'],
      ['Look things up', 'The Lectern (the laptop at your desk) will teach you how any cipher or puzzle is done and where it came from. You are meant to use it, and to look things up outside the game too. It will not give you the answer.'],
      ['Notebook', 'Everything you establish is written down for you: objectives, evidence, people, leads. The Board tab is where you reason and, in the end, name the killer. Evidence goes to the lab from the Lectern.'],
      ['Map', 'Travel between places. When you have done all you can in a day, end the day from the map.'],
      ['Stuck?', 'Think gives you a hint about what to do next. It lowers your final rating a little.'],
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
      el('div', { class: 'card-inner help' }, el('div', { class: 'card-kicker', text: 'How to play' }), el('div', { class: 'rule' }), el('div', { class: 'help-grid' }, items.map(([h, p]) => el('div', { class: 'help-item' }, el('h4', { text: h }), el('p', { text: p })))), el('div', { class: 'card-actions' }, el('button', { class: 'btn solid', type: 'button', text: 'Understood', 'data-back': '', onClick: close }))),
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
      // The stylesheet slides a lit thumb under whichever is chosen.
      setThumb(wrap, options.findIndex(([value]) => value === current), options.length);
      options.forEach(([value, label], i) => {
        const b = el('button', { type: 'button', 'aria-pressed': String(value === current), text: label });
        b.addEventListener('click', () => {
          for (const x of wrap.children) x.setAttribute('aria-pressed', 'false');
          b.setAttribute('aria-pressed', 'true');
          setThumb(wrap, i, options.length);
          onPick(value);
        });
        add(wrap, b);
      });
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
      const note = ai.pref === 'auto' && ai.eased ? 'Auto has moved everyday talk to the fast model for now.' : 'Auto starts with Opus and moves everyday talk to the fast model if answers are slow. Opus acts best; Fast answers sooner.';
      rows.push(el('div', { class: 'setting' }, el('label', {}, 'Characters played by', el('small', { text: note })), seg([['auto', 'Auto'], ['opus', 'Opus'], ['quick', 'Fast']], ai.pref ?? 'auto', (v) => game.setAiPreference(v))));
    }
    const install = game.install;
    if (document.fullscreenEnabled && !install?.installed) {
      rows.push(el('div', { class: 'setting' }, el('label', { text: 'Full screen' }), seg([[true, 'On'], [false, 'Off']], !!document.fullscreenElement, (v) => game.setFullscreen(v))));
    }
    if (install?.canPrompt()) {
      const btn = el('button', { class: 'btn small', type: 'button', text: 'Install' });
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        if (await install.prompt()) btn.textContent = 'Installed';
        else btn.disabled = false;
      });
      rows.push(el('div', { class: 'setting' }, el('label', {}, 'Put it on your home screen', el('small', { text: 'Opens full screen, like any other app.' })), btn));
    } else if (install?.iosHint) {
      rows.push(el('div', { class: 'setting' }, el('label', {}, 'Put it on your home screen', el('small', { text: 'Tap Share in Safari, then Add to Home Screen. It opens full screen, like any other app.' }))));
    }
    // Something looks wrong: a few lines about this device and this game to send, copied in one tap.
    const diagHolder = el('div', { class: 'diag' });
    const diagBtn = el('button', { class: 'btn small', type: 'button', text: 'Copy diagnostics' });
    diagBtn.addEventListener('click', () => copyDiagnostics(game, diagBtn, diagHolder));
    rows.push(el('div', { class: 'setting' }, el('label', {}, 'Something look wrong?', el('small', { text: 'Copies a few lines about how the game is running on this device, to paste into a message. Nothing is sent anywhere.' })), diagBtn), diagHolder);
    const card = el(
      'section',
      { class: 'card veil', role: 'dialog', 'aria-label': 'Menu' },
      el(
        'div',
        { class: 'card-inner' },
        el('div', { class: 'card-kicker', text: 'Paused' }),
        el('h2', { class: 'card-title small', text: game.caseInfo.title }),
        el('div', { class: 'rule' }),
        el('div', { class: 'settings' }, rows),
        aiLine(game),
        el(
          'div',
          { class: 'card-actions' },
          el('button', { class: 'btn', type: 'button', text: 'How to play', onClick: () => showHelp(cards, game) }),
          game.view?.ending?.text ? el('button', { class: 'btn', type: 'button', text: 'Case report', onClick: () => close('report') }) : null,
          el('button', { class: 'btn quiet', type: 'button', text: 'Start over', onClick: () => close('new') }),
        ),
        // The way back stays in reach however far the settings scroll.
        el('div', { class: 'card-actions sticky' }, el('button', { class: 'btn solid', type: 'button', text: 'Back to the case', 'data-back': '', onClick: () => close(null) })),
      ),
    );
    cards.append(card);
    watchOverflow(card);
  });
}

/** A covering note in green ink, written out as it is read. `run(onText)` resolves to { body }. */
export function showLetter(cards, game, run) {
  return new Promise((resolve) => {
    const paper = el('div', { class: 'paper ink letter' }, el('div', { class: 'dots' }, el('i'), el('i'), el('i')));
    const go = el('button', { class: 'btn solid', type: 'button', text: 'Bag it', disabled: true });
    const card = el(
      'section',
      { class: 'card veil', role: 'dialog', 'aria-label': 'A letter' },
      el('div', { class: 'card-inner' }, el('div', { class: 'card-kicker', text: game.view.laptop?.letterKicker ?? 'By the Bellows · green ink' }), el('div', { class: 'rule' }), paper, el('div', { class: 'card-actions sticky' }, go)),
    );
    go.addEventListener('click', () => {
      card.remove();
      resolve();
    });
    cards.append(card);
    watchOverflow(card);
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
      el('div', { class: 'card-inner wide' }, el('div', { class: 'card-kicker', text: 'The morning after' }), el('h1', { class: 'card-title', text: 'After' }), el('div', { class: 'rule' }), text, report, actions),
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
          el('p', { class: 'report-line', text: ending.rankLine }),
          el('div', { class: 'section-label', text: `What you uncovered · ${found} of ${ending.truths.length}` }),
          ending.truths.map((t) => el('div', { class: `truth ${t.found ? '' : 'missed'}` }, icon(t.found ? 'check' : 'close', 16), t.label)),
          ending.puzzles ? el('div', { class: 'section-label', text: `Papers answered · ${ending.puzzles.solved} of ${ending.puzzles.of}` }) : null,
          ending.puzzles ? el('p', { class: 'note', text: [count(ending.puzzles.hints, 'hint taken', 'hints taken'), count(ending.puzzles.given, 'answer given away', 'answers given away')].join(' · ') }) : null,
          el('p', { class: 'note', text: [count(ending.stats.exchanges, 'question asked', 'questions asked'), count(ending.stats.hints, 'moment of thought', 'moments of thought'), count(ending.stats.wrong, 'wrong turn on the board', 'wrong turns on the board')].join(' · ') }),
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
