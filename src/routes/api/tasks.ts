import { createAPIFileRoute } from "@tanstack/react-start/api";
import { execSync } from "node:child_process";

export const Route = createAPIFileRoute("/api/tasks")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const season = url.searchParams.get("season");
    const freeOnly = url.searchParams.get("free") === "true";

    let where = "WHERE 1=1";
    if (category) where += ` AND category = '${category.replace(/'/g, "''")}'`;
    if (season) where += ` AND season = '${season.replace(/'/g, "''")}'`;
    if (freeOnly) where += ` AND is_premium = 0`;

    try {
      const result = execSync(
        `team-db "SELECT * FROM maintenance_tasks ${where} ORDER BY frequency, id"`,
        { encoding: "utf8", timeout: 10000 },
      );
      const tasks = JSON.parse(result);
      return new Response(JSON.stringify(tasks), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "Failed to fetch tasks" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});