// The detective's notebook: objectives, the Papers (every puzzle set so far),
// the case board (deductions and the arrest), evidence, people and every lead
// established so far.

import { el, add, clear, icon, leave, setThumb } from './dom.js';
import { confirmCard, showCard } from './hud.js';
import { renderPapers } from './papers.js';

const TAGS = {
  all: 'All',
  scene: 'Scenes',
  forensic: 'Forensics',
  testimony: 'Testimony',
  record: 'Records',
  pattern: 'The pattern',
  insider: 'The Hall',
  identity: 'The name',
};

export function createNotebook(panels, game) {
  let panel = null;
  let scrim = null;
  let tab = 'case';
  let body;
  let tabBar;
  /** True only while a page is being turned to, so that it can arrive a line at a time. */
  let arriving = false;
  const sel = { evidence: null, people: null, tag: 'all', puzzle: null, tool: null };
  const wrongPicks = {};
  const accuse = { suspect: null, motive: null };

  const tabs = [
    { id: 'case', label: 'Case', icon: 'list' },
    { id: 'papers', label: 'Papers', icon: 'paper' },
    { id: 'board', label: 'Board', icon: 'board' },
    { id: 'evidence', label: 'Evidence', icon: 'bag' },
    { id: 'people', label: 'People', icon: 'people' },
    { id: 'leads', label: 'Leads', icon: 'star' },
  ];

  function renderTabs() {
    const v = game.view;
    clear(tabBar);
    // One segmented control: the stylesheet slides the lit thumb to the page that is open.
    setThumb(tabBar, tabs.findIndex((t) => t.id === tab), tabs.length);
    const counts = { evidence: v.evidence.length, people: v.people.length, leads: v.facts.length, papers: (v.puzzles ?? []).filter((p) => !p.solved && !p.extra).length };
    for (const t of tabs) {
      const badge = t.id === 'board' && (v.deductions.some((d) => !d.solved) || (v.accuse && tab !== 'board'));
      add(tabBar, 
        el(
          'button',
          { class: `tab ${badge ? 'badge' : ''}`, type: 'button', role: 'tab', 'aria-selected': String(tab === t.id), onClick: () => api.open(t.id) },
          icon(t.icon, 18),
          t.label,
          counts[t.id] ? el('span', { class: 'count', text: String(counts[t.id]) }) : null,
        ),
      );
    }
  }

  // ------------------------------------------------------------------ case

  function renderCase() {
    const v = game.view;
    const open = v.objectives.filter((o) => !o.done);
    const done = v.objectives.filter((o) => o.done);
    add(body, 
      el('div', { class: 'panel-kicker', text: `${v.case.series} · ${v.act.date}` }),
      el('h3', { class: 'case-title', text: v.act.title }),
      el('div', { class: 'section-label', text: 'To do' }),
      open.length ? open.map((o) => el('div', { class: 'objective', text: o.text })) : el('p', { class: 'muted', text: 'Nothing pressing. Look around; something will turn up.' }),
      el('p', { class: 'note case-note' }, 'Stuck on the case? Think, in the tool bar, gives you a nudge. Stuck on a paper? Each one has its own hints, and the Lectern will teach you the method.'),
      done.length ? el('div', { class: 'section-label', text: 'Done' }) : null,
      done.map((o) => el('div', { class: 'objective done', text: o.text })),
    );
  }

  // ----------------------------------------------------------------- board

  function renderBoard() {
    const v = game.view;
    if (!v.deductions.length) {
      add(body, el('div', { class: 'empty' }, 'The board is bare. When you have enough to reason from, questions will be pinned here.'));
    }
    const pending = v.deductions.filter((d) => !d.solved);
    const solved = v.deductions.filter((d) => d.solved);
    if (pending.length) add(body, el('div', { class: 'section-label', text: 'Open questions' }));
    for (const d of pending) {
      const verdict = el('div', { class: 'verdict no', hidden: true });
      const options = el(
        'div',
        { class: 'options' },
        d.options.map((o) => {
          const wrong = wrongPicks[d.id]?.has(o.id);
          const btn = el('button', { class: `option ${wrong ? 'wrong' : ''}`, type: 'button', text: o.text, disabled: wrong });
          btn.addEventListener('click', async () => {
            btn.disabled = true;
            try {
              const res = await game.call('deduce', { id: d.id, option: o.id });
              if (res.ok) {
                game.audio.sting();
                await showCard(game.cards, { kicker: 'You have it', title: d.q, lines: [res.text], veil: true });
                api.refresh();
                return;
              }
              verdict.hidden = false;
              verdict.textContent = res.text;
              if (res.unsupported) {
                btn.disabled = false;
              } else {
                (wrongPicks[d.id] ??= new Set()).add(o.id);
                btn.classList.add('wrong');
              }
            } catch (err) {
              verdict.hidden = false;
              verdict.textContent = err.message;
              btn.disabled = false;
            }
          });
          return btn;
        }),
      );
      add(body, el('div', { class: 'question' }, el('h4', { text: d.q }), options, verdict));
    }
    if (v.accuse) renderAccuse(v);
    else if (v.accusation) add(body, el('div', { class: 'question' }, el('h4', { text: 'Arrest' }), el('p', { class: 'muted', text: `You named ${v.accusation.suspect}.` })));
    if (solved.length) add(body, el('div', { class: 'section-label list-label', text: 'Settled' }));
    for (const d of solved) {
      add(body, el('div', { class: 'question solved' }, el('h4', { text: d.q }), el('div', { class: 'answer' }, icon('check', 16), d.answer), el('div', { class: 'verdict yes', text: d.note })));
    }
  }

  function renderAccuse(v) {
    const box = el('div', { class: 'question arrest' }, el('h4', { text: 'Make an arrest' }), el('p', { class: 'muted', text: v.accuse.blurb }));
    const grid = el('div', { class: 'accuse-grid' });
    for (const s of v.accuse.suspects) {
      const person = v.people.find((p) => p.id === s.id);
      const btn = el('button', { class: 'suspect', type: 'button', 'aria-pressed': String(accuse.suspect === s.id) }, el('img', { class: 'portrait', alt: '', src: person?.look ? game.world.portrait(person.look) : '' }), s.name);
      btn.addEventListener('click', () => {
        accuse.suspect = s.id;
        api.refresh();
      });
      add(grid, btn);
    }
    const motives = el(
      'div',
      { class: 'filterbar' },
      v.accuse.motives.map((m) =>
        el('button', {
          class: 'filter',
          type: 'button',
          'aria-pressed': String(accuse.motive === m.id),
          text: m.text,
          onClick: () => {
            accuse.motive = m.id;
            api.refresh();
          },
        }),
      ),
    );
    const go = el('button', { class: 'btn danger', type: 'button', disabled: !accuse.suspect || !accuse.motive }, icon('gavel', 18), 'Name them');
    go.addEventListener('click', async () => {
      const who = v.accuse.suspects.find((s) => s.id === accuse.suspect);
      const sure = await confirmCard(game.cards, { title: `Name ${who.name}?`, text: v.accuse.warn, yes: 'Name them', no: 'Not yet', accuse: true });
      if (!sure) return;
      try {
        const res = await game.call('accuse', { suspect: accuse.suspect, motive: accuse.motive, items: v.presentables.slice(0, 8).map((p) => p.id) }, {}, { deferEvents: true });
        api.close();
        await showCard(game.cards, { kicker: res.speaker, title: res.final ? 'It is said' : 'Not enough', lines: [res.text.replace(/\*/g, '')], veil: true });
        accuse.suspect = null;
        accuse.motive = null;
        game.flushEvents();
      } catch (err) {
        game.hud.toast({ kind: 'alert', iconName: 'gavel', title: 'Not now', text: err.message });
      }
    });
    add(box, el('div', { class: 'section-label', text: 'Who' }), grid, el('div', { class: 'section-label', text: 'Why' }), motives, go);
    add(body, box);
  }

  // -------------------------------------------------------------- evidence

  function renderEvidence() {
    const v = game.view;
    if (!v.evidence.length) {
      add(body, el('div', { class: 'empty', text: 'Nothing bagged yet. Examine the marked objects at a scene; what matters goes in here.' }));
      return;
    }
    if (!v.evidence.some((e) => e.id === sel.evidence)) sel.evidence = game.isWide() ? v.evidence[0].id : null;
    const list = el(
      'div',
      { class: 'list' },
      v.evidence.map((e) =>
        el(
          'button',
          {
            class: 'row',
            type: 'button',
            'aria-current': String(sel.evidence === e.id),
            onClick: () => {
              sel.evidence = e.id;
              api.refresh(!game.isWide());
            },
          },
          icon(e.icon, 20),
          el('div', { class: 'row-main' }, el('div', { class: 'row-title', text: e.name }), el('div', { class: 'row-sub', text: e.desc })),
          e.lab ? el('span', { class: `pill ${e.lab.status === 'none' ? 'go' : e.lab.status === 'done' ? 'ok' : ''}`, text: e.lab.status === 'none' ? 'Lab?' : e.lab.status === 'done' ? 'Lab ✓' : 'At lab' }) : null,
        ),
      ),
    );
    const item = v.evidence.find((e) => e.id === sel.evidence);
    if (!game.isWide() && item) {
      add(body, el('button', { class: 'btn small quiet back', type: 'button', onClick: () => { sel.evidence = null; api.refresh(true); } }, icon('back', 16), 'All evidence'), evidenceDetail(item));
      return;
    }
    add(body, el('div', { class: 'cols' }, list, item ? evidenceDetail(item) : el('div')));
  }

  function evidenceDetail(e) {
    const detail = el('div', { class: 'detail' }, el('h3', { text: e.name }), el('div', { class: 'detail-desc', text: e.desc }));
    if (e.doc) add(detail, el('div', { class: e.icon === 'letter' ? 'paper ink' : 'paper', text: e.doc }));
    if (e.lab) {
      const box = el('div', { class: 'labbox' }, el('div', { class: 'section-label', text: 'Laboratory' }));
      if (e.lab.status === 'none') {
        const btn = el('button', { class: 'btn small', type: 'button' }, icon('flask', 16), 'Send to the lab');
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          await game.call('labSubmit', { id: e.id }).catch((err) => game.hud.toast({ kind: 'alert', iconName: 'flask', title: 'Lab', text: err.message }));
          api.refresh();
        });
        add(box, el('p', { class: 'muted lab-note', text: 'The lab has not seen this yet.' }), btn);
      } else if (e.lab.status === 'pending') {
        add(box, el('p', { class: 'muted lab-note', text: 'With the lab. They will ring when they have something; keep working.' }));
      } else {
        add(box, el('p', { class: 'lab-note', text: e.lab.result }));
      }
      add(detail, box);
    }
    return detail;
  }

  // ---------------------------------------------------------------- people

  function renderPeople() {
    const v = game.view;
    if (!v.people.length) {
      add(body, el('div', { class: 'empty', text: 'You have not met anyone yet.' }));
      return;
    }
    if (!sel.people || !v.people.some((p) => p.id === sel.people)) sel.people = game.isWide() ? v.people[0].id : null;
    const list = el(
      'div',
      { class: 'list' },
      v.people.map((p) =>
        el(
          'button',
          {
            class: 'row',
            type: 'button',
            'aria-current': String(sel.people === p.id),
            onClick: () => {
              sel.people = p.id;
              api.refresh(!game.isWide());
            },
          },
          p.look ? el('img', { class: 'portrait', alt: '', src: game.world.portrait(p.look) }) : icon('people', 20),
          el('div', { class: 'row-main' }, el('div', { class: 'row-title', text: p.name }), el('div', { class: 'row-sub', text: p.short })),
          p.dead ? el('span', { class: 'pill', text: 'Dead' }) : p.here ? el('span', { class: 'pill ok', text: 'Here' }) : null,
        ),
      ),
    );
    const person = v.people.find((p) => p.id === sel.people);
    const detail = person ? personDetail(person) : el('div');
    if (!game.isWide() && person) {
      add(body, el('button', { class: 'btn small quiet back', type: 'button', onClick: () => { sel.people = null; api.refresh(true); } }, icon('back', 16), 'Everyone'), detail);
      return;
    }
    add(body, el('div', { class: 'cols' }, list, detail));
  }

  function personDetail(p) {
    const detail = el('div', { class: 'detail' });
    add(detail, 
      el(
        'div',
        { class: `person-head ${p.dead ? 'dead' : ''}` },
        p.look ? el('img', { class: 'portrait', alt: '', src: game.world.portrait(p.look) }) : null,
        el('div', {}, el('h3', { text: p.name }), el('div', { class: 'muted', text: p.short }), p.where && !p.dead ? el('div', { class: 'muted person-where', text: p.here ? 'Here with you.' : `Usually found at ${p.where}.` }) : null),
      ),
    );
    if (p.phone) {
      add(detail, el('button', { class: 'btn small', type: 'button', onClick: () => { api.close(); game.talkTo(p.id, { phone: true }); } }, icon('phone', 16), 'Telephone'));
    }
    add(detail, el('div', { class: 'section-label', text: 'What you know' }));
    if (!p.notes.length) add(detail, el('p', { class: 'muted', text: 'Nothing established yet.' }));
    for (const n of p.notes) add(detail, el('div', { class: 'lead', text: n }));
    return detail;
  }

  // ----------------------------------------------------------------- leads

  function renderLeads() {
    const v = game.view;
    if (!v.facts.length) {
      add(body, el('div', { class: 'empty', text: 'No leads yet. Everything you establish is written down here for you.' }));
      return;
    }
    const present = new Set(v.facts.map((f) => f.tag));
    add(body, 
      el(
        'div',
        { class: 'filterbar scroll' },
        Object.entries(TAGS)
          .filter(([id]) => id === 'all' || present.has(id))
          .map(([id, label]) =>
            el('button', {
              class: 'filter',
              type: 'button',
              'aria-pressed': String(sel.tag === id),
              text: label,
              onClick: () => {
                sel.tag = id;
                api.refresh();
              },
            }),
          ),
      ),
    );
    for (const f of v.facts) {
      if (sel.tag !== 'all' && f.tag !== sel.tag) continue;
      add(body, el('div', { class: `lead ${f.key ? 'key' : ''}` }, el('span', { class: 'lead-tag', text: TAGS[f.tag] ?? f.tag }), f.text));
    }
  }

  const renderers = { case: renderCase, papers: () => renderPapers(body, game, sel, api), board: renderBoard, evidence: renderEvidence, people: renderPeople, leads: renderLeads };

  const api = {
    get isOpen() {
      return !!panel;
    },

    open(which) {
      if (which) tab = which;
      arriving = true;
      if (!panel) {
        tabBar = el('div', { class: 'tabs', role: 'tablist' });
        body = el('div', { class: 'panel-body' });
        scrim = el('div', { class: 'scrim', onClick: () => api.close() });
        panel = el(
          'section',
          { class: 'panel full', role: 'dialog', 'aria-label': 'Notebook' },
          el('div', { class: 'panel-head' }, icon('notebook'), el('div', { class: 'panel-title', text: 'Notebook' }), el('button', { class: 'xbtn', type: 'button', 'aria-label': 'Close notebook', 'data-back': '', onClick: () => api.close() }, icon('close'))),
          tabBar,
          body,
          el('div', { class: 'panel-foot phone-only' }, el('button', { class: 'btn quiet', type: 'button', onClick: () => api.close() }, icon('back', 18), 'Back to the room')),
        );
        panels.append(scrim, panel);
      }
      api.refresh();
      body.scrollTop = 0;
    },

    /** Draw the open page again. `turn` says the page itself has changed (a list to one thing in it, say), so it should arrive as a new page does. */
    refresh(turn = false) {
      if (!panel) return;
      const keep = body.scrollTop;
      body.classList.toggle('arrive', arriving || turn === true);
      arriving = false;
      renderTabs();
      clear(body);
      renderers[tab]();
      body.scrollTop = keep;
    },

    /** Preselect one paper for the next time the Papers tab shows. */
    selectPuzzle(id) {
      sel.puzzle = id;
      sel.tool = null;
    },

    /** Preselect one piece of evidence for the next time the Evidence tab shows. */
    selectEvidence(id) {
      sel.evidence = id;
    },

    close() {
      if (!panel) return;
      leave(panel, scrim);
      panel = null;
      game.panelClosed('notebook');
    },
  };
  return api;
}
