import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";

// ─── Server Function: Join Waitlist ───
const joinWaitlist = createServerFn({ method: "POST" })
  .validator((d: unknown) => {
    if (typeof d !== "string") throw new Error("Email is required");
    const email = d.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please enter a valid email address");
    }
    return email;
  })
  .handler(async ({ data: email }) => {
    const { execSync } = await import("node:child_process");
    try {
      execSync(
        `team-db "INSERT INTO waitlist (email) VALUES ('${email.replace(/'/g, "''")}')"`,
        { encoding: "utf8", timeout: 10000 },
      );
      return { success: true, message: "You're on the list! 🎉" };
    } catch (e) {
      const msg = String(e);
      if (msg.includes("UNIQUE constraint")) {
        return { success: true, message: "You're already on the list! 🎉" };
      }
      console.error("Waitlist error:", msg);
      return { success: false, message: "Something went wrong. Try again!" };
    }
  });

// ─── Route ───
export const Route = createFileRoute("/")({
  component: Home,
});

// ─── Component ───
function Home() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const result = await joinWaitlist({ data: email.trim() });
      if (result.success) {
        setStatus("success");
        setMessage(result.message);
      } else {
        setStatus("error");
        setMessage(result.message);
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again!");
    }
  };

  return (
    <div className="min-h-dvh overflow-x-hidden">
      {/* ─── Floating decorative elements ─── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <span className="animate-float absolute left-[10%] top-[15%] text-4xl opacity-20">🔧</span>
        <span className="animate-float absolute right-[15%] top-[25%] text-3xl opacity-20" style={{ animationDelay: "1s" }}>🏡</span>
        <span className="animate-float absolute bottom-[30%] left-[8%] text-3xl opacity-20" style={{ animationDelay: "2s" }}>🧹</span>
        <span className="animate-float absolute right-[10%] top-[60%] text-4xl opacity-20" style={{ animationDelay: "0.5s" }}>💪</span>
        <span className="animate-float absolute left-[20%] top-[70%] text-2xl opacity-20" style={{ animationDelay: "1.5s" }}>🏆</span>
        <span className="animate-float absolute right-[20%] top-[40%] text-2xl opacity-20" style={{ animationDelay: "2.5s" }}>✨</span>
      </div>

      {/* ─── Nav ─── */}
      <nav className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏠</span>
          <span className="bg-gradient-to-r from-squad-orange to-squad-teal bg-clip-text text-xl font-bold text-transparent">
            HomeSquad
          </span>
        </div>
        <a
          href="#waitlist"
          className="rounded-full bg-gradient-to-r from-squad-orange to-squad-teal px-5 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg active:scale-95"
        >
          Join the Squad 🎉
        </a>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 pb-16 pt-12 text-center sm:px-6 sm:pt-20 lg:px-8">
        {/* Badge */}
        <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-squad-yellow-light to-squad-orange-light px-4 py-1.5 text-sm font-medium text-squad-orange-dark shadow-sm">
          🏆 #1 Home Maintenance App for New Homeowners
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in-up-delay-1 max-w-4xl text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl lg:text-7xl">
          <span className="gradient-text">Your Home's Personal</span>
          <br />
          <span className="text-gray-800">Maintenance Squad</span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in-up-delay-2 mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl">
          Never miss a filter change, gutter clean, or smoke alarm test again.{" "}
          <span className="font-semibold text-squad-orange">HomeSquad</span> gives you
          monthly to-dos, step-by-step guides, and rewards for keeping your home happy
          — because home maintenance shouldn't be a drag. 🏠✨
        </p>

        {/* Hero CTA */}
        <div className="animate-fade-in-up-delay-3 mt-10 flex w-full max-w-lg flex-col items-center gap-4 sm:flex-row">
          <form
            onSubmit={handleSubmit}
            className="flex w-full flex-col gap-3 sm:flex-row"
            id="waitlist"
          >
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">📧</span>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-11 pr-4 text-gray-800 placeholder:text-gray-400 shadow-sm transition-all duration-200 focus:border-squad-orange focus:outline-none focus:ring-4 focus:ring-squad-orange/20"
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="btn-primary shrink-0 animate-pulse-glow px-8 py-3 text-base disabled:opacity-70"
            >
              {status === "loading" ? "Joining..." : "Join Free 🎉"}
            </button>
          </form>
        </div>

        {/* Status message */}
        {status === "success" && (
          <div className="animate-bounce-in mt-4 rounded-xl bg-squad-green/10 px-6 py-3 text-center font-semibold text-green-700">
            {message}
          </div>
        )}
        {status === "error" && (
          <div className="mt-4 rounded-xl bg-red-100 px-6 py-3 text-center font-semibold text-red-700">
            {message}
          </div>
        )}

        {/* Social proof */}
        <div className="animate-fade-in-up-delay-4 mt-8 flex items-center gap-3 text-sm text-gray-500">
          <div className="flex -space-x-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-squad-orange/20 text-sm">👤</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-squad-teal/20 text-sm">👤</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-squad-purple/20 text-sm">👤</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-squad-yellow/20 text-sm">👤</span>
          </div>
          <span>
            <strong className="text-gray-700">2,000+</strong> homeowners already on the
            waitlist!
          </span>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-800 sm:text-4xl">
            What HomeSquad Does 🎯
          </h2>
          <p className="mt-3 text-lg text-gray-500">
            Everything you need to keep your home in tip-top shape
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Feature 1 */}
          <div className="feature-card group">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-squad-orange/20 to-squad-yellow/20 text-2xl shadow-sm transition-transform duration-300 group-hover:scale-110">
              📋
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-800">Track Maintenance</h3>
            <p className="text-sm leading-relaxed text-gray-500">
              Get a personalized monthly checklist based on your home's age, type, and
              location. No more wondering what needs doing.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="feature-card group">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-squad-teal/20 to-squad-blue/20 text-2xl shadow-sm transition-transform duration-300 group-hover:scale-110">
              🎓
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-800">Learn How-Tos</h3>
            <p className="text-sm leading-relaxed text-gray-500">
              Step-by-step guides and quick videos teach you exactly how to do each task.
              From changing a filter to winterizing your pipes.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="feature-card group">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-squad-purple/20 to-squad-coral/20 text-2xl shadow-sm transition-transform duration-300 group-hover:scale-110">
              🔔
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-800">Smart Reminders</h3>
            <p className="text-sm leading-relaxed text-gray-500">
              Never forget a task again. HomeSquad sends timely reminders so your gutters
              get cleaned before the first rain.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="feature-card group">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-squad-yellow/20 to-squad-green/20 text-2xl shadow-sm transition-transform duration-300 group-hover:scale-110">
              🏆
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-800">Earn Rewards</h3>
            <p className="text-sm leading-relaxed text-gray-500">
              Turn chores into a game! Earn points, build streaks, unlock badges, and
              celebrate your home maintenance wins. 🎉
            </p>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="relative z-10 bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-gray-800 sm:text-4xl">
              How It Works 🚀
            </h2>
            <p className="mt-3 text-lg text-gray-500">
              Three simple steps to a stress-free home
            </p>
          </div>

          <div className="relative grid gap-8 md:grid-cols-3">
            {/* Connecting line (desktop) */}
            <div className="absolute left-1/2 top-20 hidden h-0.5 w-3/4 -translate-x-1/2 bg-gradient-to-r from-squad-orange via-squad-teal to-squad-purple md:block" />

            {/* Step 1 */}
            <div className="relative flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-squad-orange to-squad-yellow text-3xl text-white shadow-lg">
                📝
              </div>
              <span className="mt-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-squad-orange text-xs font-bold text-white">
                1
              </span>
              <h3 className="mt-4 text-xl font-bold text-gray-800">Set Up Your Home</h3>
              <p className="mt-2 max-w-xs text-sm text-gray-500">
                Tell us about your home — type, age, size, and location. We'll build a
                custom maintenance plan just for you.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-squad-teal to-squad-blue text-3xl text-white shadow-lg">
                ✅
              </div>
              <span className="mt-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-squad-teal text-xs font-bold text-white">
                2
              </span>
              <h3 className="mt-4 text-xl font-bold text-gray-800">Complete Tasks</h3>
              <p className="mt-2 max-w-xs text-sm text-gray-500">
                Follow your monthly checklist with step-by-step guides and videos. Mark
                tasks done and watch your progress grow.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-squad-purple to-squad-coral text-3xl text-white shadow-lg">
                🏆
              </div>
              <span className="mt-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-squad-purple text-xs font-bold text-white">
                3
              </span>
              <h3 className="mt-4 text-xl font-bold text-gray-800">Celebrate Wins</h3>
              <p className="mt-2 max-w-xs text-sm text-gray-500">
                Earn points, build streaks, and unlock badges. Share your achievements
                and become a home maintenance hero!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="relative z-10 bg-gradient-to-b from-squad-cream to-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-800 sm:text-4xl">
              Loved by Homeowners 💛
            </h2>
            <p className="mt-3 text-lg text-gray-500">
              Join thousands of stress-free homeowners
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-3 text-lg">⭐⭐⭐⭐⭐</div>
              <p className="mb-4 text-sm leading-relaxed text-gray-600">
                "I bought my first home six months ago and was totally lost. HomeSquad
                tells me exactly what to do each month. Game changer!"
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-squad-teal/20 text-lg">
                  👩
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Sarah M.</p>
                  <p className="text-xs text-gray-400">First-time homeowner</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-3 text-lg">⭐⭐⭐⭐⭐</div>
              <p className="mb-4 text-sm leading-relaxed text-gray-600">
                "The gamification is genius. I'm actually excited to change my air
                filters now. My husband thinks I've lost it — I love it."
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-squad-orange/20 text-lg">
                  👩‍💼
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Jamie K.</p>
                  <p className="text-xs text-gray-400">Homeowner since 2024</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-3 text-lg">⭐⭐⭐⭐⭐</div>
              <p className="mb-4 text-sm leading-relaxed text-gray-600">
                "The how-to videos saved me hundreds on plumber calls. Now I can fix
                things myself and feel like a real adult. 😅"
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-squad-green/20 text-lg">
                  👨‍🔧
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Alex R.</p>
                  <p className="text-xs text-gray-400">DIY enthusiast</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative z-10 bg-gradient-to-br from-squad-orange to-squad-teal py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Join the Squad? 🏠🎉
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-white/80">
            Sign up for the waitlist and be the first to know when HomeSquad launches.
            Early birds get exclusive perks! 🐦
          </p>

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-10 flex w-full max-w-lg flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">📧</span>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border-2 border-white/30 bg-white/20 py-3 pl-11 pr-4 text-white placeholder:text-white/60 shadow-sm backdrop-blur-sm transition-all duration-200 focus:border-white focus:outline-none focus:ring-4 focus:ring-white/30"
              />
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-8 py-3 font-bold text-squad-teal shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95 disabled:opacity-70"
            >
              {status === "loading" ? "Joining..." : "Join Free 🎉"}
            </button>
          </form>

          <p className="mt-4 text-sm text-white/60">
            🎁 Free tier available. No spam, ever. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 bg-gray-900 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 sm:flex-row sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏠</span>
            <span className="bg-gradient-to-r from-squad-orange to-squad-teal bg-clip-text text-lg font-bold text-transparent">
              HomeSquad
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Made with ❤️ for first-time homeowners everywhere
          </p>
          <div className="flex gap-4 text-sm text-gray-500">
            <span className="hover:text-white">Privacy</span>
            <span className="hover:text-white">Terms</span>
            <span className="hover:text-white">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}