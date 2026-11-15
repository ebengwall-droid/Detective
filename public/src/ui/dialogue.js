// A conversation, staged rather than boxed.
//
// The other person fills the screen through a portrait lens. What they say
// arrives as one caption on a sheet of glass; words you could press them on
// are underlined, and tapping one asks about it. Your own questions are
// pills under the caption, or typed. There is no chat log on screen; the
// transcript is one tap away.

import { el, clear, icon } from './dom.js';

const HOT_MOODS = new Set(['angry', 'shaken', 'nervous', 'cold', 'breaking', 'wavering']);
/** How long a reply may take before the player is told why, and what they can do about it. */
const SLOW_MS = 10000;
let slowTipShown = false;
/** Why a line came from the script although Claude is playing the cast, in the player's words. */
const WHY = {
  rate_limited: 'Claude is at its limit for the moment, so that line came from the script. Give it a minute.',
  session_expired: 'You have been signed out of Claude, so people are keeping to their script.',
  resting: 'Claude has not been answering, so people are keeping to their script for a minute.',
  declined: 'Claude would not play that line, so it came from the script.',
  refused: 'Claude would not play that line, so it came from the script.',
};
const whyNote = (why) => WHY[why] ?? 'Claude did not answer that one, so this line is from the script.';
/** Long lines are set a little smaller so they still fit under a face. */
const sizeOf = (text) => (text.length > 320 ? 's' : text.length > 190 ? 'm' : 'l');

/**
 * Lay a spoken line out as nodes: asides (*between asterisks*) set apart,
 * and each thread a button on the words it quotes.
 * @param {string} text
 * @param {Array<{on: string, ask: string}>} threads
 * @param {(t: {on: string, ask: string}) => void} [pull]
 */
function speech(text, threads = [], pull = null) {
  const wrap = el('div', { class: 'cap-text' });
  const marks = [];
  if (pull) {
    for (const t of threads) {
      const i = text.indexOf(t.on);
      if (i >= 0 && !marks.some((m) => i < m.end && i + t.on.length > m.start)) marks.push({ start: i, end: i + t.on.length, t });
    }
    marks.sort((a, b) => a.start - b.start);
  }
  let p = el('p');
  const put = (from, to, aside) => {
    let at = from;
    const plain = (a, b) => {
      if (b <= a) return;
      const lines = text.slice(a, b).split('\n');
      lines.forEach((line, i) => {
        if (i) {
          if (!line && !lines[i - 1]) return;
          p.append(el('br'));
        }
        if (line) p.append(aside ? el('em', { text: line }) : line);
      });
    };
    for (const m of marks) {
      if (m.end <= from || m.start >= to || aside) continue;
      plain(at, m.start);
      // A span, not a button: a thread is part of the sentence and has to be able to wrap with it.
      const b = el('span', { class: 'thread', role: 'button', tabindex: '0', title: m.t.ask, 'aria-label': `${m.t.on}: ${m.t.ask}`, text: text.slice(m.start, m.end) });
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        pull(m.t, b);
      });
      b.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        e.stopPropagation();
        pull(m.t, b);
      });
      p.append(b);
      at = m.end;
    }
    plain(at, to);
  };
  // Split on asides, keeping positions.
  const re = /\*[^*\n]+\*/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    put(last, m.index, false);
    put(m.index + 1, m.index + m[0].length - 1, true);
    last = m.index + m[0].length;
  }
  put(last, text.length, false);
  wrap.append(p);
  return wrap;
}

