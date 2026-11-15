// The map of the Fold: where you can go, and the way to end the day. The picture is the
// printed-map drawing from the guide (ui/guide.js), with a pin for every place you know of.

import { el, icon, leave } from './dom.js';
import { confirmCard } from './hud.js';
import { drawFold, showGuide } from './guide.js';

const NS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs = {}, ...children) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  for (const c of children) if (c) node.append(c);
  return node;
}

export function createMap(panels, game) {
  let panel = null;
  let scrim = null;

  async function rest() {
    const v = game.view;
    if (!v.rest) return;
    if (!v.rest.can) {
      game.hud.toast({ kind: 'alert', iconName: 'moon', title: 'Not yet', text: v.rest.why });
      return;
    }
    const ok = await confirmCard(game.cards, { title: 'End the day?', text: v.rest.warn, yes: 'Last ferry', no: 'Keep working' });
    if (!ok) return;
    api.close();
    game.rest();
  }

  function go(loc) {
    api.close();
    if (!(loc.here && game.view.location.id === loc.id)) game.travel(loc.id);
  }

  const api = {
    get isOpen() {
      return !!panel;
    },

    open() {
      api.close(true);
      const v = game.view;
      game.unseen.map = false;
      const root = drawFold();
      root.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      for (const loc of v.map) {
        // A third value, 'left' or 'right', says which side of its pin a place's name goes.
        const [x, y, side] = loc.at;
        const pin = svg('g', { class: `map-pin ${loc.here ? 'here' : ''} ${!loc.visited ? 'fresh' : ''}`, transform: `translate(${x} ${y})`, tabindex: 0, role: 'button', 'aria-label': `${loc.name}${loc.here ? ' (you are here)' : ''}` });
        const anchorEnd = side === 'left' || (side !== 'right' && x > 70);
        const text = svg('text', { x: anchorEnd ? -2.6 : 2.6, y: 0.9, 'font-size': 2.5, 'text-anchor': anchorEnd ? 'end' : 'start' });
        text.textContent = loc.name;
        pin.append(svg('circle', { class: 'halo', r: 5 }), svg('circle', { r: 6, fill: 'transparent' }), svg('circle', { class: 'dot', r: loc.here ? 1.9 : 1.5 }), text);
        if (loc.here) {
          const here = svg('text', { class: 'map-label', x: anchorEnd ? -2.6 : 2.6, y: 3.5, 'font-size': 1.35, 'text-anchor': anchorEnd ? 'end' : 'start' });
          here.textContent = 'YOU ARE HERE';
          here.classList.add('here-label');
          pin.append(here);
        }
        pin.addEventListener('click', () => go(loc));
        pin.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') go(loc);
        });
        root.append(pin);
      }
      // The same places as a plain list: easier to hit than a pin on a small screen.
      const list = el(
        'div',
        { class: 'map-list' },
        v.map.map((loc) =>
          el(
            'button',
            { class: `map-row ${loc.here ? 'here' : ''}`, type: 'button', onClick: () => go(loc) },
            el('span', { class: 'map-row-dot' }),
            el('div', { class: 'row-main' }, el('div', { class: 'row-title', text: loc.name }), el('div', { class: 'row-sub', text: loc.here ? 'You are here' : loc.sub })),
            loc.here || loc.visited ? null : el('span', { class: 'pill go', text: 'New' }),
          ),
        ),
      );
      const restBtn = v.rest ? el('button', { class: `btn ${v.rest.can ? '' : 'quiet'}`, type: 'button', onClick: rest }, icon('moon', 18), 'End the day') : null;
      scrim = el('div', { class: 'scrim', onClick: () => api.close() });
      panel = el(
        'section',
        { class: 'panel full', role: 'dialog', 'aria-label': 'Map' },
        el('div', { class: 'panel-head' }, icon('map'), el('div', { class: 'panel-title', text: 'The Fold' }), el('button', { class: 'btn quiet map-guide', type: 'button', onClick: () => showGuide(game.cards) }, 'Guide'), el('button', { class: 'xbtn', type: 'button', 'aria-label': 'Close map', 'data-back': '', onClick: () => api.close() }, icon('close'))),
        el('div', { class: 'map-body' }, el('div', { class: 'map-wrap' }, root), list),
        el('div', { class: 'map-foot' }, el('div', { class: 'muted', text: `${v.act.date}. Choose a place to go there.` }), restBtn, el('button', { class: 'btn quiet phone-only', type: 'button', onClick: () => api.close() }, icon('back', 18), 'Back to the room')),
      );
      panels.append(scrim, panel);
    },

    refresh() {
      if (panel) api.open();
    },

    close(silent = false) {
      if (!panel) return;
      // Redrawn in place (silent): swap at once. Put away by the player: let it leave.
      if (silent) {
        panel.remove();
        scrim.remove();
      } else leave(panel, scrim);
      panel = null;
      if (!silent) game.panelClosed('map');
    },
  };
  return api;
}
