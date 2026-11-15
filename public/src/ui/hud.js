// The heads-up display: where you are, what you are looking at, what just
// happened, and the small panels that sit over the 3D view.

import { el, clear, icon, prose, typeInto, leave, watchOverflow } from './dom.js';
import { announce, revealCard } from './titlefx.js';
import { PICTURES, enlargePicture } from './guide.js';
import { drawWriting } from './writing.js';

const TOAST_MS = 5200;

export function createHud(root, game) {
  const name = el('div', { class: 'hud-name' });
  const sub = el('div', { class: 'hud-sub' });
  // Every tool carries its name: nobody should have to guess what an icon does.
  const tool = (iconName, caption, label, onClick) => el('button', { class: 'ibtn tool', type: 'button', 'aria-label': label, title: label, onClick }, icon(iconName), el('span', { class: 'tool-cap', text: caption }));
  const tools = {
    scan: tool('eye', 'Look', 'Look around: everything in the room, and a way to walk straight to it (Q)', () => game.scan()),
    think: tool('bulb', 'Think', 'Think: a nudge when you are stuck (T)', () => game.think()),
    notebook: tool('notebook', 'Notes', 'Notebook (N)', () => game.open('notebook')),
    laptop: tool('laptop', 'Lectern', 'The Lectern (L)', () => game.open('laptop')),
    map: tool('map', 'Map', 'Map (M)', () => game.open('map')),
  };
  // On a phone the five tools sit along the bottom, under the thumbs; the menu keeps to a corner.
  const menu = tool('gear', 'Menu', 'Menu', () => game.open('menu'));
  menu.classList.add('hud-menu');
  const objective = el('button', { class: 'hud-objective', type: 'button', onClick: () => game.open('notebook', 'case') }, el('span'));
  const reticle = el('div', { class: 'reticle' });
  const prompt = el('button', { class: 'hud-prompt', type: 'button', hidden: true, onClick: () => game.useTarget() }, el('span', { class: 'verb' }), el('span', { class: 'what' }), el('kbd', { text: 'E' }));
  const coach = el('div', { class: 'hud-coach', role: 'status' });

  const hud = el(
    'div',
    { id: 'hud', class: 'off' },
    el('header', { class: 'hud-top' }, el('div', { class: 'hud-place', role: 'button', tabindex: '0', 'aria-label': 'About this place', onClick: () => game.aboutHere() }, name, sub), objective),
    menu,
    el('nav', { class: 'hud-tools', 'aria-label': 'Tools' }, Object.values(tools)),
    reticle,
    coach,
    prompt,
  );
  const toasts = el('div', { id: 'toasts', 'aria-live': 'polite' });
  root.append(hud, toasts);

  let coachTimer = 0;
  let touch = false;

  const api = {
    el: hud,

    setVisible(on) {
      hud.classList.toggle('off', !on);
    },

    setTouch(on) {
      touch = on;
      prompt.querySelector('kbd').hidden = on;
    },

    setLocked(on) {
      reticle.classList.toggle('on', on);
    },

    setView(view) {
      // A new place is announced: its name rises into the corner, the way a game names where you are.
      if (name.textContent !== view.location.name) {
        name.textContent = view.location.name;
        announce(name);
      }
      // Date first: on a narrow screen the end of the line is what gets cut.
      sub.textContent = `${view.act.date} · ${view.location.sub}`;
      const current = view.objectives.find((o) => !o.done);
      objective.hidden = !current;
      if (current && objective.firstElementChild.textContent !== current.text) {
        objective.firstElementChild.textContent = current.text;
        // Draw the eye to a new instruction.
        objective.classList.remove('flash');
        void objective.offsetWidth;
        objective.classList.add('flash');
      }
      const openQuestions = view.deductions.some((d) => !d.solved);
      tools.notebook.classList.toggle('badge', openQuestions || game.unseen.notebook);
      tools.laptop.classList.toggle('badge', game.unseen.laptop);
      tools.map.classList.toggle('badge', game.unseen.map);
    },

    /** Show what the player is aiming at, or hide the prompt. */
    setTarget(t) {
      reticle.classList.toggle('hot', !!t);
      if (!t) {
        prompt.hidden = true;
        return;
      }
      prompt.hidden = false;
      prompt.classList.toggle('done', !!t.done);
      prompt.children[0].textContent = t.verb;
      prompt.children[0].hidden = !t.verb;
      prompt.children[1].textContent = t.label;
    },

    /** A one-off instruction in the middle of the screen. html is trusted (our own copy). */
    coach(html, ms = 6500) {
      clearTimeout(coachTimer);
      coach.innerHTML = html;
      coach.classList.add('on');
      coachTimer = setTimeout(() => coach.classList.remove('on'), ms);
    },

    hideCoach() {
      clearTimeout(coachTimer);
      coach.classList.remove('on');
    },

    toast({ kind = '', iconName = 'doc', title, text, onClick }) {
      const node = el('button', { class: `toast ${kind}`, type: 'button' }, icon(iconName, 20), el('div', {}, el('div', { class: 'toast-title', text: title }), text ? el('div', { class: 'toast-text', text }) : null));
      const remove = () => {
        node.classList.add('out');
        setTimeout(() => node.remove(), 280);
      };
      node.addEventListener('click', () => {
        remove();
        onClick?.();
      });
      toasts.append(node);
      while (toasts.children.length > 4) toasts.firstElementChild.remove();
      setTimeout(remove, TOAST_MS);
    },

    /**
     * Everything one action turned up, on one card: a line each, no more. Several notices at once
     * covered the room; this is read at a glance, and the notebook has the rest.
     * @param {{ title?: string, items: {iconName: string, label: string, text: string}[], onClick?: () => void }} o
     */
    digest({ title = 'Notebook updated', items, onClick }) {
      const shown = items.slice(0, 4);
      const more = items.length - shown.length;
      const node = el(
        'button',
        { class: 'toast digest', type: 'button', 'aria-label': `${title}: ${items.map((i) => `${i.label}, ${i.text}`).join('; ')}` },
        el('div', { class: 'digest-head' }, el('span', { class: 'digest-title', text: title }), el('span', { class: 'digest-count', text: String(items.length) })),
        el(
          'div',
          { class: 'digest-rows' },
          shown.map((it) => el('div', { class: 'digest-row' }, icon(it.iconName, 16), el('span', { class: 'digest-label', text: it.label }), el('span', { class: 'digest-text', text: it.text }))),
        ),
        more > 0 ? el('div', { class: 'digest-more', text: `and ${more} more in your notebook` }) : null,
      );
      const remove = () => {
        node.classList.add('out');
        setTimeout(() => node.remove(), 280);
      };
      node.addEventListener('click', () => {
        remove();
        onClick?.();
      });
      toasts.append(node);
      while (toasts.children.length > 3) toasts.firstElementChild.remove();
      setTimeout(remove, TOAST_MS + 1800);
    },

    clearToasts() {
      clear(toasts);
    },
  };
  return api;
}

