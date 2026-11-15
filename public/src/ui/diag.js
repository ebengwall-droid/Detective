// "Copy diagnostics": a few plain lines about what this device is doing with
// the game, for a player to send when something looks wrong. Nothing personal
// is in them and nothing leaves the page unless they paste it somewhere.

import { el } from './dom.js';

/**
 * Put the diagnostics on the clipboard. Where a view will not let a page do
 * that (some app views refuse), show the lines instead, selected, so they
 * can be copied by hand. Call it straight from the button's click.
 * @param {{ diagnostics: () => string }} game
 * @param {HTMLButtonElement} button the button that was pressed (its label reports what happened)
 * @param {HTMLElement} holder where to show the lines if they cannot be copied
 */
export function copyDiagnostics(game, button, holder) {
  const label = button.dataset.label ?? (button.dataset.label = button.textContent ?? 'Copy diagnostics');
  let text;
  try {
    text = game.diagnostics();
  } catch (err) {
    text = `The game could not describe itself: ${err?.message ?? err}`;
  }
  const byHand = () => {
    const box = el('textarea', { class: 'diag-box', readonly: '', rows: '9', 'aria-label': 'Diagnostics, to copy by hand' });
    box.value = text;
    holder.replaceChildren(el('div', { class: 'diag-note', text: 'This view will not let the game copy for you. Select all of this and copy it:' }), box);
    box.focus({ preventScroll: true });
    box.select();
  };
  let asked;
  try {
    // Must be asked for inside the click itself.
    asked = navigator.clipboard?.writeText ? navigator.clipboard.writeText(text) : null;
  } catch {
    asked = null;
  }
  if (!asked) return byHand();
  asked.then(
    () => {
      holder.replaceChildren();
      button.textContent = 'Copied';
      setTimeout(() => {
        button.textContent = label;
      }, 2400);
    },
    () => byHand(),
  );
}
