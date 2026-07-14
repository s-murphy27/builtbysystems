import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { signup } from "~/lib/auth";

export const Route = createFileRoute("/signup")({ component: SignupPage });

function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setLoading(true);
    try {
      const result = await signup({ data: { email, name, password } });
      if (result.success) {
        document.cookie = `homesquad_session=${result.sessionId}; path=/; max-age=${7*24*60*60}; SameSite=Lax`;
        router.navigate({ to: "/dashboard" });
      } else setError(result.error || "Something went wrong");
    } catch { setError("Something went wrong"); }
    setLoading(false);
  };

  return (
    <div className="min-h-dvh bg-squad-cream">
      <nav className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-2"><span className="text-2xl">🏠</span><span className="bg-gradient-to-r from-squad-orange to-squad-teal bg-clip-text text-xl font-bold text-transparent">HomeSquad</span></a>
        <a href="/login" className="rounded-full border-2 border-squad-teal px-5 py-2 text-sm font-semibold text-squad-teal hover:bg-squad-teal-light/30">Log In</a>
      </nav>
      <div className="mx-auto flex max-w-md flex-col items-center px-4 pt-12">
        <div className="mb-8 text-center"><span className="text-5xl">🎉</span><h1 className="mt-4 text-3xl font-bold text-gray-800">Join HomeSquad</h1><p className="mt-2 text-gray-500">Start your home maintenance journey today</p></div>
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {error && <div className="rounded-xl bg-red-100 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
          <div><label className="mb-1.5 block text-sm font-semibold text-gray-700">Your Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Sarah M." required className="input-primary" /></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-gray-700">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="sarah@example.com" required className="input-primary" /></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-gray-700">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} className="input-primary" /></div>
          <div><label className="mb-1.5 block text-sm font-semibold text-gray-700">Confirm Password</label><input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat your password" required minLength={6} className="input-primary" /></div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base disabled:opacity-70">{loading ? "Creating account..." : "Create Account 🎉"}</button>
        </form>
        <p className="mt-6 text-sm text-gray-500">Already have an account? <a href="/login" className="font-semibold text-squad-teal hover:underline">Log in</a></p>
      </div>
    </div>
  );
}
