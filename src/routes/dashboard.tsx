import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { getSession, logout } from "~/lib/auth";

const checkAuth = createServerFn({ method: "GET" }).handler(async () => {
  const { parseCookies } = await import("vinxi/http");
  const sessionId = parseCookies()["homesquad_session"] || "";
  if (!sessionId) return { authenticated: false };
  return getSession({ data: sessionId });
});

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  beforeLoad: async () => {
    const session = await checkAuth();
    if (!session.authenticated) throw new Error("Not authenticated");
    return { session };
  },
  errorComponent: () => (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-squad-cream px-4 text-center">
      <span className="text-6xl">🔒</span>
      <h1 className="text-2xl font-bold text-gray-800">Please log in first</h1>
      <p className="text-gray-500">You need to be logged in to view this page.</p>
      <a href="/login" className="btn-primary">Log In</a>
    </div>
  ),
});

function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<{ name: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const load = async () => {
      const s = await checkAuth();
      if (s.authenticated) {
        setSession(s as any);
        const h = new Date().getHours();
        setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const { parseCookies } = await import("vinxi/http");
      const sid = parseCookies()["homesquad_session"] || "";
      await logout({ data: sid });
    } catch {}
    document.cookie = "homesquad_session=; path=/; max-age=0";
    router.navigate({ to: "/" });
  };

  return (
    <div className="min-h-dvh bg-squad-cream">
      <nav className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2"><span className="text-2xl">🏠</span><span className="bg-gradient-to-r from-squad-orange to-squad-teal bg-clip-text text-xl font-bold text-transparent">HomeSquad</span></div>
        <button onClick={handleLogout} disabled={loggingOut} className="rounded-full border-2 border-gray-300 px-5 py-2 text-sm font-semibold text-gray-600 transition-all hover:border-red-300 hover:text-red-500">{loggingOut ? "Logging out..." : "Log Out 👋"}</button>
      </nav>
      <div className="mx-auto max-w-4xl px-4 pt-12 text-center">
        <span className="text-6xl">👋</span>
        <h1 className="mt-4 text-3xl font-bold text-gray-800 sm:text-4xl">{greeting}, {session?.name || "Homeowner"}!</h1>
        <p className="mx-auto mt-3 max-w-lg text-lg text-gray-500">Welcome to your HomeSquad dashboard. Your home maintenance journey starts here!</p>
      </div>
      <div className="mx-auto mt-12 max-w-4xl px-4 pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="feature-card cursor-pointer"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-squad-teal/20 to-squad-blue/20 text-2xl shadow-sm">📋</div><h3 className="mb-2 text-lg font-bold text-gray-800">My Tasks</h3><p className="text-sm text-gray-500">View your monthly maintenance checklist</p></div>
          <a href="/setup" className="feature-card cursor-pointer block"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-squad-orange/20 to-squad-yellow/20 text-2xl shadow-sm">🏠</div><h3 className="mb-2 text-lg font-bold text-gray-800">My Home</h3><p className="text-sm text-gray-500">Set up your home details and preferences</p></a>
          <div className="feature-card cursor-pointer"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-squad-purple/20 to-squad-coral/20 text-2xl shadow-sm">🏆</div><h3 className="mb-2 text-lg font-bold text-gray-800">Achievements</h3><p className="text-sm text-gray-500">Track your badges and rewards</p></div>
        </div>
      </div>
    </div>
  );
}