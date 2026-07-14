// Block the /tests/ directory from ever being served on the public site.
//
// The smoke-test harness under /tests/ is version-controlled but must NOT be
// reachable at builtbysystems.online/tests/. On Cloudflare Pages, Functions are
// matched BEFORE static assets, so this catch-all intercepts every /tests/*
// request and returns 404 — the files still exist in the repo/deployment, but
// are never served. (Scoped to /tests/* only, via _routes.json.)
export function onRequest() {
  return new Response("Not found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
