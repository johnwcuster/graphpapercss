export { describeDiagram } from '../assets/graph-paper/tools/shared/accessibility.mjs';

export function describeControl(button, text) {
  const description = document.createElement('span');
  description.hidden = true;
  description.id = `description-${button.dataset.choiceKey ?? button.dataset.band ?? button.dataset.field}`;
  description.textContent = text;
  button.setAttribute('aria-describedby', description.id);
  button.append(description);
}

export function radioChoice(button, selected) {
  button.setAttribute('role', 'radio');
  button.setAttribute('aria-checked', String(selected));
  button.tabIndex = selected && !button.disabled ? 0 : -1;
}
