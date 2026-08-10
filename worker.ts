export interface Env {}
export default {
  async fetch(req: Request, _e: Env, _c: ExecutionContext): Promise<Response> {
    const u = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    const R: Record<string, string> = {
      "/v1": "https://api.kilo.ai/api/gateway",
      "/ocz": "https://opencode.ai/zen",
      "/agnes": "https://apihub.agnes-ai.com/apihub",
      "/nim": "https://integrate.api.nvidia.com",
      "/lf": "https://logfare.ai",
      "/or": "https://openrouter.ai/api",
      "/groq": "https://api.groq.com/openai",
      "/cerebras": "https://api.cerebras.ai",
    };
    if (u.pathname === "/") {
      const rows = Object.entries(R).map(([p, t]) => p + "  ->  " + t).join("\n");
      return new Response("<pre style=\"font:14px monospace;color:#0a0;padding:24px\">APX is OK\n\n" + rows + "</pre>", { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    const pre = Object.keys(R).sort((a, b) => b.length - a.length).find(p => u.pathname === p || u.pathname.startsWith(p + "/"));
    if (!pre) return Response.json({ error: "route not found", available: Object.keys(R) }, { status: 404, headers: CORS });
    const h = new Headers(req.headers);
    h.delete("host"); h.delete("content-length");
    let res: Response;
    try {
      res = await fetch(R[pre] + u.pathname.slice(pre.length) + u.search, {
        method: req.method, headers: h,
        body: req.method === "GET" || req.method === "HEAD" ? undefined : req.body,
        redirect: "follow",
      });
    } catch (e) {
      return Response.json({ error: "upstream failed", message: String(e) }, { status: 502, headers: CORS });
    }
    const out = new Headers(res.headers);
    out.set("Cache-Control", "no-cache, no-transform");
    if (out.get("content-type")?.includes("text/event-stream")) out.set("Connection", "keep-alive");
    for (const k in CORS) out.set(k, CORS[k]);
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: out });
  },
};
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
};
