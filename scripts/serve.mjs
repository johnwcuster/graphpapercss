import { createReadStream } from "node:fs";
import { stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const root = resolve(process.cwd());
const port = Number.parseInt(process.env.GRAPHPAPER_PORT ?? "4173", 10);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8"
};

const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);

  if (request.method === "POST" && pathname === "/__graphpaper_capture") {
    const chunks = [];
    let size = 0;

    for await (const chunk of request) {
      size += chunk.length;
      if (size > 2_000_000) {
        response.writeHead(413).end("Capture is too large");
        return;
      }
      chunks.push(chunk);
    }

    try {
      const capture = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      const formatted = `${JSON.stringify(capture)}\n`;
      await writeFile(resolve(root, "tests/fixtures/legacy-layout-capture.json"), formatted);
      response.writeHead(204).end();
    } catch {
      response.writeHead(400).end("Invalid capture JSON");
    }
    return;
  }

  const requestedPath = pathname === "/" ? "/docs/configurator.html" : pathname;
  const filePath = resolve(root, `.${requestedPath}`);

  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  try {
    const file = await stat(filePath);
    if (!file.isFile()) throw new Error("Not a file");

    response.writeHead(200, {
      "Content-Type": contentTypes[extname(filePath)] ?? "application/octet-stream"
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404).end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Graph Paper prototype: http://127.0.0.1:${port}/docs/configurator.html`);
  console.log(`Legacy gallery: http://127.0.0.1:${port}/tests/legacy-gallery.html`);
});
