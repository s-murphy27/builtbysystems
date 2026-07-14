import { createServerFn } from "@tanstack/react-start";
import { execSync } from "node:child_process";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

function db(sql: string): any[] {
  try {
    const result = execSync(`team-db ${JSON.stringify(sql)}`, { encoding: "utf8", timeout: 10000 });
    return JSON.parse(result);
  } catch { return []; }
}

function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const derived = scryptSync(pw, salt, 64).toString("hex");
  try { return timingSafeEqual(Buffer.from(hash), Buffer.from(derived)); } catch { return false; }
}

function genSessionId(): string { return randomBytes(32).toString("hex"); }

export const signup = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as { email: string; name: string; password: string };
    if (!data.email || !data.email.includes("@")) throw new Error("Valid email required");
    if (!data.name || data.name.length < 1) throw new Error("Name required");
    if (!data.password || data.password.length < 6) throw new Error("Password must be at least 6 characters");
    return { email: data.email.trim().toLowerCase(), name: data.name.trim(), password: data.password };
  })
  .handler(async ({ data: { email, name, password } }) => {
    const existing = db(`SELECT id FROM users WHERE email = '${email.replace(/'/g, "''")}'`);
    if (existing.length > 0) return { success: false, error: "An account with this email already exists" };
    const hash = hashPassword(password);
    db(`INSERT INTO users (email, name, password_hash) VALUES ('${email.replace(/'/g, "''")}', '${name.replace(/'/g, "''")}', '${hash.replace(/'/g, "''")}')`);
    const users = db(`SELECT id FROM users WHERE email = '${email.replace(/'/g, "''")}'`);
    if (users.length === 0) return { success: false, error: "Failed to create account" };
    const sessionId = genSessionId();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    db(`INSERT INTO sessions (id, user_id, expires_at) VALUES ('${sessionId}', ${users[0].id}, '${expiresAt}')`);
    return { success: true, sessionId, userId: users[0].id, name };
  });

export const login = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    const data = d as { email: string; password: string };
    if (!data.email) throw new Error("Email required");
    if (!data.password) throw new Error("Password required");
    return { email: data.email.trim().toLowerCase(), password: data.password };
  })
  .handler(async ({ data: { email, password } }) => {
    const users = db(`SELECT id, name, password_hash FROM users WHERE email = '${email.replace(/'/g, "''")}'`);
    if (users.length === 0 || !verifyPassword(password, users[0].password_hash))
      return { success: false, error: "Invalid email or password" };
    const sessionId = genSessionId();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    db(`INSERT INTO sessions (id, user_id, expires_at) VALUES ('${sessionId}', ${users[0].id}, '${expiresAt}')`);
    return { success: true, sessionId, userId: users[0].id, name: users[0].name };
  });

export const getSession = createServerFn({ method: "GET" })
  .validator((d: unknown) => (typeof d === "string" ? d : ""))
  .handler(async ({ data: sessionId }) => {
    if (!sessionId) return { authenticated: false };
    const sessions = db(`SELECT s.id, s.user_id, u.name, u.email FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = '${sessionId.replace(/'/g, "''")}' AND s.expires_at > datetime('now')`);
    if (sessions.length === 0) return { authenticated: false };
    return { authenticated: true, userId: sessions[0].user_id, name: sessions[0].name, email: sessions[0].email };
  });

export const logout = createServerFn({ method: "POST" })
  .validator((d: unknown) => (typeof d === "string" ? d : ""))
  .handler(async ({ data: sessionId }) => {
    if (sessionId) db(`DELETE FROM sessions WHERE id = '${sessionId.replace(/'/g, "''")}'`);
    return { success: true };
  });
