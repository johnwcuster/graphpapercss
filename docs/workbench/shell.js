// Optional control shell. It neither queries nor changes composition markup.
export function mountShell({ root, launcher, workspace }) {
  const $ = id => root.querySelector(`#${id}`);
  const panel = $('workbench-panel'), toggle = $('panel-toggle');
  let returnFocus = null;
  const abort = new AbortController();
  const on = (node, event, handler) => node.addEventListener(event, handler, { signal: abort.signal });
  function syncDock() { workspace.dataset.controlDock = root.dataset.dock; }
  function panelOpen(open) {
    panel.hidden = !open;
    toggle.hidden = open;
    toggle.style.top = ''; toggle.style.bottom = '';
    toggle.setAttribute('aria-expanded', String(open));
    if (open) panel.querySelector('h2').focus({ preventScroll: true });
    if (!open && panel.contains(document.activeElement)) toggle.focus();
  }
  function visible(show, keepFocus = false) {
    if (!show) {
      returnFocus = root.contains(document.activeElement) ? document.activeElement : null;
      // Preserve the hide control's dock-relative corner before hiding the rail.
      const bounds = $('workbench-hide').getBoundingClientRect();
      const narrow = matchMedia('(max-width: 700px)').matches;
      const leftDock = !narrow && root.dataset.dock === 'left', bottomDock = root.dataset.dock === 'bottom';
      launcher.style.left = leftDock ? `${Math.max(8, bounds.left)}px` : 'auto';
      launcher.style.right = leftDock ? 'auto' : `${Math.max(8, innerWidth - bounds.right)}px`;
      launcher.style.top = bottomDock ? 'auto' : `${Math.max(8, bounds.top)}px`;
      launcher.style.bottom = bottomDock ? `${Math.max(8, innerHeight - bounds.bottom)}px` : 'auto';
    }
    root.hidden = !show;
    launcher.hidden = show;
    launcher.setAttribute('aria-expanded', String(show));
    if (show) (returnFocus?.isConnected && !returnFocus.closest('[hidden]') ? returnFocus : panel.hidden ? toggle : $('panel-close')).focus();
    else if (!keepFocus) launcher.focus();
  }
  on(toggle, 'click', () => panelOpen(panel.hidden));
  on($('panel-close'), 'click', () => panelOpen(false));
  on($('workbench-hide'), 'click', () => visible(false));
  on(launcher, 'click', () => visible(true));
  on(window, 'resize', () => {
    if (launcher.hidden) return;
    const bounds = launcher.getBoundingClientRect();
    if (bounds.bottom > innerHeight - 8) { launcher.style.top = 'auto'; launcher.style.bottom = '8px'; }
    if (bounds.right > innerWidth - 8) { launcher.style.left = 'auto'; launcher.style.right = '8px'; }
  });
  on($('dock'), 'change', event => { root.dataset.dock = event.target.value; syncDock(); });
  on($('panel-dock'), 'change', event => { root.dataset.panelDock = event.target.value; });
  on(document, 'pointerdown', event => {
    for (const menu of root.querySelectorAll('details.overlay-menu[open], details.transition-menu[open]')) {
      if (!event.composedPath().includes(menu)) menu.open = false;
    }
  });
  for (const menu of root.querySelectorAll('details.overlay-menu, details.transition-menu')) on(menu, 'toggle', () => {
    if (menu.open) for (const other of root.querySelectorAll('details.overlay-menu[open], details.transition-menu[open]')) {
      if (other !== menu) other.open = false;
    }
  });
  on(document, 'keydown', event => {
    const editing = event.target.closest('input, textarea, select, [contenteditable="true"]');
    if (event.altKey && event.shiftKey && event.code === 'KeyG' && !event.repeat && !editing) {
      event.preventDefault(); visible(root.hidden);
    }
    const radio = event.target.closest('[role="radio"]');
    if (radio && root.contains(radio) && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
      const choices = [...radio.closest('[role="radiogroup"]').querySelectorAll('[role="radio"]')].filter(node => !node.disabled && node.getClientRects().length);
      const index = choices.indexOf(radio), step = ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1;
      const next = choices[event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : (index + step + choices.length) % choices.length];
      event.preventDefault(); next?.focus(); next?.click();
    }
    if (event.key === 'Escape' && root.contains(event.target) && !editing && !event.defaultPrevented) {
      const menu = root.querySelector('details.overlay-menu[open], details.transition-menu[open]');
      if (menu) { menu.open = false; menu.querySelector('summary').focus(); }
      else panelOpen(false);
    }
  });
  function intersects(a, b) { return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; }
  function avoidPageFocus(control, bounds) {
    if (control.hidden || !intersects(bounds, control.getBoundingClientRect())) return;
    const box = control.getBoundingClientRect(), rail = $('workbench-rail').getBoundingClientRect();
    const bottomTop = (!root.hidden && root.dataset.dock === 'bottom' ? rail.top : innerHeight) - box.height - 12;
    const top = !root.hidden && rail.width > innerWidth / 2 && root.dataset.dock !== 'bottom' ? rail.bottom + 12 : 12;
    control.style.top = `${bounds.bottom <= bottomTop ? bottomTop : top}px`;
    control.style.bottom = 'auto';
  }
  on(document, 'focusin', event => {
    const node = event.target;
    if (!workspace.contains(node)) return;
    for (const menu of root.querySelectorAll('details.overlay-menu[open], details.transition-menu[open]')) menu.open = false;
    const bounds = node.getBoundingClientRect();
    // These are nonmodal tools: never trap focus in them or leave page focus underneath them.
    if (!root.hidden && !panel.hidden && intersects(bounds, panel.getBoundingClientRect())) panelOpen(false);
    if (!root.hidden && intersects(bounds, $('workbench-rail').getBoundingClientRect())) visible(false, true);
    // A small reopen button must not replace the panel as the new occluder.
    if (!root.hidden && panel.hidden) avoidPageFocus(toggle, bounds);
    if (root.hidden) avoidPageFocus(launcher, bounds);
  });
  on(root, 'focusin', event => {
    if (panel.contains(event.target) && event.target !== panel.querySelector('h2')) {
      event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  });
  let sizeFrame;
  const size = new ResizeObserver(() => {
    cancelAnimationFrame(sizeFrame);
    sizeFrame = requestAnimationFrame(() => {
      const height = Math.ceil($('workbench-rail').getBoundingClientRect().height);
      if (!height || root.hidden) return;
      const value = `${height}px`;
      if (root.style.getPropertyValue('--rail-offset') !== value) root.style.setProperty('--rail-offset', value);
      if (workspace.style.getPropertyValue('--workbench-rail-height') !== value) workspace.style.setProperty('--workbench-rail-height', value);
    });
  });
  size.observe($('workbench-rail'));
  panel.querySelector('h2').tabIndex = -1;
  toggle.setAttribute('aria-label', 'Edit composition: open settings panel');
  syncDock();
  return { destroy() { abort.abort(); size.disconnect(); cancelAnimationFrame(sizeFrame); delete workspace.dataset.controlDock; workspace.style.removeProperty('--workbench-rail-height'); } };
}
