import type { TestResult } from "./types";

const E = String.fromCharCode(27); // ANSI escape
const C = { reset: `${E}[0m`, green: `${E}[32m`, red: `${E}[31m`, dim: `${E}[2m`, cyan: `${E}[36m`, bold: `${E}[1m` };

export function printResult(r: TestResult): void {
  const mark = r.ok ? `${C.green}✓${C.reset}` : `${C.red}✗${C.reset}`;
  const status = r.status == null ? "-" : r.status;
  console.log(`  ${mark} ${r.name} ${C.dim}(${status}, ${r.ms}ms)${C.reset}`);
  for (const e of r.errors) console.log(`      ${C.red}↳ ${e}${C.reset}`);
}

export function printSummary(name: string, results: TestResult[]): { passed: number; failed: number } {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  const tone = failed === 0 ? C.green : C.red;
  console.log(`\n${tone}${C.bold}${name}: ${passed}/${results.length} passed${C.reset}` + (failed ? ` ${C.red}(${failed} failed)${C.reset}` : ""));
  return { passed, failed };
}
