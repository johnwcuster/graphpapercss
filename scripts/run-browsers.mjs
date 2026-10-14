import { chromium, firefox, webkit } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

// Own a separate server so checks cannot depend on stale local dev state.
const port = 4186;
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["scripts/serve.mjs"], {
  env: { ...process.env, GRAPHPAPER_PORT: String(port) }, stdio: ["ignore", "pipe", "pipe"]
});
await new Promise((resolve, reject) => {
  server.stdout.once("data", resolve);
  server.once("error", reject);
  server.once("exit", code => reject(new Error(`Test server exited: ${code}`)));
});
const reports = [];
try {
  for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
    const selected = process.argv.find(arg => arg.startsWith("--engine="))?.split("=")[1];
    if (selected && selected !== name) continue;
    const browser = await engine.launch({ headless: true });
    try {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      const assets = process.argv.includes("--legacy-only") ? [] : process.argv.includes("--distribution")
        ? ["main.css", "main.min.css", "main.layer.css", "main.layer.min.css"] : ["main.css"];
      for (const asset of assets) {
        await page.goto(`${origin}/tests/geometry.html?css=${asset}`);
        await page.waitForFunction(() => window.__geometryResults, { timeout: 120000 });
        const result = await page.evaluate(() => window.__geometryResults);
        reports.push({ browser: name, version: browser.version(), asset, ...result });
        console.log(`${name} ${asset}: ${result.passed ? "PASS" : "FAIL"}, ${result.combinations} combinations, ${result.assertions} assertions`);
        if (!result.passed) throw new Error(JSON.stringify(result.failures.slice(0, 20)));
      }
      await page.goto(`${origin}/docs/configurator.html?grid=grid_03a&field=wide&set=set_06&width=1024`);
      await page.waitForFunction(() => document.querySelectorAll("#composition > article").length === 6);
      const recipeCount = await page.locator("#grid option").count();
      if (recipeCount !== 75) throw new Error(`Expected 75 recipes, got ${recipeCount}`);
      await page.selectOption("#field", "ruled");
      if (!await page.locator("#composition > .gp_rule--end").count()) throw new Error("Ruled markers missing");
      await page.locator("#width").evaluate(element => { element.value = "320"; element.dispatchEvent(new Event("input")); });
      if (!await page.locator("#summary").textContent().then(text => text.startsWith("stacked"))) throw new Error("Responsive label incorrect");
      await page.check("#compare");
      await page.waitForFunction(() => document.getElementById("reference").contentDocument?.querySelectorAll("article").length === 6);
      await page.goto(`${origin}/docs/geometry-changes.html`);
      await page.waitForFunction(() => document.querySelectorAll("#reviews > section").length === 12);
      if (errors.length) throw new Error(errors.join("\n"));
      console.log(`${name}: configurator and accepted-change regression checks PASS`);
      if (process.argv.includes("--distribution") || process.argv.includes("--legacy-only")) {
        // Replay optional legacy builds without modifying the 0.2.3 baseline.
        let profile = null;
        await page.route("**/css/legacy/main.css", async route => {
          if (!profile) return route.continue();
          const response = await page.request.get(`${origin}/css/${profile}`);
          await route.fulfill({ response });
        });
        const collect = async () => {
          await page.goto(`${origin}/tests/legacy-regression.html`);
          await page.waitForFunction(() => window.__legacyResults);
          const result = await page.evaluate(() => window.__legacyResults);
          if (result.error) throw new Error(result.error);
          return result.configurations;
        };
        const baseline = await collect();
        for (const asset of ["compat.css", "compat.min.css", "legacy/main.css", "legacy/main.min.css"]) {
          profile = asset;
          assert.deepEqual(await collect(), baseline, `${name}/${asset}: legacy capture changed`);
          reports.push({ browser: name, version: browser.version(), asset, passed: true, combinations: Object.keys(baseline).length, failures: [] });
          console.log(`${name} ${asset}: PASS, ${Object.keys(baseline).length} frozen-reference configurations`);
        }
      }
    } finally { await browser.close(); }
  }
  await mkdir("test-results", { recursive: true });
  await writeFile(process.argv.includes("--legacy-only") ? "test-results/legacy-browsers.json" : "test-results/browsers.json", `${JSON.stringify(reports, null, 2)}\n`);
} finally { server.kill("SIGTERM"); }
