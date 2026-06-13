import type { Suite, TestCase, TestResult } from "./types";
import { interpolate, interpolateDeep, getPath } from "./interpolate";
import { deepContains } from "./assert";

export interface RunOptions {
  /** Injectable fetch (for tests / mocking). Defaults to global fetch. */
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  /** Called as each test finishes (for live reporting). */
  onResult?: (r: TestResult) => void;
}

function hasHeader(h: Record<string, string>, name: string): boolean {
  return Object.keys(h).some((k) => k.toLowerCase() === name.toLowerCase());
}

async function runCase(
  suite: Suite,
  tc: TestCase,
  ctx: Record<string, unknown>,
  f: typeof fetch,
  timeoutMs: number,
): Promise<TestResult> {
  const errors: string[] = [];
  const method = (tc.method ?? "GET").toUpperCase();

  let url = tc.url ?? `${suite.baseUrl ?? ""}${tc.path ?? ""}`;
  url = interpolate(url, ctx);
  if (tc.query) {
    const qs = new URLSearchParams(interpolateDeep(tc.query, ctx) as Record<string, string>).toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }

  const headers = interpolateDeep({ ...(suite.headers ?? {}), ...(tc.headers ?? {}) }, ctx) as Record<string, string>;
  let body: string | undefined;
  if (tc.body != null) {
    body = JSON.stringify(interpolateDeep(tc.body, ctx));
    if (!hasHeader(headers, "content-type")) headers["content-type"] = "application/json";
  }

  const start = Date.now();
  let res: Response;
  try {
    res = await f(url, { method, headers, body, signal: AbortSignal.timeout(timeoutMs) });
  } catch (e) {
    return { name: tc.name, ok: false, status: null, ms: Date.now() - start, errors: [`request failed: ${e instanceof Error ? e.message : String(e)}`] };
  }
  const ms = Date.now() - start;
  const text = await res.text();
  let json: unknown;
  try { json = JSON.parse(text); } catch { /* not json */ }

  const ex = tc.expect ?? {};
  if (ex.status != null && res.status !== ex.status) errors.push(`status: expected ${ex.status}, got ${res.status}`);
  if (ex.json && !deepContains(json, interpolateDeep(ex.json, ctx))) errors.push(`json subset did not match`);
  if (ex.bodyContains && !text.includes(interpolate(ex.bodyContains, ctx))) errors.push(`body missing "${ex.bodyContains}"`);
  if (ex.headers) {
    for (const [k, v] of Object.entries(ex.headers)) {
      const hv = res.headers.get(k);
      if (!hv || !hv.includes(v)) errors.push(`header ${k}: expected to contain "${v}", got "${hv ?? "—"}"`);
    }
  }
  if (ex.maxMs != null && ms > ex.maxMs) errors.push(`too slow: ${ms}ms > ${ex.maxMs}ms`);

  // capture variables for later tests
  if (tc.save) {
    const src = { status: res.status, text, json, headers: Object.fromEntries(res.headers) };
    for (const [name, path] of Object.entries(tc.save)) ctx[name] = getPath(src, path);
  }

  return { name: tc.name, ok: errors.length === 0, status: res.status, ms, errors };
}

/** Run every test in a suite sequentially, threading captured variables forward. */
export async function runSuite(suite: Suite, opts: RunOptions = {}): Promise<TestResult[]> {
  const f = opts.fetchImpl ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const ctx: Record<string, unknown> = { ...(suite.variables ?? {}) };
  const results: TestResult[] = [];
  for (const tc of suite.tests) {
    const r = await runCase(suite, tc, ctx, f, timeoutMs);
    results.push(r);
    opts.onResult?.(r);
  }
  return results;
}
