import { test, expect } from "bun:test";
import { runSuite } from "../src/runner";
import { deepContains } from "../src/assert";
import { interpolate, getPath } from "../src/interpolate";
import type { Suite } from "../src/types";

test("deepContains matches a subset", () => {
  expect(deepContains({ a: 1, b: 2 }, { a: 1 })).toBe(true);
  expect(deepContains({ a: 1 }, { a: 2 })).toBe(false);
  expect(deepContains({ u: { id: 5, name: "x" } }, { u: { id: 5 } })).toBe(true);
});

test("interpolate + getPath", () => {
  expect(interpolate("/users/{{id}}", { id: 5 })).toBe("/users/5");
  expect(getPath({ json: { a: { b: 7 } } }, "json.a.b")).toBe(7);
});

test("runSuite passes and chains a saved variable into a later request", async () => {
  const suite: Suite = {
    name: "chain",
    baseUrl: "http://x",
    tests: [
      { name: "login", method: "POST", path: "/login", expect: { status: 200, json: { ok: true } }, save: { token: "json.token" } },
      { name: "me", path: "/me", headers: { authorization: "Bearer {{token}}" }, expect: { status: 200, json: { user: "a" } } },
    ],
  };
  let seenAuth = "";
  const f = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/login")) return new Response(JSON.stringify({ ok: true, token: "T123" }), { status: 200 });
    seenAuth = (init?.headers as Record<string, string>)?.authorization ?? "";
    return new Response(JSON.stringify({ user: "a" }), { status: 200 });
  }) as typeof fetch;

  const res = await runSuite(suite, { fetchImpl: f });
  expect(res.every((r) => r.ok)).toBe(true);
  expect(seenAuth).toBe("Bearer T123");
});

test("runSuite reports a failing assertion", async () => {
  const suite: Suite = { name: "fail", baseUrl: "http://x", tests: [{ name: "bad", path: "/x", expect: { status: 200 } }] };
  const f = (async () => new Response("err", { status: 500 })) as typeof fetch;
  const res = await runSuite(suite, { fetchImpl: f });
  expect(res[0]!.ok).toBe(false);
  expect(res[0]!.errors[0]).toContain("status");
});
