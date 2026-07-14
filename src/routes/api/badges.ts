import { createAPIFileRoute } from "@tanstack/react-start/api";
import { execSync } from "node:child_process";
export const Route = createAPIFileRoute("/api/badges")({
  GET: async () => {
    try {
      const result = execSync(`team-db "SELECT * FROM badges ORDER BY id"`, { encoding: "utf8", timeout: 10000 });
      return new Response(JSON.stringify(JSON.parse(result)), { headers: { "Content-Type": "application/json" } });
    } catch (e) {
      return new Response(JSON.stringify({ error: "Failed to fetch badges" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  },
});