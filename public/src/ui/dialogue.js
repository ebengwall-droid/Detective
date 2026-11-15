// The conversation panel: a transcript, suggested questions, free typing,
// and putting evidence on the table.

import { el, clear, icon, prose } from './dom.js';

const HOT_MOODS = new Set(['angry', 'shaken', 'nervous', 'cold', 'breaking', 'wavering']);
/** How long a reply may take before the player is told why, and what they can do about it. */
const SLOW_MS = 10000;
let slowTipShown = false;

export function createDialogue(panels, game) {
  let panel = null;
  let current = null; // { id, name, finale, phone }
  let busy = false;
  let abort = null;
  let log, chips, input, sendBtn, moodEl, turnsEl, picker;

  function lineNode(entry) {
    if (entry.who === 'npc') {
      const node = el('div', { class: 'line npc' });
      node.append(prose(entry.text));
      return node;
    }
    if (entry.who === 'show') return el('div', { class: 'line show' }, icon('bag', 15), `You show: ${entry.text}`);
    if (entry.who === 'note') return el('div', { class: 'line note', text: entry.text });
    return el('div', { class: 'line you', text: entry.text });
  }

  function scrollDown() {
    log.scrollTop = log.scrollHeight;
  }

  function setChips(list) {
    clear(chips);
    chips.hidden = !list?.length;
    for (const q of list ?? []) {
      chips.append(el('button', { class: 'chip', type: 'button', text: q, onClick: () => send(q) }));
    }
  }

  function setMood(mood) {
    moodEl.textContent = mood && mood !== 'calm' ? mood : '';
    moodEl.classList.toggle('hot', HOT_MOODS.has(mood));
    if (current) game.world.setMood(current.id, mood);
  }

  function setBusy(on) {
    busy = on;
    sendBtn.disabled = on;
    panel?.classList.toggle('busy', on);
  }

  /** Run one exchange: show the player's side, stream the reply, apply results. */
  async function exchange(run, { youText, showName }) {
    if (busy || !current) return;
    setBusy(true);
    setChips([]);
    if (showName) log.append(lineNode({ who: 'show', text: showName }));
    if (youText) log.append(lineNode({ who: 'you', text: youText }));
    const pending = el('div', { class: 'line npc pending' }, el('div', { class: 'dots' }, el('i'), el('i'), el('i')));
    log.append(pending);
    scrollDown();
    abort = new AbortController();
    let streamed = false;
    game.world.setTalking(current.id, false);
    // The best model thinks before it speaks. Say so once, and offer the quicker one.
    const ai = game.client.ai;
    const slow = setTimeout(() => {
      if (streamed || slowTipShown || !ai?.live) return;
      slowTipShown = true;
      const tip = ai.hosted && ai.pref !== 'quick' ? 'Claude Opus thinks before it answers. For quicker replies, choose Fast in the menu.' : 'Still thinking…';
      pending.append(el('div', { class: 'slow-tip', text: tip }));
      scrollDown();
    }, SLOW_MS);
    try {
      const res = await run({
        signal: abort.signal,
        onText: (soFar) => {
          if (!streamed) {
            streamed = true;
            pending.classList.remove('pending');
            game.world.setTalking(current.id, true);
            game.audio.blip();
          }
          pending.replaceChildren(prose(soFar));
          scrollDown();
        },
      });
      const reply = res.reply;
      pending.classList.remove('pending');
      if (streamed) {
        pending.replaceChildren(prose(reply.say));
      } else {
        // Scripted replies arrive whole; give them the same unhurried delivery.
        game.world.setTalking(current.id, true);
        await typeOut(pending, reply.say);
      }
      game.world.setTalking(current.id, false);
      setMood(reply.mood);
      if (reply.degraded) log.append(lineNode({ who: 'note', text: 'Claude could not be reached for this line, so it comes from the script.' }));
      if (res.turnsLeft !== undefined && !reply.ended) turnsEl.textContent = res.turnsLeft <= 3 ? `${res.turnsLeft} exchange${res.turnsLeft === 1 ? '' : 's'} before midnight` : '';
      scrollDown();
      if (reply.ended) {
        setChips([]);
        input.disabled = true;
        sendBtn.disabled = true;
        log.append(el('div', { class: 'line note' }, el('button', { class: 'btn small', type: 'button', text: current.finale ? 'It is over' : 'They have gone', onClick: () => api.close() })));
        scrollDown();
        busy = false;
        panel?.classList.remove('busy');
        return;
      }
      setChips(res.suggestions);
    } catch (err) {
      pending.remove();
      // Walking away mid-answer is not an error worth reporting.
      if (!abort.signal.aborted) log.append(lineNode({ who: 'note', text: err.message || 'Something went wrong. Try again.' }));
      if (current) game.world.setTalking(current.id, false);
    } finally {
      clearTimeout(slow);
    }
    setBusy(false);
    if (!game.isTouch) input.focus({ preventScroll: true });
  }

  function typeOut(node, text) {
    return new Promise((resolve) => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        node.replaceChildren(prose(text));
        resolve();
        return;
      }
      const start = performance.now();
      const cps = 85;
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        node.replaceChildren(prose(text));
        node.removeEventListener('click', finish);
        resolve();
      };
      node.addEventListener('click', finish);
      const tick = () => {
        if (finished) return;
        const n = Math.floor(((performance.now() - start) / 1000) * cps);
        if (n >= text.length) return finish();
        node.replaceChildren(prose(text.slice(0, n)));
        scrollDown();
        requestAnimationFrame(tick);
      };
      tick();
    });
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
      { class: 'picker' },
      el('div', { class: 'panel-head' }, el('div', { class: 'panel-title', text: `Show ${current.name.split(' ').slice(-1)[0]} something` }), el('button', { class: 'xbtn', type: 'button', 'aria-label': 'Back', 'data-back': '', onClick: closePicker }, icon('close'))),
      list,
    );
    panel.append(picker);
  }

  function closePicker() {
    picker?.remove();
    picker = null;
  }

  async function observe() {
    if (busy || current.finale || current.phone) return;
    try {
      const res = await game.call('observe', { id: current.id });
      log.append(lineNode({ who: 'note', text: res.text }));
      scrollDown();
    } catch (err) {
      log.append(lineNode({ who: 'note', text: err.message }));
    }
  }

  const api = {
    get isOpen() {
      return !!panel;
    },

    /** @param {any} talk result.talk from the game */
    show(talk, look) {
      api.close(true);
      current = { id: talk.id, name: talk.name, finale: !!talk.finale, phone: !!talk.phone };
      moodEl = el('span', { class: 'mood' });
      turnsEl = el('div', { class: 'dlg-turns' });
      log = el('div', { class: 'dlg-log', role: 'log', 'aria-live': 'polite' });
      chips = el('div', { class: 'chips' });
      input = el('textarea', { id: 'say-input', rows: '1', placeholder: talk.finale ? 'Say something true…' : 'Ask anything…', autocomplete: 'off', enterkeyhint: 'send', maxlength: '500' });
      sendBtn = el('button', { class: 'ibtn', type: 'button', 'aria-label': 'Say it' }, icon('send'));
      sendBtn.addEventListener('click', () => send());
      input.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Escape') {
          if (picker) closePicker();
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
        input.style.height = `${Math.min(110, input.scrollHeight)}px`;
      });
      const portrait = el('img', { class: 'portrait', alt: '', src: look ? game.world.portrait(look) : '' });
      const head = el(
        'div',
        { class: 'dlg-head' },
        portrait,
        el('div', { class: 'dlg-who' }, el('div', { class: 'dlg-name' }, talk.name, moodEl), el('div', { class: 'dlg-role', text: talk.phone ? 'On the telephone' : talk.short })),
        talk.finale || talk.phone ? null : el('button', { class: 'ibtn tool', type: 'button', 'aria-label': 'Size them up', title: 'Size them up', onClick: observe }, icon('eye'), el('span', { class: 'tool-cap', text: 'Observe' })),
        talk.finale ? null : el('button', { class: 'ibtn tool', type: 'button', 'aria-label': 'Show evidence', title: 'Show evidence', onClick: openPicker }, icon('bag'), el('span', { class: 'tool-cap', text: 'Show' })),
        el('button', { class: 'xbtn', type: 'button', 'aria-label': 'End conversation', 'data-back': '', onClick: () => api.close() }, icon('close')),
      );
      panel = el('section', { class: 'panel dialogue', role: 'dialog', 'aria-label': `Talking to ${talk.name}` }, head, log, turnsEl, chips, el('div', { class: 'dlg-input' }, input, sendBtn));
      panels.append(panel);
      // Earlier lines first, dimmed by a divider, then the greeting.
      const history = talk.greeting ? talk.log.slice(0, -1) : talk.log;
      for (const entry of history.slice(-14)) log.append(lineNode(entry));
      if (history.length) log.append(lineNode({ who: 'note', text: '· · ·' }));
      if (talk.greeting) {
        const g = el('div', { class: 'line npc' });
        log.append(g);
        game.world.setTalking(talk.id, true);
        typeOut(g, talk.greeting).then(() => game.world.setTalking(talk.id, false));
      }
      // Say it once: showing evidence is how lies come apart, and the button is easy to miss.
      if (!talk.finale && game.view.presentables.length && !game.settings.tipShow) {
        log.append(lineNode({ who: 'note', text: 'You are holding evidence. Show puts a piece of it in front of them; people who are lying tend to stop.' }));
        game.setSetting('tipShow', true);
      }
      setMood(talk.mood);
      setChips(talk.suggestions);
      scrollDown();
      if (!game.isTouch) setTimeout(() => input.focus({ preventScroll: true }), 250);
    },

    close(silent = false) {
      if (!panel) return;
      abort?.abort();
      const was = current;
      panel.remove();
      panel = null;
      picker = null;
      current = null;
      busy = false;
      if (!silent) game.dialogueClosed(was);
    },

    /** Where the panel is on screen, so the camera can frame the speaker in what is left. */
    rect() {
      return panel?.getBoundingClientRect() ?? null;
    },

    /** The on-screen keyboard is up: give the panel the whole visible area. */
    setKeyboard(on) {
      panel?.classList.toggle('kb', on);
      if (on) setTimeout(scrollDown, 60);
    },
  };
  return api;
}
