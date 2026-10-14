const { records } = await fetch("./geometry-changes.json").then(response => response.json());
for (const record of records.filter(r => r.classification === "ACCEPTED")) {
  const section = document.createElement("section");
  const title = document.createElement("h2"); title.textContent = `${record.id} · ${record.field} · Accepted 1.0 change`;
  const description = document.createElement("p");
  description.textContent = `Legacy widths: ${record.legacy.map(c => c.end - c.start).join(" / ")} bits. Candidate widths: ${record.candidate.map(c => c.end - c.start).join(" / ")} bits.`;
  const legacyLabel = document.createElement("p"); legacyLabel.textContent = "0.2.3 legacy reference";
  const iframe = document.createElement("iframe");
  iframe.title = `${record.id} ${record.field} reference`;
  iframe.loading = "lazy"; iframe.style.width = "1024px"; iframe.style.height = "180px";
  iframe.src = `./legacy-reference.html?${new URLSearchParams({ grid: record.id, set: "set_03", flow: "", rhythm: record.field, width: 1024 })}`;
  const candidateLabel = document.createElement("p"); candidateLabel.textContent = "Accepted whole-bit implementation";
  const scroll = document.createElement("div"); scroll.className = "scroll-preview";
  const candidate = document.createElement("div"); candidate.className = "gp_canvas"; candidate.style.width = "1024px";
  const composition = document.createElement("section"); composition.className = `gp_field gp_field--${record.field} ${record.id} set_03`;
  record.candidate.forEach((column, i) => {
    const tile = document.createElement("article"); tile.className = "tile";
    tile.textContent = `Column ${i + 1}: bits ${column.start}–${column.end}`;
    composition.append(tile);
  });
  candidate.append(composition);
  scroll.append(candidate);
  section.append(title, description, legacyLabel, iframe, candidateLabel, scroll);
  document.getElementById("reviews").append(section);
}
