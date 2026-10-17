// Documentation-only content adapter. Class/overlay changes preserve DOM nodes.
import { sourceStyle } from './source.mjs';
export function syncExampleItems(field, count) {
  while (field.children.length > count) field.lastElementChild.remove();
  const titles = ['Lead story', 'Perspective', 'Dispatch', 'Analysis', 'Interview', 'Field notes'];
  while (field.children.length < count) {
    const index = field.children.length;
    const article = document.createElement('article'); article.className = 'tile';
    const heading = document.createElement('h3'), body = document.createElement('p');
    heading.textContent = titles[index % titles.length];
    body.textContent = 'Content keeps its logical DOM position.';
    article.append(heading, body); field.append(article);
  }
  [...field.children].forEach((item, index) => {
    const { color, ink, tint } = sourceStyle(index + 1);
    item.style.setProperty('--source-color', color);
    item.style.setProperty('--source-ink', ink);
    item.style.setProperty('--source-tint', tint);
  });
}
