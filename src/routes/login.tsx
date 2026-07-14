import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { login } from "~/lib/auth";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const result = await login({ data: { email, password } });
      if (result.success) {
        document.cookie = `homesquad_session=${result.sessionId}; path=/; max-age=${7*24*60*60}; SameSite=Lax`;
        router.navigate({ to: "/dashboard" });
      } else setError(result.error || "Invalid email or password");
    } catch { setError("Something went wrong"); }
    setLoading(false);
  };

  return (
    <div className="min-h-dvh bg-squad-cream">
      <nav className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-2"><span className="text-2xl">🏠</span><span className="bg-gradient-to-r from-squad-orange to-squad-teal bg-clip-text text-xl font-bold text-transparent">HomeSquad</span></a>
        <a href="/signup" className="rounded-full bg-gradient-to-r from-squad-orange to-squad-teal px-5 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg">Sign Up 🎉</a>
      </nav>
      <div className="mx-auto flex max-w-md flex-col items-center px-4 pt-12">
        <div className="mb-8 text-center"><span className="text-5xl">👋</span><h1 className="mt-4 text-3xl font-bold text-gray-800">Welcome Back</h1><p className="mt-2 text-gray-500">Log in to your HomeSquad account</p></div>
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {error && <div className="rounded-xl bg-red-100 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
          <div><label className="mb-1.5 block text-sm font-semibold text-gray-700">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="sarah@example.com" required className="input-primary" /></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-gray-700">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required className="input-primary" /></div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base disabled:opacity-70">{loading ? "Logging in..." : "Log In 🏠"}</button>
        </form>
        <p className="mt-6 text-sm text-gray-500">Don't have an account? <a href="/signup" className="font-semibold text-squad-teal hover:underline">Sign up</a></p>
      </div>
    </div>
  );
}