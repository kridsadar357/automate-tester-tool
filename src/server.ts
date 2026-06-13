import { runSuite } from "./runner";
import { renderHtml } from "./html-report";
import type { Suite } from "./types";
import { readFileSync, readdirSync } from "node:fs";

const PORT = Number(process.env.PORT) || 8787;

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    if (pathname === "/") {
      const files = readdirSync("suites").filter(f => f.endsWith(".json"));
      const links = files.map(f => `<li><a href="/run?suite=${encodeURIComponent(f)}">${f}</a></li>`).join("\n");
      const html = `<!DOCTYPE html>
<html>
<head><title>Test Suites</title></head>
<body>
<h1>Test Suites</h1>
<ul>
${links}
</ul>
</body>
</html>`;
      return new Response(html, { headers: { "content-type": "text/html" } });
    }

    if (pathname === "/run") {
      const suiteName = url.searchParams.get("suite");
      if (!suiteName) {
        return new Response("Missing suite parameter", { status: 400 });
      }
      const suite: Suite = JSON.parse(readFileSync("suites/" + suiteName, "utf8"));
      const results = await runSuite(suite);
      const html = renderHtml(suite.name, results);
      return new Response(html, { headers: { "content-type": "text/html" } });
    }

    return new Response("Not Found", { status: 404 });
  },
});