/**
 * Everything in the room as a plain list. Tap one and the detective walks
 * over and gets on with it: the whole game can be played from here and the
 * map, without steering. Resolves to what was picked, or null.
 */
export function showHere(panels, game) {
  return new Promise((resolve) => {
    const v = game.view;
    const w = game.world;
    const far = (t) => {
      const p = w.targetPos(t);
      return p ? Math.hypot(p.x - w.player.x, p.z - w.player.z) : 99;
    };
    const people = v.location.npcs.map((n) => ({ type: 'npc', id: n.id, label: n.name, sub: n.met ? n.short : 'Someone to talk to', iconName: 'speech', verb: 'Talk', fresh: true }));
    const things = v.location.hotspots.map((h) => ({
      type: 'hotspot',
      id: h.id,
      label: h.label,
      sub: h.kind === 'exit' ? 'The way out' : h.done ? 'Looked at' : 'Not looked at yet',
      iconName: h.kind === 'exit' ? 'door' : h.kind === 'use' ? 'hand' : 'eye',
      verb: h.kind === 'exit' ? 'Go' : h.kind === 'use' ? 'Use' : 'Look',
      fresh: !h.done,
      exit: h.kind === 'exit',
    }));
    people.sort((a, b) => far(a) - far(b));
    things.sort((a, b) => Number(a.exit) - Number(b.exit) || Number(b.fresh) - Number(a.fresh) || far(a) - far(b));

    const close = (pick) => {
      window.removeEventListener('keydown', onKey);
      leave(panel, scrim);
      resolve(pick);
    };
    const onKey = (e) => {
      if (e.code === 'Escape' || e.code === 'KeyQ') close(null);
    };
    const row = (t) =>
      el(
        'button',
        { class: `row around-row ${t.fresh ? 'fresh' : 'done'}`, type: 'button', onClick: () => close({ type: t.type, id: t.id }) },
        icon(t.iconName, 20),
        el('div', { class: 'row-main' }, el('div', { class: 'row-title', text: t.label }), el('div', { class: 'row-sub', text: t.sub })),
        el('span', { class: `pill ${t.fresh ? 'go' : ''}`, text: t.verb }),
      );
    const body = el(
      'div',
      { class: 'panel-body' },
      people.length ? el('div', { class: 'section-label', text: 'People' }) : null,
      people.map(row),
      el('div', { class: 'section-label', text: 'Things' }),
      things.map(row),
    );
    const scrim = el('div', { class: 'scrim clear', onClick: () => close(null) });
    const panel = el(
      'section',
      { class: 'panel around', role: 'dialog', 'aria-label': 'Around you' },
      el('div', { class: 'panel-head' }, el('div', { class: 'around-head' }, el('div', { class: 'panel-title', text: v.location.name }), el('div', { class: 'panel-kicker', text: 'Choose one and you will walk to it' })), el('button', { class: 'xbtn', type: 'button', 'aria-label': 'Close', 'data-back': '', onClick: () => close(null) }, icon('close'))),
      body,
    );
    panels.append(scrim, panel);
    setTimeout(() => window.addEventListener('keydown', onKey), 150);
  });
}

