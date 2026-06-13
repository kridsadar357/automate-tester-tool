#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "node:fs";
import type { Suite } from "./types";
import { runSuite } from "./runner";
import { printResult, printSummary } from "./report";
import { renderHtml } from "./html-report";

async function main() {
  const args = process.argv.slice(2);
  let suiteFile: string | undefined;
  let htmlOutFile: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--html") {
      htmlOutFile = args[i + 1];
      i++;
    } else if (!suiteFile) {
      suiteFile = args[i];
    }
  }

  if (!suiteFile) {
    console.error("Usage: bun run src/cli.ts <suite.json> [--html report.html]");
    process.exit(1);
  }

  const suite: Suite = JSON.parse(readFileSync(suiteFile, "utf-8"));
  const results = await runSuite(suite);

  for (const result of results) {
    printResult(result);
  }

  printSummary(suite.name, results);

  if (htmlOutFile) {
    const html = renderHtml(suite, results);
    writeFileSync(htmlOutFile, html, "utf-8");
    console.log(`\nHTML report written to ${htmlOutFile}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
