#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import type { Suite } from "./types";
import { runSuite } from "./runner";
import { printResult, printSummary } from "./report";

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("usage: apitest <suite.json>");
    process.exit(2);
  }
  let suite: Suite;
  try {
    suite = JSON.parse(readFileSync(file, "utf8")) as Suite;
  } catch (e) {
    console.error(`ไม่สามารถอ่าน suite "${file}": ${e instanceof Error ? e.message : e}`);
    process.exit(2);
  }

  console.log(`\n▶ ${suite.name} ${suite.baseUrl ? `(${suite.baseUrl})` : ""}`);
  const results = await runSuite(suite, { onResult: printResult });
  const { failed } = printSummary(suite.name, results);
  process.exit(failed === 0 ? 0 : 1);
}

void main();
