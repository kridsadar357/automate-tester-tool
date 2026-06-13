/** Assertion helpers. `deepContains` checks that `expected` is a subset of `actual`. */
export function deepContains(actual: unknown, expected: unknown): boolean {
  if (expected === null || typeof expected !== "object") {
    return actual === expected;
  }
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return false;
    // each expected element must match the actual element at the same index
    return expected.every((v, i) => deepContains(actual[i], v));
  }
  if (!actual || typeof actual !== "object") return false;
  const a = actual as Record<string, unknown>;
  return Object.entries(expected as Record<string, unknown>).every(([k, v]) => deepContains(a[k], v));
}
