// The harbour chart: where you can go, and the way to end the day.

import { el, icon } from './dom.js';
import { confirmCard } from './hud.js';

const NS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs = {}, ...children) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  for (const c of children) if (c) node.append(c);
  return node;
}

/** Draw Greyhaven: land along the top and west, the harbour, Marrow Point and the Teeth. */
function chart() {
  const g = svg('g');
  g.append(
    svg('rect', { x: 0, y: 0, width: 100, height: 70, fill: '#0e2029' }),
    // Depth contours.
    ...[0, 1, 2, 3].map((i) => svg('path', { d: `M ${28 + i * 5} 70 C ${40 + i * 4} ${52 - i * 2}, ${58 + i * 3} ${46 + i * 3}, 100 ${34 + i * 7}`, fill: 'none', stroke: '#1d3a45', 'stroke-width': 0.25, 'stroke-dasharray': '1.2 1.2' })),
    // Land.
    svg('path', {
      d: 'M0 0 H100 V20 C90 26 84 14 72 22 C64 36 52 34 49 26 C44 36 40 44 44 56 C38 60 30 58 26 66 L18 70 H0 Z',
      fill: '#1b2a26',
      stroke: '#5c6b55',
      'stroke-width': 0.4,
    }),
    // Marrow Point spit.
    svg('path', { d: 'M72 22 C78 36 84 50 88 60 C84 52 78 36 76 21 Z', fill: '#1b2a26', stroke: '#5c6b55', 'stroke-width': 0.4 }),
    // Quays.
    ...[[44, 50, 9, 1.2], [47, 54, 12, 1.2], [44.5, 56, 1.2, 5]].map(([x, y, w, h]) => svg('rect', { x, y, width: w, height: h, fill: '#2a3b36', stroke: '#5c6b55', 'stroke-width': 0.2 })),
    // The Teeth.
    ...[[91, 64], [93, 66.5], [89.5, 67], [94.5, 63.5], [92, 68.5]].map(([x, y]) => svg('path', { d: `M${x} ${y} l1 -1.6 l1 1.6 z`, fill: '#56655f' })),
    // Streets, faintly.
    ...['M10 12 L40 28', 'M20 6 L30 44', 'M40 8 L62 20', 'M8 34 L34 46', 'M30 44 L44 50'].map((d) => svg('path', { d, fill: 'none', stroke: '#2b3d38', 'stroke-width': 0.35 })),
  );
  const label = (x, y, text, size = 2.1, fill = '#6f8377', spacing = 0.35) => {
    const t = svg('text', { x, y, 'font-size': size, fill, 'letter-spacing': spacing, 'font-family': 'Marcellus, Georgia, serif' });
    t.textContent = text;
    return t;
  };
  g.append(label(6, 5.5, 'GREYHAVEN', 3.2, '#8a9a86', 0.9), label(60, 44, 'THE HARBOUR', 2, '#3f6470', 0.6), label(78, 46, 'MARROW POINT', 1.7, '#6f8377'), label(86, 60, 'THE TEETH', 1.5, '#6f8377'), label(6, 62, 'TO HARROWGATE ↓', 1.5, '#3f6470'));
  // Compass rose.
  const rose = svg('g', { transform: 'translate(90 9)' });
  rose.append(svg('circle', { r: 4.2, fill: 'none', stroke: '#5c6b55', 'stroke-width': 0.25 }));
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const len = i % 2 ? 2.6 : 5;
    rose.append(svg('path', { d: `M0 0 L${Math.sin(a) * len} ${-Math.cos(a) * len}`, stroke: '#5c6b55', 'stroke-width': 0.3 }));
  }
  rose.append(label(-0.7, -5.6, 'N', 1.8, '#8a9a86', 0));
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
    const ok = await confirmCard(game.cards, { title: 'Call it a night?', text: v.rest.warn, yes: 'Go home', no: 'Keep working' });
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
      const root = svg('svg', { viewBox: '0 0 100 70', preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': 'Map of Greyhaven' });
      root.append(chart());
      for (const loc of v.map) {
        const [x, y] = loc.at;
        const pin = svg('g', { class: `map-pin ${loc.here ? 'here' : ''} ${!loc.visited ? 'fresh' : ''}`, transform: `translate(${x} ${y})`, tabindex: 0, role: 'button', 'aria-label': `${loc.name}${loc.here ? ' (you are here)' : ''}` });
        const anchorEnd = x > 70;
        const text = svg('text', { x: anchorEnd ? -2.6 : 2.6, y: 0.9, 'font-size': 2.5, 'text-anchor': anchorEnd ? 'end' : 'start' });
        text.textContent = loc.name;
        pin.append(svg('circle', { class: 'halo', r: 5 }), svg('circle', { r: 6, fill: 'transparent' }), svg('circle', { class: 'dot', r: loc.here ? 1.9 : 1.5 }), text);
        if (loc.here) {
          const here = svg('text', { x: anchorEnd ? -2.6 : 2.6, y: 3.6, 'font-size': 1.6, 'text-anchor': anchorEnd ? 'end' : 'start', fill: '#ffb45e' });
          here.textContent = 'you are here';
          here.setAttribute('style', 'fill:#ffb45e');
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
      const restBtn = v.rest ? el('button', { class: `btn ${v.rest.can ? '' : 'quiet'}`, type: 'button', onClick: rest }, icon('moon', 18), 'Call it a night') : null;
      scrim = el('div', { class: 'scrim', onClick: () => api.close() });
      panel = el(
        'section',
        { class: 'panel full', role: 'dialog', 'aria-label': 'Map' },
        el('div', { class: 'panel-head' }, icon('map'), el('div', { class: 'panel-title', text: 'Greyhaven' }), el('button', { class: 'xbtn', type: 'button', 'aria-label': 'Close map', 'data-back': '', onClick: () => api.close() }, icon('close'))),
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
      panel.remove();
      scrim.remove();
      panel = null;
      if (!silent) game.panelClosed('map');
    },
  };
  return api;
}
