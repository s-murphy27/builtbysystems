import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { saveHome } from "~/lib/home";

const checkAuth = createServerFn({ method: "GET" }).handler(async () => {
  const { parseCookies } = await import("vinxi/http");
  return parseCookies()["homesquad_session"] ? true : false;
});

export const Route = createFileRoute("/setup")({
  component: SetupWizard,
  beforeLoad: async () => {
    const auth = await checkAuth();
    if (!auth) throw new Error("Not authenticated");
  },
  errorComponent: () => (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-squad-cream px-4 text-center">
      <span className="text-6xl">🔒</span>
      <h1 className="text-2xl font-bold text-gray-800">Please log in first</h1>
      <p className="text-gray-500">Log in to set up your home.</p>
      <a href="/login" className="btn-primary">Log In</a>
    </div>
  ),
});

const STEPS = [
  { title: "Home Type", icon: "🏠" },
  { title: "Home Age", icon: "📅" },
  { title: "Size", icon: "📏" },
  { title: "Rooms", icon: "🛏️" },
  { title: "Location", icon: "📍" },
  { title: "Features", icon: "✨" },
  { title: "Done!", icon: "🎉" },
];

const HOME_TYPES = [
  { value: "house", label: "House", icon: "🏠", desc: "Single-family home" },
  { value: "condo", label: "Condo", icon: "🏢", desc: "Condominium unit" },
  { value: "townhouse", label: "Townhouse", icon: "🏘️", desc: "Attached home" },
  { value: "apartment", label: "Apartment", icon: "🏙️", desc: "Rental unit" },
];

const AGE_OPTIONS = [
  { value: "new", label: "Brand New", desc: "Less than 1 year", emoji: "✨" },
  { value: "recent", label: "Nearly New", desc: "1-5 years", emoji: "🌟" },
  { value: "mid", label: "Moderate", desc: "5-15 years", emoji: "👍" },
  { value: "older", label: "Established", desc: "15-30 years", emoji: "🏛️" },
  { value: "vintage", label: "Vintage", desc: "30+ years", emoji: "🏰" },
];

const SIZE_OPTIONS = [
  { value: "small", label: "Cozy", desc: "Under 1,000 sq ft", emoji: "🪹" },
  { value: "medium", label: "Comfortable", desc: "1,000-1,500 sq ft", emoji: "🏡" },
  { value: "large", label: "Spacious", desc: "1,500-2,500 sq ft", emoji: "🏠" },
  { value: "xl", label: "Grand", desc: "2,500+ sq ft", emoji: "🏰" },
];

const FEATURE_OPTIONS = [
  { value: "ac", label: "Air Conditioning", emoji: "❄️" },
  { value: "basement", label: "Basement", emoji: "⬇️" },
  { value: "pool", label: "Swimming Pool", emoji: "🏊" },
  { value: "fireplace", label: "Fireplace", emoji: "🔥" },
  { value: "garage", label: "Garage", emoji: "🚗" },
  { value: "deck", label: "Deck or Patio", emoji: "🌳" },
  { value: "sprinklers", label: "Sprinkler System", emoji: "💧" },
];

function SetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [homeType, setHomeType] = useState("");
  const [age, setAge] = useState("");
  const [sqFootage, setSqFootage] = useState("");
  const [location, setLocation] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [celebrate, setCelebrate] = useState(false);

  const toggleFeature = (f: string) => {
    setFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const canNext = () => {
    switch (step) {
      case 0: return !!homeType;
      case 1: return !!age;
      case 2: return !!sqFootage;
      case 3: return !!bedrooms && !!bathrooms;
      case 4: return true; // location is optional
      case 5: return true; // features are optional
      default: return true;
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await saveHome({ data: { homeType, age, sqFootage, location, bedrooms, bathrooms, features } });
      setCelebrate(true);
      setStep(6);
    } catch { console.error("Failed to save"); }
    setSaving(false);
  };

  const progress = ((step) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-squad-cream to-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏠</span>
          <span className="bg-gradient-to-r from-squad-orange to-squad-teal bg-clip-text text-xl font-bold text-transparent">HomeSquad</span>
        </div>
        {step < 6 && (
          <button onClick={() => router.navigate({ to: "/dashboard" })} className="text-sm text-gray-400 hover:text-gray-600">Skip for now →</button>
        )}
      </nav>

      {/* Progress Bar */}
      {step < 6 && (
        <div className="mx-auto max-w-2xl px-4 pt-4">
          <div className="flex items-center justify-between">
            {STEPS.slice(0, 6).map((s, i) => (
              <div key={i} className={`flex flex-col items-center ${i <= step ? "text-squad-teal" : "text-gray-300"}`}>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all ${i <= step ? "bg-squad-teal text-white shadow-md" : "bg-gray-100 text-gray-300"}`}>{i + 1}</div>
                <span className="mt-1 hidden text-[10px] font-medium sm:block">{s.title}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-gradient-to-r from-squad-teal to-squad-orange transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 pt-10 pb-20">
        {step === 0 && (
          <div className="w-full animate-fade-in-up">
            <div className="mb-2 text-center"><span className="text-5xl">🏠</span></div>
            <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">What kind of home do you have?</h1>
            <p className="mb-8 text-center text-gray-500">Pick the one that fits best</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {HOME_TYPES.map(t => (
                <button key={t.value} onClick={() => setHomeType(t.value)} className={`rounded-2xl border-2 p-5 text-left transition-all ${homeType === t.value ? "border-squad-teal bg-squad-teal-light/20 shadow-lg" : "border-gray-200 bg-white hover:border-gray-300 hover:shadow"}`}>
                  <span className="text-3xl">{t.icon}</span>
                  <h3 className="mt-2 text-lg font-bold text-gray-800">{t.label}</h3>
                  <p className="text-sm text-gray-500">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="w-full animate-fade-in-up">
            <div className="mb-2 text-center"><span className="text-5xl">📅</span></div>
            <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">How old is your home?</h1>
            <p className="mb-8 text-center text-gray-500">This helps us suggest age-appropriate maintenance</p>
            <div className="grid gap-3">
              {AGE_OPTIONS.map(a => (
                <button key={a.value} onClick={() => setAge(a.value)} className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all ${age === a.value ? "border-squad-teal bg-squad-teal-light/20 shadow-lg" : "border-gray-200 bg-white hover:border-gray-300 hover:shadow"}`}>
                  <span className="text-3xl">{a.emoji}</span>
                  <div><h3 className="text-lg font-bold text-gray-800">{a.label}</h3><p className="text-sm text-gray-500">{a.desc}</p></div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="w-full animate-fade-in-up">
            <div className="mb-2 text-center"><span className="text-5xl">📏</span></div>
            <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">How big is your home?</h1>
            <p className="mb-8 text-center text-gray-500">Rough size is fine — we just need a ballpark</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {SIZE_OPTIONS.map(s => (
                <button key={s.value} onClick={() => setSqFootage(s.value)} className={`rounded-2xl border-2 p-5 text-center transition-all ${sqFootage === s.value ? "border-squad-teal bg-squad-teal-light/20 shadow-lg" : "border-gray-200 bg-white hover:border-gray-300 hover:shadow"}`}>
                  <span className="text-4xl">{s.emoji}</span>
                  <h3 className="mt-2 text-lg font-bold text-gray-800">{s.label}</h3>
                  <p className="text-sm text-gray-500">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="w-full animate-fade-in-up">
            <div className="mb-2 text-center"><span className="text-5xl">🛏️</span></div>
            <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">How many rooms?</h1>
            <p className="mb-8 text-center text-gray-500">Tell us about bedrooms and bathrooms</p>
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 text-center">
                <span className="text-4xl">🛏️</span>
                <h3 className="mt-2 text-lg font-bold text-gray-800">Bedrooms</h3>
                <div className="mt-4 flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setBedrooms(String(n))} className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold transition-all ${bedrooms === String(n) ? "bg-squad-teal text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{n}</button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 text-center">
                <span className="text-4xl">🚿</span>
                <h3 className="mt-2 text-lg font-bold text-gray-800">Bathrooms</h3>
                <div className="mt-4 flex justify-center gap-2">
                  {[1, 1.5, 2, 2.5, 3, 4].map(n => (
                    <button key={n} onClick={() => setBathrooms(String(n))} className={`flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold transition-all ${bathrooms === String(n) ? "bg-squad-teal text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{n}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="w-full animate-fade-in-up">
            <div className="mb-2 text-center"><span className="text-5xl">📍</span></div>
            <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">Where are you located?</h1>
            <p className="mb-8 text-center text-gray-500">This helps us tailor tasks to your climate (optional)</p>
            <div className="mx-auto max-w-md">
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Seattle, WA or just your climate zone" className="input-primary text-center" />
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {["🌧️ Rainy", "❄️ Cold", "☀️ Sunny", "🌴 Tropical", "🍂 Four Seasons", "🏔️ Mountain"].map(c => (
                  <button key={c} onClick={() => setLocation(c.split(" ").slice(1).join(" "))} className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${location.includes(c.split(" ").slice(1).join(" ")) ? "border-squad-orange bg-squad-orange/10 text-squad-orange-dark" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>{c}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="w-full animate-fade-in-up">
            <div className="mb-2 text-center"><span className="text-5xl">✨</span></div>
            <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">What special features?</h1>
            <p className="mb-8 text-center text-gray-500">Check all that apply (optional)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {FEATURE_OPTIONS.map(f => (
                <button key={f.value} onClick={() => toggleFeature(f.value)} className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all ${features.includes(f.value) ? "border-squad-teal bg-squad-teal-light/20 shadow-lg" : "border-gray-200 bg-white hover:border-gray-300 hover:shadow"}`}>
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg ${features.includes(f.value) ? "bg-squad-teal text-white" : "bg-gray-100"}`}>{features.includes(f.value) ? "✓" : f.emoji}</span>
                  <span className="text-lg font-semibold text-gray-800">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 6 && celebrate && (
          <div className="flex flex-col items-center text-center animate-bounce-in">
            <span className="text-8xl">🎉</span>
            <h1 className="mt-6 text-4xl font-bold text-gray-800">Your Home is Set Up!</h1>
            <p className="mt-4 max-w-md text-lg text-gray-500">We've got your home's profile and we're building your personalized maintenance plan. Let's get started!</p>
            <div className="mt-4 flex gap-4">
              <span className="text-3xl">{HOME_TYPES.find(t => t.value === homeType)?.icon}</span>
              <span className="text-3xl">{AGE_OPTIONS.find(a => a.value === age)?.emoji}</span>
              <span className="text-3xl">{SIZE_OPTIONS.find(s => s.value === sqFootage)?.emoji}</span>
            </div>
            <button onClick={() => router.navigate({ to: "/dashboard" })} className="btn-primary mt-8 px-10 py-4 text-lg">
              Go to Dashboard 🚀
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 6 && (
          <div className="mt-10 flex w-full max-w-md gap-4">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1">Back</button>
            )}
            <button
              onClick={() => step === 5 ? handleFinish() : setStep(s => s + 1)}
              disabled={!canNext() || saving}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {step === 5 ? (saving ? "Saving..." : "Finish Setup 🎉") : "Next →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}