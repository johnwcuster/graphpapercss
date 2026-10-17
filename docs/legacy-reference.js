// Keep the historical stylesheet in its own document, never beside modern core.
const query = new URLSearchParams(location.search);
for (const [key, value] of Object.entries({ grid: 'grid_03', set: 'set_03', flow: '', rhythm: 'wide', width: '1024' })) {
  if (!query.has(key)) query.set(key, value);
}
const width = Math.min(1200, Math.max(280, Number(query.get('width')) || 1024));
query.set('width', width);
const frame = document.getElementById('legacy-preview');
frame.style.width = `${width}px`;
document.getElementById('legacy-description').textContent = `${query.get('grid')} · ${query.get('set')} · ${query.get('flow') || 'default flow'} · ${query.get('rhythm')} · ${width}px`;
frame.addEventListener('load', () => {
  const content = frame.contentDocument;
  const measure = () => { frame.style.height = `${Math.max(180, content.body.scrollHeight)}px`; };
  new ResizeObserver(measure).observe(content.body);
  measure();
});
frame.src = `./fixtures/legacy-renderer.html?${query}`;