/** The panel shown after examining something. Resolves when dismissed. */
export function showInspect(panels, { title, text, figure = null, taken = [], actions = [] }) {
  return new Promise((resolve) => {
    const body = el('div', { class: 'panel-body' });
    // A written thing is shown as well as described: tap the picture to see it larger.
    const svg = figure ? drawWriting(figure) : null;
    const pic = svg ? el('button', { class: 'guide-pic inspect-pic', type: 'button', 'aria-label': `${title}. Tap to see it larger.`, onClick: () => enlargePicture(svg, title, panels.parentElement?.querySelector('#cards') ?? panels) }, svg) : null;
    const close = (value) => {
      leave(panel);
      window.removeEventListener('keydown', onKey);
      resolve(value);
    };
    const onKey = (e) => {
      if (e.code === 'Escape' || e.code === 'Enter' || e.code === 'KeyE' || e.code === 'Space') {
        e.preventDefault();
        close(null);
      }
    };
    // What was bagged, as tags; then what can be done next, with the way on at the end.
    const foot = el(
      'div',
      { class: 'inspect-foot' },
      taken.length ? el('div', { class: 'inspect-tags' }, taken.map((t) => el('span', { class: 'tagline' }, icon(t.icon ?? 'bag', 16), `Bagged: ${t.name}`))) : null,
      el(
        'div',
        { class: 'inspect-actions' },
        actions.map((a) => el('button', { class: 'btn small', type: 'button', text: a.label, onClick: () => close(a.id) })),
        el('button', { class: 'btn small solid', type: 'button', text: 'Continue', 'data-back': '', onClick: () => close(null) }),
      ),
    );
    const panel = el('section', { class: `panel inspect ${pic ? 'with-pic' : ''}`, role: 'dialog', 'aria-label': title }, el('div', { class: 'panel-head' }, el('div', { class: 'panel-title', text: title })), pic, body, foot);
    panels.append(panel);
    typeInto(body, text, { cps: 140 });
    setTimeout(() => window.addEventListener('keydown', onKey), 150);
  });
}

/**
 * Arriving somewhere for the first time: the place's name and address, then what you see,
 * on solid glass, for as long as you need. The name at the top of the screen brings it back.
 */
export function showArrival(panels, { name, sub, text }) {
  return new Promise((resolve) => {
    const body = el('div', { class: 'panel-body' });
    const close = () => {
      leave(panel);
      window.removeEventListener('keydown', onKey);
      resolve();
    };
    const onKey = (e) => {
      if (e.code === 'Escape' || e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE') {
        e.preventDefault();
        close();
      }
    };
    const panel = el(
      'section',
      { class: 'panel inspect arrival', role: 'dialog', 'aria-label': name },
      el('div', { class: 'arrival-head' }, sub ? el('div', { class: 'arrival-kicker', text: sub }) : null, el('div', { class: 'arrival-name', text: name })),
      body,
      el('div', { class: 'inspect-foot' }, el('div', { class: 'inspect-actions' }, el('button', { class: 'btn small solid', type: 'button', text: 'Continue', 'data-back': '', onClick: close }))),
    );
    panels.append(panel);
    typeInto(body, text, { cps: 120 });
    setTimeout(() => window.addEventListener('keydown', onKey), 150);
  });
}

