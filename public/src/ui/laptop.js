// The Lectern: the detective's desk terminal. Call Milo, the tech at Ravel CID, to be shown
// how something works; keep the cards he finds; and send things to the lab.

import { el, add, clear, icon, leave, setThumb } from './dom.js';
import { drawLesson } from './lessons.js';
import { enlargePicture } from './guide.js';
import { createCall } from './call.js';
import { mountDemo, hasDemo } from './demo-player.js';

/** A lecture starts with its title in capitals; under the card's own title that line says it twice. */
function withoutHeading(body) {
  const [first, ...rest] = body.split('\n');
  return first === first.toUpperCase() && /[A-Z]/.test(first) && rest.length ? rest.join('\n') : body;
}

export function createLaptop(panels, game) {
  let panel = null;
  let scrim = null;
  let tab = 'call';
  let body, tabBar;
  let call = null;
  /** Cards already shown once: the rest are marked new. */
  const seen = new Set();
  /** How-tos playing on cards, stopped when the cards are drawn again. */
  const playing = new Set();

  const tabs = [
    { id: 'call', label: 'Call Milo' },
    { id: 'records', label: 'Cards' },
    { id: 'lab', label: 'Lab' },
  ];

  function renderTabs() {
    const v = game.view;
    clear(tabBar);
    setThumb(tabBar, tabs.findIndex((t) => t.id === tab), tabs.length);
    for (const t of tabs) {
      const n = t.id === 'records' ? v.records.length : t.id === 'lab' ? v.evidence.filter((e) => e.lab).length : 0;
      add(tabBar, el('button', { class: 'tab', type: 'button', role: 'tab', 'aria-selected': String(tab === t.id), onClick: () => api.open(t.id) }, t.label, n ? el('span', { class: 'count', text: String(n) }) : null));
    }
  }

  function stopPlaying() {
    for (const d of playing) d.dispose();
    playing.clear();
  }

  /**
   * A card from the shelf. A lesson shows its picture (or, tapped, its how-to playing) and a
   * few plain sentences; the full lecture waits behind Read more. Other cards show in full.
   */
  function recordNode(rec) {
    const pic = rec.pic ? drawLesson(rec.pic) : null;
    const lesson = rec.id.startsWith('l_') ? rec.id.slice(2) : null;
    const figure = pic
      ? el(
          'figure',
          { class: 'rec-fig' },
          // The caption is read aloud and shown when the picture is enlarged; on the card the few sentences under it say the same.
          el('button', { class: 'rec-pic', type: 'button', 'aria-label': `${pic.caption} Tap to see it larger.`, onClick: () => enlargePicture(pic.svg, pic.caption, panels.parentElement?.querySelector('#cards') ?? panels) }, pic.svg),
        )
      : null;
    const holder = el('div', { class: 'rec-demo' });
    const watch =
      lesson && hasDemo(lesson)
        ? el('button', {
            class: 'btn small solid rec-watch',
            type: 'button',
            text: 'Watch how it works',
            onClick: () => {
              figure?.remove();
              watch.remove();
              const d = mountDemo(holder, lesson, { audio: game.audio });
              if (d) playing.add(d);
            },
          })
        : null;
    const inner = rec.short
      ? [holder, figure, watch, el('p', { class: 'rec-short', text: rec.short }), el('details', { class: 'rec-more' }, el('summary', { text: 'Read more' }), el('div', { class: 'rec-body', text: withoutHeading(rec.body) }))]
      : [figure, el('div', { class: 'rec-body', text: rec.body })];
    const d = el('details', { class: `rec ${seen.has(rec.id) ? '' : 'new'}` }, el('summary', { text: rec.title.replace(/^Lecture · /, '') }), el('div', { class: 'rec-inner' }, inner));
    d.addEventListener('toggle', () => {
      if (d.open) d.classList.remove('new');
    });
    return d;
  }

  function renderCall() {
    if (!call) call = createCall(game);
    add(body, call.el);
  }

  function renderRecords() {
    const v = game.view;
    if (!v.records.length) {
      add(body, el('div', { class: 'empty', text: 'No cards yet. Call Milo, and every card he finds is kept here.' }));
      return;
    }
    for (const rec of v.records) add(body, recordNode(rec));
    for (const rec of v.records) seen.add(rec.id);
  }

  function renderLab() {
    const v = game.view;
    const items = v.evidence.filter((e) => e.lab);
    if (!items.length) {
      add(body, el('div', { class: 'empty', text: 'Nothing you are carrying needs the lab yet.' }));
      return;
    }
    add(body, el('div', { class: 'term-out', text: 'Send things to the county lab from here. Results take a while, so keep working. The lab will call you.' }));
    for (const e of items) {
      const row = el('div', { class: 'row' }, icon(e.icon, 20), el('div', { class: 'row-main' }, el('div', { class: 'row-title', text: e.name }), el('div', { class: 'row-sub', text: e.lab.status === 'done' ? e.lab.result : e.lab.status === 'pending' ? 'In the queue.' : 'Not submitted.' })));
      if (e.lab.status === 'none') {
        const btn = el('button', { class: 'btn small', type: 'button', text: 'Send' });
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          await game.call('labSubmit', { id: e.id }).catch(() => {});
          api.refresh();
        });
        add(row, btn);
      } else {
        add(row, el('span', { class: `pill ${e.lab.status === 'done' ? 'ok' : 'go'}`, text: e.lab.status === 'done' ? 'Result' : 'Waiting' }));
      }
      if (e.lab.status === 'done') row.querySelector('.row-sub').style.webkitLineClamp = 'unset';
      add(body, row);
    }
  }

  const renderers = { call: renderCall, records: renderRecords, lab: renderLab };

  const api = {
    get isOpen() {
      return !!panel;
    },

    open(which) {
      // Old links into the Lectern asked it a question: that is a call now.
      if (which === 'ask') which = 'call';
      if (which) tab = which;
      if (!panel) {
        tabBar = el('div', { class: 'tabs', role: 'tablist' });
        body = el('div', { class: 'panel-body' });
        scrim = el('div', { class: 'scrim', onClick: () => api.close() });
        panel = el(
          'section',
          { class: 'panel full laptop', role: 'dialog', 'aria-label': 'The Lectern' },
          el('div', { class: 'panel-head' }, icon('laptop'), el('div', { class: 'panel-title', text: game.view.laptop.name }), el('button', { class: 'xbtn', type: 'button', 'aria-label': 'Close the Lectern', 'data-back': '', onClick: () => api.close() }, icon('close'))),
          tabBar,
          body,
          el('div', { class: 'panel-foot phone-only term-foot' }, el('button', { class: 'btn quiet', type: 'button', onClick: () => api.close() }, icon('back', 18), 'Back to the room')),
        );
        panels.append(scrim, panel);
      }
      api.refresh();
    },

    refresh() {
      if (!panel) return;
      stopPlaying();
      // On a call there is a hang-up button; the way back to the room stays at the top.
      panel.classList.toggle('calling', tab === 'call');
      renderTabs();
      clear(body);
      renderers[tab]();
    },

    /**
     * Call Milo about something: from a puzzle, `lesson` names its method and `about` the
     * puzzle; otherwise `text` is what to look up.
     */
    ask(text, lesson = null, about = null) {
      api.open('call');
      call.start(lesson ? { lesson, about: about ?? text } : { query: text });
    },

    close() {
      if (!panel) return;
      stopPlaying();
      call?.hangUp();
      call = null;
      leave(panel, scrim);
      panel = null;
      game.panelClosed('laptop');
    },
  };
  return api;
}
