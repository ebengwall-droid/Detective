// The map of the Fold: where you can go, and the way to end the day.

import { el, icon, leave } from './dom.js';
import { confirmCard } from './hud.js';

const NS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs = {}, ...children) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  for (const c of children) if (c) node.append(c);
  return node;
}

/**
 * Draw the Fold: an island between the river and the Cut, with the crease of the page running
 * down the middle of it. No printed map shows this; the detective has drawn it for themselves.
 */
function chart() {
  // Drawn in light on the glass of the sheet: every line takes its colour from the stylesheet (.chart-*).
  const g = svg('g', { class: 'chart' });
  const island = 'M12 21 L50 14 L88 26 L81 55 L52 66 L11 60 Z';
  const line = (cls, d, attrs = {}) => svg('path', { class: cls, d, fill: 'none', ...attrs });
  g.append(
    // Streets of the Flat, faintly, running off the edge.
    ...['M0 6 L40 2', 'M60 0 L100 12', 'M92 0 L96 70', 'M0 44 L6 70', 'M70 70 L100 52', 'M20 70 L44 68', 'M4 0 L8 18'].map((d) => line('chart-flat', d, { 'stroke-width': 0.4 })),
    // Water: the river to the north and west, the Cut to the south and east.
    line('chart-water', island, { 'stroke-width': 9, 'stroke-linejoin': 'round' }),
    line('chart-tide', island, { 'stroke-width': 0.3, 'stroke-linejoin': 'round', 'stroke-dasharray': '1.4 1.4' }),
    // The island.
    svg('path', { class: 'chart-isle', d: island, 'stroke-width': 0.4, 'stroke-linejoin': 'round' }),
    // Six crooked lanes and a square.
    ...['M50 15 L49 30', 'M22 25 L44 34', 'M18 44 L44 40', 'M30 60 L46 42', 'M56 40 L82 32', 'M56 44 L72 58', 'M50 44 L52 64'].map((d) => line('chart-lane', d, { 'stroke-width': 0.5, 'stroke-linecap': 'round' })),
    svg('rect', { class: 'chart-square', x: 44.5, y: 31.5, width: 11, height: 11, rx: 0.8, 'stroke-width': 0.3 }),
    // Bridges, and the ferry chain across the Cut.
    ...['M50 8.5 L50 15.5', 'M88 26 L93 21', 'M12 21 L6 17'].map((d) => line('chart-bridge', d, { 'stroke-width': 0.7 })),
    line('chart-bridge', 'M66 61 L70 68', { 'stroke-width': 0.35, 'stroke-dasharray': '0.8 0.8' }),
    // The crease of the page, which is why nobody finds the place.
    svg('rect', { x: 0, y: 0, width: 50, height: 70, fill: '#ffffff', opacity: 0.022 }),
    svg('path', { d: 'M50 0 L50 70', stroke: '#000', 'stroke-width': 0.9, opacity: 0.3 }),
    svg('path', { d: 'M50.6 0 L50.6 70', stroke: '#fff', 'stroke-width': 0.25, opacity: 0.14 }),
  );
  const label = (x, y, text, size = 2.1, cls = '', spacing = 0.35) => {
    const t = svg('text', { class: `map-label ${cls}`, x, y, 'font-size': size * 0.82, 'letter-spacing': spacing });
    t.textContent = text;
    return t;
  };
  g.append(
    label(4, 6, 'THE FOLD', 3.2, 'strong', 0.9),
    label(4, 9.2, 'as told, not as printed', 1.4, 'faint', 0.2),
    label(70, 9, 'THE FLAT', 2, 'faint', 0.7),
    label(16, 16.5, 'THE RIVER', 1.5, 'water', 0.6),
    label(76, 63, 'THE CUT', 1.5, 'water', 0.6),
    label(20, 28, 'NONESUCH ROW', 1.3),
    label(56, 30.5, 'PROVING SQUARE', 1.3),
    label(51.5, 12, 'TURNAGAIN LANE', 1.2),
  );
  // Compass rose.
  const rose = svg('g', { class: 'chart-rose', transform: 'translate(91 60)' });
  rose.append(svg('circle', { r: 4.2, fill: 'none', 'stroke-width': 0.25 }));
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const len = i % 2 ? 2.6 : 5;
    rose.append(svg('path', { d: `M0 0 L${Math.sin(a) * len} ${-Math.cos(a) * len}`, 'stroke-width': 0.3 }));
  }
  rose.append(label(-0.6, -5.6, 'N', 1.8, 'strong', 0));
  g.append(rose);
  return g;
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
      const root = svg('svg', { viewBox: '0 0 100 70', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': 'Map of the Fold' });
      root.append(chart());
      for (const loc of v.map) {
        const [x, y] = loc.at;
        const pin = svg('g', { class: `map-pin ${loc.here ? 'here' : ''} ${!loc.visited ? 'fresh' : ''}`, transform: `translate(${x} ${y})`, tabindex: 0, role: 'button', 'aria-label': `${loc.name}${loc.here ? ' (you are here)' : ''}` });
        const anchorEnd = x > 70;
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
        el('div', { class: 'panel-head' }, icon('map'), el('div', { class: 'panel-title', text: 'The Fold' }), el('button', { class: 'xbtn', type: 'button', 'aria-label': 'Close map', 'data-back': '', onClick: () => api.close() }, icon('close'))),
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