/** The detective's inner voice. `run` streams text into the panel. */
export function showThink(panels, run) {
  return new Promise((resolve) => {
    const body = el('div', { class: 'panel-body' }, el('div', { class: 'dots' }, el('i'), el('i'), el('i')));
    const kicker = el('div', { class: 'panel-kicker', text: 'You think it over' });
    const close = () => {
      leave(panel, scrim);
      window.removeEventListener('keydown', onKey);
      resolve();
    };
    const onKey = (e) => {
      if (e.code === 'Escape' || e.code === 'Enter') close();
    };
    const scrim = el('div', { class: 'scrim', onClick: close });
    const panel = el(
      'section',
      { class: 'panel think', role: 'dialog', 'aria-label': 'Thinking' },
      el('div', { class: 'panel-head' }, el('div', { class: 'think-head' }, kicker), el('button', { class: 'xbtn', type: 'button', 'aria-label': 'Close', 'data-back': '', onClick: close }, icon('close'))),
      body,
    );
    panels.append(scrim, panel);
    window.addEventListener('keydown', onKey);
    let streamed = false;
    run((soFar) => {
      streamed = true;
      body.replaceChildren(prose(soFar));
    })
      .then(({ text, objective }) => {
        if (objective) kicker.textContent = objective;
        if (streamed) body.replaceChildren(prose(text));
        else typeInto(body, text, { cps: 60 });
      })
      .catch((err) => {
        body.replaceChildren(el('p', { class: 'muted', text: err.message || 'Nothing comes.' }));
      });
  });
}

/**
 * A full-screen title card: act openings and other scene breaks.
 * Lines fade in one after another. Resolves when the player continues.
 * `pictures[i]` names pictures to draw under paragraph i (see PICTURES in guide.js); each can be tapped to see it larger.
 */
export function showCard(cards, { kicker, title, date, lines = [], button = 'Continue', veil = false, pictures = null }) {
  return new Promise((resolve) => {
    const go = el('button', { class: 'btn solid', type: 'button', text: button });
    const figure = (name) => {
      const pic = PICTURES[name];
      if (!pic) return null;
      const svg = pic.draw();
      const open = () => enlargePicture(svg, pic.caption, cards);
      return el('figure', { class: 'card-fig' }, el('button', { class: 'guide-pic', type: 'button', 'aria-label': `${pic.caption} Tap to see it larger.`, onClick: open }, svg), el('figcaption', { text: pic.caption }));
    };
    const linesEl = el('div', { class: 'card-lines' }, lines.map((line, i) => [el('p', { text: line, style: { animationDelay: `${0.5 + i * 1.15}s` } }), (pictures?.[i] ?? []).map(figure)]));
    const card = el(
      'section',
      { class: `card ${veil ? 'veil' : ''}`, role: 'dialog', 'aria-label': title ?? 'Scene' },
      el('div', { class: 'card-inner' }, kicker ? el('div', { class: 'card-kicker', text: kicker }) : null, title ? el('h1', { class: 'card-title', text: title }) : null, date ? el('div', { class: 'card-date', text: date }) : null, linesEl, el('div', { class: 'card-actions sticky' }, go)),
    );
    const done = () => {
      window.removeEventListener('keydown', onKey);
      card.style.transition = 'opacity 0.4s';
      card.style.opacity = '0';
      setTimeout(() => {
        card.remove();
        resolve();
      }, 380);
    };
    const onKey = (e) => {
      // Only while nothing (an enlarged picture, say) has been opened on top of it.
      if (cards.lastElementChild !== card) return;
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        done();
      }
    };
    go.addEventListener('click', done);
    cards.append(card);
    watchOverflow(card);
    revealCard(card);
    setTimeout(() => {
      window.addEventListener('keydown', onKey);
      go.focus({ preventScroll: true });
    }, 400);
  });
}

/**
 * Yes/no question in the game's own style (the host page cannot show confirm()).
 * `accuse` marks the one question that names somebody: its yes is red, not the lamp.
 */
export function confirmCard(cards, { title, text, yes = 'Yes', no = 'Not yet', accuse = false }) {
  return new Promise((resolve) => {
    const close = (value) => {
      card.remove();
      resolve(value);
    };
    const card = el(
      'section',
      { class: 'card veil', role: 'alertdialog', 'aria-label': title },
      el('div', { class: 'card-inner' }, el('h2', { class: 'card-title small', text: title }), el('div', { class: 'rule' }), el('p', { class: 'card-text', text }), el('div', { class: 'card-actions' }, el('button', { class: 'btn quiet', type: 'button', text: no, 'data-back': '', onClick: () => close(false) }), el('button', { class: accuse ? 'btn solid danger' : 'btn solid', type: 'button', text: yes, onClick: () => close(true) }))),
    );
    cards.append(card);
  });
}
