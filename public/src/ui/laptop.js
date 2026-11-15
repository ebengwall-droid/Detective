// The Lectern: the detective's reference desk. Ask the records system anything in
// plain language, read what it turns up, and follow the lab queue.

import { el, add, clear, icon, leave, setThumb } from './dom.js';

export function createLaptop(panels, game) {
  let panel = null;
  let scrim = null;
  let tab = 'ask';
  let body, tabBar, form, input, chips;
  /** @type {{q: string, a: string, opened: string[], pending?: boolean}[]} */
  const history = [];
  let busy = false;
  const fresh = new Set();

  const tabs = [
    { id: 'ask', label: 'ASK' },
    { id: 'records', label: 'RECORDS' },
    { id: 'lab', label: 'LAB' },
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

  function recordNode(rec, open = false) {
    const d = el('details', { class: `rec ${fresh.has(rec.id) ? 'new' : ''}` }, el('summary', { text: rec.title }), el('div', { class: 'rec-body', text: rec.body }));
    d.open = open;
    d.addEventListener('toggle', () => {
      if (d.open) {
        fresh.delete(rec.id);
        d.classList.remove('new');
      }
    });
    return d;
  }

  function renderAsk() {
    const v = game.view;
    if (!history.length) {
      add(body, 
        el('div', { class: 'term-out' }, v.laptop.intro),
      );
    }
    for (const h of history) {
      add(body, el('div', { class: 'term-out term-q', text: h.q }));
      const a = el('div', { class: 'term-out term-a' });
      if (h.pending) a.append(el('div', { class: 'dots' }, el('i'), el('i'), el('i')));
      else a.textContent = h.a;
      h.node = a;
      add(body, a);
      for (const id of h.opened) {
        const rec = v.records.find((r) => r.id === id);
        if (rec) add(body, recordNode(rec, h === history[history.length - 1]));
      }
    }
    clear(chips);
    chips.hidden = busy || !v.laptopHints.length;
    for (const q of v.laptopHints) add(chips, el('button', { class: 'ask-chip', type: 'button', text: q, onClick: () => ask(q) }));
    form.hidden = false;
    body.scrollTop = body.scrollHeight;
  }

  function renderRecords() {
    const v = game.view;
    form.hidden = true;
    chips.hidden = true;
    if (!v.records.length) {
      add(body, el('div', { class: 'empty', text: 'NO RECORDS OPENED.\nUse ASK to search.' }));
      return;
    }
    for (const rec of v.records) add(body, recordNode(rec));
  }

  function renderLab() {
    const v = game.view;
    form.hidden = true;
    chips.hidden = true;
    const items = v.evidence.filter((e) => e.lab);
    if (!items.length) {
      add(body, el('div', { class: 'empty', text: 'LAB QUEUE EMPTY.\nNothing you are holding needs the laboratory yet.' }));
      return;
    }
    add(body, el('div', { class: 'term-out', text: 'FORENSIC LABORATORY // SUBMISSIONS\nResults take a little time. Keep working; the lab will ring.' }));
    for (const e of items) {
      const row = el('div', { class: 'row' }, icon(e.icon, 20), el('div', { class: 'row-main' }, el('div', { class: 'row-title', text: e.name }), el('div', { class: 'row-sub', text: e.lab.status === 'done' ? e.lab.result : e.lab.status === 'pending' ? 'In the queue.' : 'Not submitted.' })));
      if (e.lab.status === 'none') {
        const btn = el('button', { class: 'btn small', type: 'button', text: 'SUBMIT' });
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          await game.call('labSubmit', { id: e.id }).catch(() => {});
          api.refresh();
        });
        add(row, btn);
      } else {
        add(row, el('span', { class: `pill ${e.lab.status === 'done' ? 'ok' : 'go'}`, text: e.lab.status === 'done' ? 'RESULT' : 'PENDING' }));
      }
      if (e.lab.status === 'done') row.querySelector('.row-sub').style.webkitLineClamp = 'unset';
      add(body, row);
    }
  }

  async function ask(text) {
    const q = (text ?? input.value).trim();
    if (!q || busy) return;
    input.value = '';
    busy = true;
    const entry = { q, a: '', opened: [], pending: true };
    history.push(entry);
    if (history.length > 30) history.shift();
    api.refresh();
    try {
      const res = await game.call('laptopAsk', { query: q }, {
        onText: (soFar) => {
          if (entry.node) entry.node.textContent = soFar;
          body.scrollTop = body.scrollHeight;
        },
      });
      entry.a = res.answer;
      entry.opened = res.opened;
      for (const id of res.opened) fresh.add(id);
    } catch (err) {
      entry.a = `ERROR: ${err.message}`;
    }
    entry.pending = false;
    busy = false;
    api.refresh();
    if (!game.isTouch) input.focus({ preventScroll: true });
  }

  const renderers = { ask: renderAsk, records: renderRecords, lab: renderLab };

  const api = {
    get isOpen() {
      return !!panel;
    },

    open(which) {
      if (which) tab = which;
      if (!panel) {
        tabBar = el('div', { class: 'tabs', role: 'tablist' });
        body = el('div', { class: 'panel-body' });
        chips = el('div', { class: 'ask-chips' });
        input = el('input', { class: 'field', id: 'lectern-query', type: 'text', placeholder: game.view.laptop.placeholder, autocomplete: 'off', enterkeyhint: 'search', maxlength: '200' });
        input.addEventListener('keydown', (e) => {
          // Keep typing from reaching the game's hotkeys, but let Escape close the lid.
          e.stopPropagation();
          if (e.key === 'Escape') api.close();
        });
        form = el('form', { class: 'term-form' }, input, el('button', { class: 'btn solid', type: 'submit', text: 'ASK' }));
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          ask();
        });
        scrim = el('div', { class: 'scrim', onClick: () => api.close() });
        panel = el(
          'section',
          { class: 'panel full laptop', role: 'dialog', 'aria-label': 'Laptop' },
          el('div', { class: 'panel-head' }, icon('laptop'), el('div', { class: 'panel-title', text: game.view.laptop.name }), el('button', { class: 'xbtn', type: 'button', 'aria-label': 'Close laptop', 'data-back': '', onClick: () => api.close() }, icon('close'))),
          tabBar,
          body,
          chips,
          form,
          el('div', { class: 'panel-foot phone-only term-foot' }, el('button', { class: 'btn quiet', type: 'button', onClick: () => api.close() }, icon('back', 18), 'Back to the room')),
        );
        panels.append(scrim, panel);
        if (!game.isTouch) setTimeout(() => input.focus({ preventScroll: true }), 200);
      }
      api.refresh();
    },

    refresh() {
      if (!panel) return;
      renderTabs();
      clear(body);
      renderers[tab]();
    },

    /** Open on the question box and put a question to it. */
    ask(text) {
      api.open('ask');
      ask(text);
    },

    close() {
      if (!panel) return;
      leave(panel, scrim);
      panel = null;
      game.panelClosed('laptop');
    },
  };
  return api;
}
