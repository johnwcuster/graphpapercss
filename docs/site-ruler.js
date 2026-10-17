// Optional documentation aid. CSS handles drawing; JS only remembers the choice.
const toggle = document.querySelector('.site-ruler-toggle');
const key = 'graph-paper:site-ruler';
if (toggle) {
  try { toggle.checked = localStorage.getItem(key) === 'on'; } catch { /* Storage can be unavailable. */ }
  toggle.addEventListener('change', () => {
    try { localStorage.setItem(key, toggle.checked ? 'on' : 'off'); } catch { /* The control still works. */ }
  });
}
