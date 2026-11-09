// Published 0.4 exploration links retain their original semantics.
const url = new URL(location.href);
if (['grid','set','flow','field','band','items','width'].some(key => url.searchParams.has(key)) && !url.searchParams.has('state')) {
  location.replace(new URL(`./configurator-0.4.html${url.search}${url.hash}`, location.href));
} else {
  await import('./sequence/app.mjs');
}
