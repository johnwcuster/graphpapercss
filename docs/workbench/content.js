// Documentation-only content adapter. Class/overlay changes preserve DOM nodes.
import { sourceStyle } from './source.mjs';
export function syncExampleItems(field, count) {
  while (field.children.length > count) field.lastElementChild.remove();
  const entries = [
    ['Ruler', 'A shared ruler connects alignment across sections.'],
    ['Fields', 'Choose usable space and gutters within the ruler.'],
    ['Layouts', 'Arrange content with deliberate proportions.'],
    ['Source order', 'The reading sequence stays in the HTML.'],
    ['Spacing', 'Keep item spacing distinct from typography.'],
    ['Responsive choices', 'Choose when a different arrangement becomes useful.']
  ];
  while (field.children.length < count) {
    const index = field.children.length;
    const article = document.createElement('article'); article.className = 'tile';
    const heading = document.createElement('h3'), body = document.createElement('p');
    const [title, text] = entries[index % entries.length];
    heading.textContent = title;
    body.textContent = text;
    article.append(heading, body); field.append(article);
  }
  [...field.children].forEach((item, index) => {
    const { color, ink, tint } = sourceStyle(index + 1);
    item.style.setProperty('--source-color', color);
    item.style.setProperty('--source-ink', ink);
    item.style.setProperty('--source-tint', tint);
  });
}
