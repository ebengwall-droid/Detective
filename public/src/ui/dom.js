// Small DOM helpers and the game's icon set (hand-drawn, stroke-only SVG).

/**
 * Create an element. `props` may hold class, text, html, dataset, on<Event>
 * handlers and plain attributes; children may be nodes, strings or arrays.
 * @param {string} tag
 * @param {Record<string, any>} [props]
 * @param {...any} children
 * @returns {HTMLElement}
 */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, String(value));
  }
  add(node, children);
  return node;
}

/**
 * Append children to a node. Unlike Node.append this flattens arrays and
 * skips null, undefined and false, so conditional children are safe.
 * @param {Node} node
 * @param {...any} children
 */
export function add(node, ...children) {
  for (const child of children) {
    if (child === undefined || child === null || child === false) continue;
    if (Array.isArray(child)) add(node, ...child);
    else node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

/**
 * Mark a full-screen card as 'overflowing' while its content is taller than the screen,
 * so its pinned button gets a backing only when text actually scrolls under it.
 * @param {HTMLElement} card
 */
export function watchOverflow(card) {
  const check = () => card.classList.toggle('overflowing', card.scrollHeight > card.clientHeight + 4);
  requestAnimationFrame(check);
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(check);
    ro.observe(card);
    if (card.firstElementChild) ro.observe(card.firstElementChild);
  }
}

/** How long a sheet takes to leave. Matches `.panel.leaving` in the stylesheet. */
const LEAVE_MS = 190;

/**
 * Take sheets off the screen. As far as the game goes they are gone at once:
 * nothing in them can be pressed, focused or found by the Back button. They
 * stay in the page only for the moment it takes them to fade, because leaving
 * should be quicker than arriving but not instant. With reduced motion they
 * are simply removed.
 * @param {...(Element|null|undefined)} nodes
 */
export function leave(...nodes) {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  for (const node of nodes) {
    if (!node?.isConnected) continue;
    if (still) {
      node.remove();
      continue;
    }
    node.classList.add('leaving');
    node.setAttribute('aria-hidden', 'true');
    node.setAttribute('inert', '');
    node.removeAttribute('role');
    for (const b of node.querySelectorAll('[data-back]')) b.removeAttribute('data-back');
    for (const b of node.querySelectorAll('[id]')) b.removeAttribute('id');
    setTimeout(() => node.remove(), LEAVE_MS);
  }
}

/**
 * Tell a segmented control (tabs, an either-or setting) which of its parts is
 * chosen, so the stylesheet can slide the lit thumb under it.
 * @param {HTMLElement} track
 * @param {number} index
 * @param {number} of
 */
export function setThumb(track, index, of) {
  track.style.setProperty('--n', String(Math.max(1, of)));
  track.style.setProperty('--i', String(Math.max(0, index)));
}

const P = {
  notebook: '<path d="M6 3.5h11a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H6z"/><path d="M6 3.5v17M3.5 7.5h4M3.5 12h4M3.5 16.5h4M10 8h5.5M10 11.5h5.5"/>',
  laptop: '<rect x="4.5" y="5" width="15" height="10" rx="1"/><path d="M2.5 18.5h19l-1.6-3.5H4.1z"/>',
  map: '<path d="M3.5 6.5 9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5-5.5 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
  bulb: '<path d="M8.5 15.5c-1.6-1.2-2.5-3-2.5-5a6 6 0 0 1 12 0c0 2-.9 3.8-2.5 5v2h-7z"/><path d="M9.5 20.5h5M12 2v-.5M4 4.8l-.5-.5M20 4.8l.5-.5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  bag: '<path d="M5 8.5h14l-1 11.5H6z"/><path d="M8.5 8.5V7a3.5 3.5 0 0 1 7 0v1.5M9.5 13h5"/>',
  close: '<path d="M5.5 5.5l13 13M18.5 5.5l-13 13"/>',
  send: '<path d="M4 12h14M12.5 5.5 19 12l-6.5 6.5"/>',
  back: '<path d="M20 12H6M11.5 5.5 5 12l6.5 6.5"/>',
  phone: '<path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2C10.5 19.5 4.500 13.500 4.500 5.500a2 2 0 0 1 2-2z"/>',
  moon: '<path d="M19.5 14.5A8 8 0 0 1 9.500 4.500a8 8 0 1 0 10 10z"/>',
  check: '<path d="M4.5 12.5 10 18l9.5-11.5"/>',
  star: '<path d="m12 3.500 2.600 5.400 5.900.800-4.300 4.100 1 5.900L12 16.900l-5.200 2.800 1-5.900-4.300-4.100 5.900-.8z"/>',
  flask: '<path d="M9.5 3.500h5M10.500 3.500v6L5 19a1.500 1.500 0 0 0 1.300 2.200h11.400A1.500 1.500 0 0 0 19 19l-5.500-9.500v-6"/><path d="M7.500 15.500h9"/>',
  pin: '<path d="M12 21s-6.500-6.200-6.500-11a6.500 6.500 0 0 1 13 0c0 4.800-6.500 11-6.500 11z"/><circle cx="12" cy="10" r="2.300"/>',
  speech: '<path d="M4 5.500h16v10.500h-8.500L7 20v-4H4z"/>',
  door: '<path d="M6.500 20.500v-17h11v17M4 20.500h16"/><circle cx="14.500" cy="12.500" r=".8"/>',
  hand: '<path d="M8.500 11.500v-6a1.500 1.500 0 0 1 3 0v5M11.500 10.500v-6.500a1.500 1.500 0 0 1 3 0v6.500M14.500 10.500V6a1.500 1.500 0 0 1 3 0v8.500c0 3.300-2.200 6-5.500 6s-4.500-1.500-6-4l-2-3.500a1.500 1.500 0 0 1 2.500-1.500l2 2.500"/>',
  lantern: '<path d="M9 8.500h6l1.500 9.500h-9zM8 18h8v2.500H8zM10 8.500V6.500h4v2M9.500 6.500a2.500 2.500 0 0 1 5 0"/><path d="M12 11.500c1.200 1.300 1.200 2.800 0 3.800-1.200-1-1.200-2.500 0-3.800z"/>',
  token: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="5.200"/><path d="M12 9.500v2.700l1.800 1"/>',
  doc: '<path d="M6.500 3.500h8l3.500 3.500v13.500h-11.500z"/><path d="M14.500 3.500v3.500h3.500M9 11h6.500M9 14h6.500M9 17h4"/>',
  paper: '<path d="M6 4.500 17.500 3.500l1 16-12 1z"/><path d="M9 9l6.500-.5M9.300 12.500l6.500-.5M9.600 16l4-.3"/>',
  photo: '<rect x="3.500" y="5.500" width="17" height="13.500" rx="1"/><path d="m3.500 16 4.500-4.500 4 4 3-3 5.500 5"/><circle cx="15.500" cy="9.500" r="1.300"/>',
  letter: '<rect x="3.500" y="6" width="17" height="12.500" rx="1"/><path d="m3.500 7 8.500 6.500L20.500 7"/>',
  chain: '<rect x="3.500" y="9" width="8" height="6" rx="3"/><rect x="12.500" y="9" width="8" height="6" rx="3"/><path d="M9.500 12h5"/>',
  vial: '<path d="M9.500 3.500h5M10.500 3.500v14a1.500 1.500 0 0 0 3 0v-14M10.500 11h3"/>',
  book: '<path d="M4 5c3-1.200 5.500-1.200 8 .5 2.500-1.700 5-1.700 8-.5v14c-3-1.200-5.500-1.200-8 .5-2.500-1.700-5-1.700-8-.5z"/><path d="M12 5.500V19.500"/>',
  box: '<path d="M4 8 12 4l8 4v8.500l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8.500"/>',
  tape: '<rect x="3.500" y="7" width="17" height="10.500" rx="1.500"/><circle cx="8.500" cy="12" r="1.800"/><circle cx="15.500" cy="12" r="1.800"/><path d="M8.500 15.500h7"/>',
  button: '<circle cx="12" cy="12" r="7.500"/><circle cx="9.800" cy="9.800" r=".9"/><circle cx="14.200" cy="9.800" r=".9"/><circle cx="9.800" cy="14.200" r=".9"/><circle cx="14.200" cy="14.200" r=".9"/>',
  board: '<rect x="3.500" y="4.500" width="17" height="13" rx="1"/><path d="M8 20.500l1.500-3M16 20.500l-1.500-3M7 8.500h4v3.500H7zM14 9h3M14 12h3M7 14.500h10"/>',
  people: '<circle cx="9" cy="8.500" r="3"/><path d="M3.500 19.500c.500-3.500 2.700-5.500 5.500-5.500s5 2 5.500 5.500"/><path d="M15.500 5.800a3 3 0 0 1 0 5.400M17.500 14.500c1.700.800 2.700 2.500 3 5"/>',
  list: '<path d="M8.500 6.500h12M8.500 12h12M8.500 17.500h12"/><circle cx="4.500" cy="6.500" r=".9"/><circle cx="4.500" cy="12" r=".9"/><circle cx="4.500" cy="17.500" r=".9"/>',
  sound: '<path d="M4.500 9.500h3l4.500-4v13l-4.500-4h-3z"/><path d="M15.500 9a4 4 0 0 1 0 6M18 6.500a7.500 7.500 0 0 1 0 11"/>',
  mute: '<path d="M4.500 9.500h3l4.500-4v13l-4.500-4h-3z"/><path d="m16 9.500 5 5M21 9.500l-5 5"/>',
  gavel: '<path d="m13.500 4.500 6 6M10.500 7.500l6 6M12 6l-6.500 6.500 3 3L15 9M8 15.500l-4.500 4.500M13 20.500h8"/>',
  help: '<circle cx="12" cy="12" r="8.500"/><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.700.400-1 1-1 1.700M12 16.800v.2"/>',
};

/** Inline SVG icon. */
export function icon(name, size = 22) {
  const body = P[name] ?? P.doc;
  const span = document.createElement('span');
  span.className = 'ico';
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  return span;
}

/** A button with an icon and optional label. */
export function iconButton(name, label, props = {}) {
  return el('button', { type: 'button', 'aria-label': label, title: label, ...props, class: `ibtn ${props.class ?? ''}` }, icon(name), props.showLabel ? el('span', { class: 'ibtn-label', text: label }) : null);
}

/**
 * Turn the game's light markup into nodes: *stage business* becomes italic,
 * blank lines become paragraphs.
 */
export function prose(text, cls = '') {
  const wrap = el('div', { class: `prose ${cls}` });
  for (const para of String(text ?? '').split(/\n{2,}/)) {
    if (!para.trim()) continue;
    const p = el('p');
    const parts = para.split(/(\*[^*\n]+\*)/g);
    for (const part of parts) {
      if (!part) continue;
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) p.append(el('em', { text: part.slice(1, -1) }));
      else {
        const lines = part.split('\n');
        lines.forEach((line, i) => {
          if (i) p.append(el('br'));
          p.append(line);
        });
      }
    }
    wrap.append(p);
  }
  return wrap;
}

/** Reveal text a few characters at a time; resolves when done. Click to finish. */
export function typeInto(node, text, { cps = 70, signal } = {}) {
  return new Promise((resolve) => {
    let i = 0;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      node.replaceChildren(prose(text));
      node.removeEventListener('click', finish);
      resolve();
    };
    node.addEventListener('click', finish);
    signal?.addEventListener('abort', finish);
    const start = performance.now();
    const tick = () => {
      if (done) return;
      i = Math.min(text.length, Math.floor(((performance.now() - start) / 1000) * cps));
      node.replaceChildren(prose(text.slice(0, i)));
      if (i >= text.length) finish();
      else requestAnimationFrame(tick);
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
    else tick();
  });
}
