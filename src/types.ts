/** A subset of expectations checked against an API response. */
export interface Expect {
  status?: number;
  /** JSON subset — every key/value here must be present (deep) in the response. */
  json?: Record<string, unknown>;
  /** Substring that must appear in the raw response body. */
  bodyContains?: string;
  /** Each header (case-insensitive) whose value must contain the given string. */
  headers?: Record<string, string>;
  /** Fail if the request took longer than this (ms). */
  maxMs?: number;
}

export interface TestCase {
  name: string;
  method?: string; // default GET
  /** Absolute URL — overrides baseUrl + path. */
  url?: string;
  /** Path appended to the suite baseUrl. */
  path?: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
  expect?: Expect;
  /** Capture values from the response into variables: { token: "json.token" }. */
  save?: Record<string, string>;
}

export interface Suite {
  name: string;
  baseUrl?: string;
  headers?: Record<string, string>;
  variables?: Record<string, unknown>;
  tests: TestCase[];
}

export interface TestResult {
  name: string;
  ok: boolean;
  status: number | null;
  ms: number;
  errors: string[];
}
