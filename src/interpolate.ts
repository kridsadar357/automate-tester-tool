/** Variable interpolation + dotted-path access used by the runner. */

/** Read a dotted path (e.g. "json.user.id") out of a nested object. */
export function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

/** Replace {{ var.path }} occurrences in a string from the context. */
export function interpolate(value: string, ctx: Record<string, unknown>): string {
  return value.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key: string) => {
    const v = getPath(ctx, key);
    return v == null ? "" : String(v);
  });
}

/** Deep-interpolate every string inside an object/array/primitive. */
export function interpolateDeep(value: unknown, ctx: Record<string, unknown>): unknown {
  if (typeof value === "string") return interpolate(value, ctx);
  if (Array.isArray(value)) return value.map((v) => interpolateDeep(v, ctx));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = interpolateDeep(v, ctx);
    return out;
  }
  return value;
}