export function createDialogue(panels, game) {
  let root = null;
  let current = null; // { id, name, finale, phone }
  let busy = false;
  let abort = null;
  let caption, capBody, youEl, chips, input, sendBtn, moodEl, turnsEl, noteEl, log, picker, transcript, stage, liveEl, railEl;
  let typing = null;
  let watcher = null;

  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function logLine(entry) {
    let node;
    if (entry.who === 'npc') node = el('div', { class: 'line npc' }, speech(entry.text));
    else if (entry.who === 'show') node = el('div', { class: 'line show' }, icon('bag', 15), `You show: ${entry.text}`);
    else if (entry.who === 'note') node = el('div', { class: 'line note', text: entry.text });
    else node = el('div', { class: 'line you', text: entry.text });
    log.append(node);
    return node;
  }

  function setChips(list, lost = false) {
    clear(chips);
    chips.hidden = !list?.length;
    chips.classList.toggle('nudge', !!lost);
    (list ?? []).forEach((q, i) => {
      const b = el('button', { class: 'chip', type: 'button', text: q, style: { animationDelay: `${i * 55}ms` }, onClick: () => send(q) });
      chips.append(b);
    });
  }

  function setMood(mood) {
    const word = mood && mood !== 'calm' ? mood : '';
    moodEl.textContent = word;
    moodEl.hidden = !word;
    root?.setAttribute('data-mood', mood ?? 'calm');
    moodEl.classList.toggle('hot', HOT_MOODS.has(mood));
    if (current) game.world.setMood(current.id, mood);
  }

  function setBusy(on) {
    busy = on;
    sendBtn.disabled = on;
    root?.classList.toggle('busy', on);
  }

  function setNote(text) {
    noteEl.textContent = text ?? '';
    noteEl.hidden = !text;
  }

  function showYou(text, shown) {
    clear(youEl);
    youEl.hidden = !text && !shown;
    if (shown) youEl.append(el('span', { class: 'you-show' }, icon('bag', 14), shown));
    if (text) youEl.append(el('span', { class: 'you-text', text }));
  }

  /** Is there more of the line below the fold? Then say so, rather than cut it off. */
  function fit() {
    if (!capBody) return;
    const over = capBody.scrollHeight - capBody.clientHeight > 6;
    const atEnd = capBody.scrollTop + capBody.clientHeight >= capBody.scrollHeight - 6;
    caption.classList.toggle('more', over && !atEnd);
  }

  /**
   * Keep the caption at least this tall for now. The camera frames the speaker in what the caption
   * leaves free, so a caption that collapsed to three dots and sprang back with every answer would
   * have the picture bobbing up and down all conversation long.
   */
  function hold(px) {
    capBody.style.minHeight = px ? `${Math.round(px)}px` : '';
  }

  /** Put a finished line in the caption, threads live. */
  function setCaption(text, threads = []) {
    typing?.stop();
    typing = null;
    hold(0);
    caption.dataset.size = sizeOf(text);
    capBody.replaceChildren(speech(text, threads, busy ? null : pullThread));
    capBody.scrollTop = 0;
    caption.classList.remove('pending', 'aside');
    fit();
  }

  /** Who is playing the cast right now: it can change mid-conversation (a refusal of permission, a switch to faster replies). */
  function paintLive() {
    if (!liveEl) return;
    const ai = game.client.ai;
    const scripted = !ai?.live;
    const why = scripted
      ? `${ai?.reason ?? 'No model is connected here'}, so people follow a script. Tap an underlined word, or ask a short question.`
      : `Played live by ${ai.label ?? 'Claude'}. Ask anything, in your own words.`;
    liveEl.className = `talk-live ${scripted ? 'off' : 'on'}`;
    liveEl.title = why;
    liveEl.setAttribute('aria-label', why);
    liveEl.replaceChildren(el('i'), scripted ? 'Script' : 'Live');
    liveEl.onclick = () => setNote(why);
    if (input && !current?.finale) input.placeholder = scripted ? 'Ask in a few words…' : 'Ask anything…';
  }

  /** Reveal a line a few letters at a time; a tap finishes it. */
  function typeOut(text, threads) {
    return new Promise((resolve) => {
      if (reduced()) {
        setCaption(text, threads);
        resolve();
        return;
      }
      caption.classList.remove('pending', 'aside');
      caption.dataset.size = sizeOf(text);
      // Make room for the whole line before the first letter, so the picture settles once.
      hold(0);
      capBody.replaceChildren(speech(text));
      hold(capBody.offsetHeight);
      capBody.replaceChildren();
      capBody.scrollTop = 0;
      const start = performance.now();
      const cps = 70;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        caption.removeEventListener('click', finish);
        typing = null;
        setCaption(text, threads);
        resolve();
      };
      typing = { stop: () => { done = true; caption.removeEventListener('click', finish); resolve(); } };
      caption.addEventListener('click', finish);
      const tick = () => {
        if (done) return;
        const n = Math.floor(((performance.now() - start) / 1000) * cps);
        if (n >= text.length) return finish();
        // Do not stop inside an aside: an unclosed asterisk would flash on screen.
        let shown = text.slice(0, n);
        if ((shown.match(/\*/g) ?? []).length % 2) shown = shown.slice(0, shown.lastIndexOf('*'));
        capBody.replaceChildren(speech(shown));
        fit();
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  /** The word you pulled lifts off the line and becomes your question. */
  function fly(from, text) {
    const to = youEl?.querySelector('.you-text');
    if (!to || !root || reduced() || typeof to.animate !== 'function') return;
    try {
      const base = root.getBoundingClientRect();
      const end = to.getBoundingClientRect();
      const ghost = el('span', { class: 'thread-ghost', text, 'aria-hidden': 'true' });
      ghost.style.left = `${from.left - base.left}px`;
      ghost.style.top = `${from.top - base.top}px`;
      root.append(ghost);
      const dx = end.left + end.width / 2 - (from.left + from.width / 2);
      const dy = end.top + end.height / 2 - (from.top + from.height / 2);
      to.animate([{ opacity: 0, transform: 'scale(0.86)' }, { opacity: 1, transform: 'none' }], { duration: 360, delay: 190, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' });
      const done = () => ghost.remove();
      ghost.animate([{ transform: 'translate(0, 0) scale(1)', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(0.78)`, opacity: 0.1 }], { duration: 430, easing: 'cubic-bezier(0.5, 0, 0.2, 1)' }).finished.then(done, done);
    } catch {
      /* a flourish, not a function */
    }
  }

  function pullThread(t, source) {
    if (busy) return;
    game.buzz?.(8);
    const from = source?.getBoundingClientRect?.();
    send(t.ask);
    if (from?.width) fly(from, source.textContent);
  }

  /** Run one exchange: show the player's side, stream the reply, apply results. */
  async function exchange(run, { youText, showName }) {
    if (busy || !current) return;
    setBusy(true);
    setChips([]);
    setNote(null);
    if (showName) logLine({ who: 'show', text: showName });
    if (youText) logLine({ who: 'you', text: youText });
    showYou(youText, showName ? `You show: ${showName}` : null);
    typing?.stop();
    typing = null;
    caption.classList.remove('aside', 'more');
    // While they think, the caption keeps some of the room the last line had: enough that the
    // picture does not jump, not so much that an empty sheet of glass sits under their face.
    hold(Math.min(capBody.offsetHeight, 96));
    caption.classList.add('pending');
    capBody.replaceChildren(el('div', { class: 'dots' }, el('i'), el('i'), el('i')));
    abort = new AbortController();
    let streamed = false;
    const who = current.id;
    game.world.setTalking(who, false);
    game.world.setThinking?.(who, true);
    const ai = game.client.ai;
    // A live reply takes a moment. They do not stand there like a loading screen: they do what they do when they think.
    const beats = current.beats ?? [];
    const beat = setTimeout(() => {
      if (streamed || !current || !beats.length || !ai?.live || !caption.classList.contains('pending')) return;
      const line = beats[(current.beatAt = (current.beatAt ?? -1) + 1) % beats.length];
      const node = speech(line);
      node.classList.add('beat');
      capBody.prepend(node);
    }, 1300);
    // The best model thinks before it speaks. Say so once, and offer the quicker one.
    const slow = setTimeout(() => {
      if (streamed || slowTipShown || !ai?.live) return;
      slowTipShown = true;
      setNote(ai.hosted && ai.pref === 'opus' ? 'Claude Opus thinks before it answers. For quicker replies, choose Fast in the menu.' : 'Still thinking…');
    }, SLOW_MS);
    try {
      const res = await run({
        signal: abort.signal,
        onText: (soFar) => {
          if (!current) return;
          if (!streamed) {
            streamed = true;
            caption.classList.remove('pending');
            game.world.setThinking?.(who, false);
            game.world.setTalking(who, true);
            game.audio.blip();
            setNote(null);
          }
          let shown = soFar;
          if ((shown.match(/\*/g) ?? []).length % 2) shown = shown.slice(0, shown.lastIndexOf('*'));
          caption.dataset.size = sizeOf(shown);
          capBody.replaceChildren(speech(shown));
          fit();
        },
      });
      game.world.setThinking?.(who, false);
      // Walked away at the very moment the answer landed: there is nobody to show it to.
      if (!current) return;
      const reply = res.reply;
      busy = false; // threads may be pulled as soon as the line is whole
      if (streamed) setCaption(reply.say, reply.threads ?? []);
      else {
        // Scripted replies arrive whole; give them the same unhurried delivery.
        game.world.setTalking(who, true);
        game.audio.blip();
        await typeOut(reply.say, reply.threads ?? []);
      }
      if (!current) return;
      logLine({ who: 'npc', text: reply.say });
      game.world.setTalking(who, false);
      setMood(reply.mood);
      setNote(reply.degraded ? whyNote(reply.why) : null);
      paintLive();
      if (res.turnsLeft !== undefined && !reply.ended) turnsEl.textContent = res.turnsLeft <= 3 ? `${res.turnsLeft} exchange${res.turnsLeft === 1 ? '' : 's'} before midnight` : '';
      if (reply.ended) {
        setChips([]);
        input.disabled = true;
        sendBtn.disabled = true;
        root?.classList.remove('busy');
        root?.classList.add('ended');
        const leave = el('div', { class: 'line note' }, el('button', { class: 'btn solid', type: 'button', text: current.finale ? 'It is over' : 'They have gone', onClick: () => api.close() }));
        chips.hidden = false;
        chips.replaceChildren(leave);
        return;
      }
      setChips(res.suggestions, reply.lost);
      // A scripted character who had no line for that: say why, and point at what they can answer.
      if (reply.lost && !game.client.ai?.live) {
        setNote(res.suggestions?.length ? 'Without Claude, people only know their lines. Try one of the questions below.' : 'Without Claude, people only know their lines. Ask about the case in a few plain words.');
      }
    } catch (err) {
      // Walking away mid-answer is not an error worth reporting.
      if (!abort.signal.aborted) {
        setCaption('…');
        setNote(err.message || 'Something went wrong. Try again.');
      }
      if (current) game.world.setTalking(current.id, false);
    } finally {
      clearTimeout(slow);
      clearTimeout(beat);
      game.world.setThinking?.(who, false);
    }
    // If who is playing the cast has just changed, say so where the player is looking.
    const news = game.aiChanged?.();
    if (news && current) {
      setNote(news);
      paintLive();
    }
    setBusy(false);
    if (!game.isTouch) input.focus({ preventScroll: true });
  }

  function send(text) {
    const value = (text ?? input.value).trim();
    if (!value || busy) return;
    input.value = '';
    input.style.height = '';
    const method = current.finale ? 'finaleSay' : 'say';
    exchange((hooks) => game.call(method, { id: current.id, text: value }, hooks), { youText: value });
  }

  function present(item) {
    closePicker();
    const note = input.value.trim();
    input.value = '';
    exchange((hooks) => game.call('present', { id: current.id, item: item.id, text: note }, hooks), { youText: note || null, showName: item.name });
  }

  function openPicker() {
    if (busy || current.finale) return;
    closeTranscript();
    const items = game.view.presentables;
    const list = el('div', { class: 'pick-list' });
    if (!items.length) list.append(el('div', { class: 'empty', text: 'You have nothing to show yet. Examine things in the world to collect evidence.' }));
    for (const item of items) {
      list.append(
        el('button', { class: 'pick', type: 'button', onClick: () => present(item) }, icon(item.icon ?? 'doc', 20), el('div', {}, el('div', { class: 'pick-name', text: item.name }), el('div', { class: 'pick-desc', text: item.desc }))),
      );
    }
    picker = el(
      'div',
      { class: 'talk-sheet picker' },
      el('div', { class: 'talk-sheet-head' }, el('div', { class: 'talk-sheet-title', text: `Show ${current.name.split(' ').slice(-1)[0]} something` }), el('button', { class: 'xbtn', type: 'button', 'aria-label': 'Back', 'data-back': '', onClick: closePicker }, icon('close'))),
      list,
    );
    root.append(picker);
  }

  function closePicker() {
    picker?.remove();
    picker = null;
  }

  function openTranscript() {
    if (transcript) return closeTranscript();
    closePicker();
    transcript = el(
      'div',
      { class: 'talk-sheet transcript' },
      el('div', { class: 'talk-sheet-head' }, el('div', { class: 'talk-sheet-title', text: 'What was said' }), el('button', { class: 'xbtn', type: 'button', 'aria-label': 'Back', 'data-back': '', onClick: closeTranscript }, icon('close'))),
      log,
    );
    log.hidden = false;
    root.append(transcript);
    log.scrollTop = log.scrollHeight;
  }

  function closeTranscript() {
    if (!transcript) return;
    log.hidden = true;
    root.append(log);
    transcript.remove();
    transcript = null;
  }

  async function observe() {
    if (busy || current.finale || current.phone) return;
    try {
      const res = await game.call('observe', { id: current.id });
      logLine({ who: 'note', text: res.text });
      showYou(null, null);
      setCaption(`*${res.text.replace(/\*/g, '')}*`);
      caption.classList.add('aside');
      fit();
    } catch (err) {
      setNote(err.message);
    }
  }

  const api = {
    get isOpen() {
      return !!root;
    },

    /** @param {any} talk result.talk from the game */
    show(talk, look) {
      api.close(true);
      current = { id: talk.id, name: talk.name, finale: !!talk.finale, phone: !!talk.phone, beats: talk.beats ?? [] };
      const ai = game.client.ai;
      moodEl = el('span', { class: 'talk-mood', hidden: true });
      turnsEl = el('div', { class: 'dlg-turns' });
      noteEl = el('div', { class: 'talk-note', hidden: true, role: 'status' });
      log = el('div', { class: 'dlg-log', role: 'log', hidden: true });
      chips = el('div', { class: 'chips', role: 'group', 'aria-label': 'Things you could ask' });
      youEl = el('div', { class: 'talk-you', hidden: true });
      capBody = el('div', { class: 'cap-body', role: 'log', 'aria-live': 'polite' });
      const scripted = !ai?.live;
      const more = el('button', { class: 'cap-more', type: 'button', 'aria-label': 'Read on', onClick: (e) => {
        e.stopPropagation();
        capBody.scrollBy({ top: capBody.clientHeight * 0.8, behavior: reduced() ? 'auto' : 'smooth' });
      } }, el('i'));
      capBody.addEventListener('scroll', fit, { passive: true });
      input = el('textarea', {
        id: 'say-input',
        rows: '1',
        placeholder: talk.finale ? 'Say something true…' : scripted ? 'Ask in a few words…' : 'Ask anything…',
        autocomplete: 'off',
        enterkeyhint: 'send',
        maxlength: '500',
      });
      sendBtn = el('button', { class: 'talk-send', type: 'button', 'aria-label': 'Say it' }, icon('send'));
      sendBtn.addEventListener('click', () => send());
      input.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Escape') {
          if (picker) closePicker();
          else if (transcript) closeTranscript();
          else api.close();
          return;
        }
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          send();
        }
      });
      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = `${Math.min(96, input.scrollHeight)}px`;
      });

      // Who you are talking to: a name floating by them, not a title bar.
      const plate = el(
        'div',
        { class: 'talk-plate' },
        el('span', { class: 'talk-dot', 'aria-hidden': 'true' }),
        el('div', { class: 'talk-who' }, el('div', { class: 'talk-name' }, talk.name, moodEl), el('div', { class: 'talk-role', text: talk.phone ? 'On the telephone' : talk.short })),
      );
      const close = el('button', { class: 'talk-close', type: 'button', 'aria-label': 'End conversation', 'data-back': '', onClick: () => api.close() }, icon('close'));
      // Whether somebody is improvising or reading their lines: said plainly, and explained on a tap.
      liveEl = el('button', { class: 'talk-live', type: 'button' });
      const top = el('div', { class: 'talk-top' }, plate, el('div', { class: 'talk-top-right' }, liveEl, close));

      // The things you can do besides speak float beside them, a thumb's reach from the caption.
      const tool = (label, name, glyph, onClick) =>
        el('button', { class: 'talk-tool', type: 'button', 'aria-label': name, title: name, onClick }, icon(glyph, 19), el('span', { class: 'tool-label', 'aria-hidden': 'true', text: label }));
      const rail = (railEl = el(
        'div',
        { class: 'talk-rail', role: 'toolbar', 'aria-label': 'Besides talking' },
        talk.finale || talk.phone ? null : tool('Read', 'Size them up', 'eye', observe),
        talk.finale ? null : tool('Show', 'Show evidence', 'bag', openPicker),
        tool('Log', 'What was said', 'notebook', openTranscript),
      ));
      caption = el('div', { class: 'talk-caption' }, youEl, el('div', { class: 'cap-speaker', text: talk.name.split(' ').slice(-2).join(' ') }), capBody, more, noteEl);
      stage = el('div', { class: 'talk-stage' }, rail, caption, turnsEl, chips, el('div', { class: 'talk-bar' }, el('div', { class: 'talk-input' }, input, sendBtn)));
      root = el('section', { class: `dialogue talk ${talk.finale ? 'finale' : ''}`, role: 'dialog', 'aria-label': `Talking to ${talk.name}`, 'data-mood': talk.mood ?? 'calm' }, el('div', { class: 'talk-shade', 'aria-hidden': 'true' }), top, stage, log);
      panels.append(root);
      // The caption grows and shrinks with what is said: keep the face framed in whatever is left above it.
      if (typeof ResizeObserver === 'function') {
        let queued = 0;
        watcher = new ResizeObserver(() => {
          cancelAnimationFrame(queued);
          queued = requestAnimationFrame(() => {
            fit();
            if (current && !current.phone) game.frameTalk?.(current.id);
          });
        });
        watcher.observe(stage);
      }
      paintLive();

      for (const entry of (talk.greeting ? talk.log.slice(0, -1) : talk.log).slice(-30)) logLine(entry);
      setMood(talk.mood);
      const threads = talk.threads ?? [];
      const said = talk.log.filter((e) => e.who === 'npc');
      const opening = talk.greeting ?? said[said.length - 1]?.text ?? '';
      if (talk.greeting) {
        logLine({ who: 'npc', text: talk.greeting });
        game.world.setTalking(talk.id, true);
        typeOut(talk.greeting, threads).then(() => current && game.world.setTalking(talk.id, false));
      } else if (opening) setCaption(opening, []);
      // Say it once: showing evidence is how lies come apart, and the button is easy to miss.
      if (!talk.finale && game.view.presentables.length && !game.settings.tipShow) {
        setNote('You have evidence. Tap Show to show it to them. It is the best way to catch a lie.');
        game.setSetting('tipShow', true);
      } else if (!talk.finale && !game.settings.tipThread && threads.length) {
        setNote('Underlined words are threads. Tap one to ask about it.');
        game.setSetting('tipThread', true);
      }
      setChips(talk.suggestions);
      if (!game.isTouch) setTimeout(() => input?.focus({ preventScroll: true }), 250);
    },

    close(silent = false) {
      if (!root) return;
      abort?.abort();
      typing?.stop();
      typing = null;
      watcher?.disconnect();
      watcher = null;
      const was = current;
      if (was) game.world.setThinking?.(was.id, false);
      root.remove();
      root = null;
      liveEl = null;
      railEl = null;
      picker = null;
      transcript = null;
      current = null;
      busy = false;
      if (!silent) game.dialogueClosed(was);
    },

    /**
     * The part of the screen the conversation covers, so the camera can frame
     * the speaker in what is left: the lower block when it sits under them,
     * the right-hand block when it sits beside them.
     */
    rect() {
      if (!stage) return null;
      const r = stage.getBoundingClientRect();
      const beside = r.left > window.innerWidth * 0.3;
      if (beside) return { width: window.innerWidth - r.left, height: window.innerHeight, rail: 0 };
      // Under them, with a rail of buttons up the right-hand edge of the picture.
      const rr = railEl && railEl.offsetParent !== null ? railEl.getBoundingClientRect() : null;
      return { width: window.innerWidth, height: window.innerHeight - r.top, rail: rr && rr.width ? (window.innerWidth - rr.left) / window.innerWidth : 0 };
    },

    /** The on-screen keyboard is up: keep the caption short so the face stays in view. */
    setKeyboard(on) {
      root?.classList.toggle('kb', on);
    },
  };
  return api;
}
