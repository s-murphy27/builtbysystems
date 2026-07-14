import { createServerFn } from "@tanstack/react-start";
import { execSync } from "node:child_process";

function db(sql: string): any[] {
  try {
    const result = execSync(`team-db ${JSON.stringify(sql)}`, { encoding: "utf8", timeout: 10000 });
    return JSON.parse(result);
  } catch { return []; }
}

export const saveHome = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as {
      homeType: string; age: string; sqFootage: string; location: string;
      bedrooms: string; bathrooms: string; features: string[];
    };
    if (!data.homeType) throw new Error("Home type required");
    return data;
  })
  .handler(async ({ data }) => {
    const { parseCookies } = await import("vinxi/http");
    const sessionId = parseCookies()["homesquad_session"] || "";
    if (!sessionId) return { success: false, error: "Not authenticated" };

    const sessions = db(`SELECT user_id FROM sessions WHERE id = '${sessionId.replace(/'/g, "''")}' AND expires_at > datetime('now')`);
    if (sessions.length === 0) return { success: false, error: "Session expired" };

    const userId = sessions[0].user_id;

    // Clean input
    const homeType = data.homeType.replace(/'/g, "''");
    const age = data.age;
    const sqFootage = data.sqFootage ? parseInt(data.sqFootage) : null;
    const location = (data.location || "").replace(/'/g, "''");
    const bedrooms = data.bedrooms ? parseInt(data.bedrooms) : null;
    const bathrooms = data.bathrooms ? parseFloat(data.bathrooms) : null;
    const features = JSON.stringify(data.features || []);

    // Check if home exists for this user
    const existing = db(`SELECT id FROM homes WHERE user_id = ${userId}`);

    if (existing.length > 0) {
      db(`UPDATE homes SET home_type = '${homeType}', age = '${age}', sq_footage = ${sqFootage || "NULL"}, location = '${location}', bedrooms = ${bedrooms || "NULL"}, bathrooms = ${bathrooms || "NULL"}, features = '${features.replace(/'/g, "''")}' WHERE user_id = ${userId}`);
    } else {
      db(`INSERT INTO homes (user_id, home_type, age, sq_footage, location, bedrooms, bathrooms, features) VALUES (${userId}, '${homeType}', '${age}', ${sqFootage || "NULL"}, '${location}', ${bedrooms || "NULL"}, ${bathrooms || "NULL"}, '${features.replace(/'/g, "''")}')`);
    }

    return { success: true };
  });

export const getHome = createServerFn({ method: "GET" }).handler(async () => {
  const { parseCookies } = await import("vinxi/http");
  const sessionId = parseCookies()["homesquad_session"] || "";
  if (!sessionId) return null;

  const sessions = db(`SELECT user_id FROM sessions WHERE id = '${sessionId.replace(/'/g, "''")}' AND expires_at > datetime('now')`);
  if (sessions.length === 0) return null;

  const homes = db(`SELECT * FROM homes WHERE user_id = ${sessions[0].user_id}`);
  return homes.length > 0 ? homes[0] : null;
});