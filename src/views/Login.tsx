import { useState } from "react";
import { Logo } from "../components/Logo";
import { I } from "../components/Icons";
import { ROLES } from "../data/mock";

const PILLARS = [
  { i: "shield", t: "Trust", s: "The foundation of everything we do." },
  { i: "heart", t: "Care", s: "Compassion across communities." },
  { i: "scale", t: "Integrity", s: "Honesty and transparency in all actions." },
  { i: "bulb", t: "Innovation", s: "Technology for a healthier tomorrow." },
  { i: "globe", t: "Impact", s: "Shaping a healthier environment." },
] as const;

type Method = "password" | "pin" | "biometric";

export function Login({ onLogin, onBack }: { onLogin: (role: string) => void; onBack: () => void }) {
  const [method, setMethod] = useState<Method>("password");
  const [role, setRole] = useState<string>("trustee");
  const [user, setUser] = useState("dr.john.doe");
  const [pwd, setPwd] = useState("••••••••");
  const [pin, setPin] = useState("");
  const [scanning, setScanning] = useState(false);

  const submit = () => {
    if (method === "biometric") {
      setScanning(true);
      setTimeout(() => { setScanning(false); onLogin(role); }, 1400);
      return;
    }
    onLogin(role);
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT — Brand showcase */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden text-white flex-col justify-between p-12">
        <div className="absolute inset-0">
          {/* Stylized hospital scene using gradients + SVG */}
          <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700" />
          <div className="absolute inset-0 bg-dot opacity-25" />
          <svg className="absolute bottom-0 left-0 right-0 w-full opacity-30" viewBox="0 0 800 300" preserveAspectRatio="none">
            <path d="M0 300 L0 180 L80 180 L80 130 L180 130 L180 100 L320 100 L320 60 L460 60 L460 110 L600 110 L600 140 L720 140 L720 180 L800 180 L800 300 Z" fill="#D4AF37" opacity="0.15" />
            <path d="M0 300 L0 220 L120 220 L120 180 L260 180 L260 150 L400 150 L400 170 L540 170 L540 200 L680 200 L680 230 L800 230 L800 300 Z" fill="#ffffff" opacity="0.08" />
            {/* windows */}
            {Array.from({ length: 30 }).map((_, i) => (
              <rect key={i} x={(i * 27) % 780 + 10} y={200 + (i % 3) * 18} width="6" height="10" fill="#D4AF37" opacity={0.4 + (i % 3) * 0.2} />
            ))}
          </svg>
          {/* ambulance hint */}
          <svg className="absolute bottom-8 left-12 w-32 opacity-70" viewBox="0 0 100 50">
            <rect x="2" y="15" width="70" height="25" rx="3" fill="#ffffff" />
            <rect x="72" y="20" width="20" height="20" rx="3" fill="#ffffff" />
            <circle cx="20" cy="42" r="6" fill="#0B1D3A" />
            <circle cx="75" cy="42" r="6" fill="#0B1D3A" />
            <rect x="30" y="22" width="10" height="3" fill="#dc2626" />
            <rect x="34" y="18" width="2" height="11" fill="#dc2626" />
          </svg>
        </div>

        <div className="relative">
          <Logo variant="full" size={64} className="[&_div]:!text-white" showTagline />
        </div>

        <div className="relative">
          <div className="space-y-4 max-w-md">
            {PILLARS.map((p) => {
              const Ico = I[p.i as keyof typeof I];
              return (
                <div key={p.t} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                    <Ico size={18} stroke="#D4AF37" />
                  </div>
                  <div>
                    <div className="font-display text-lg">{p.t}</div>
                    <div className="text-sm text-white/65">{p.s}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative text-[11px] tracking-[0.3em] text-white/40">
          BEYU HEALTH OS · v2026.4 · DAR ES SALAAM · TANZANIA
        </div>
      </div>

      {/* RIGHT — Login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 bg-slate-50 relative">
        <button onClick={onBack} className="absolute top-6 left-6 text-sm text-slate-500 hover:text-navy-700">← Back to site</button>

        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center"><Logo variant="full" size={48} /></div>

          <div className="card p-8">
            <div className="flex flex-col items-center text-center mb-6">
              <Logo variant="mark" size={48} />
              <h1 className="font-display text-2xl text-navy-800 mt-3">Welcome</h1>
              <p className="text-sm text-slate-500 mt-1">Log in to access your account</p>
              <div className="gold-divider w-12 mt-3" />
            </div>

            {/* method tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg mb-5">
              {[
                { id: "password", t: "Password", i: "lock" },
                { id: "pin", t: "PIN", i: "device" },
                { id: "biometric", t: "Biometric", i: "fingerprint" },
              ].map((m) => {
                const Ico = I[m.i as keyof typeof I];
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id as Method)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition ${
                      method === m.id ? "bg-white text-navy-800 shadow" : "text-slate-500"
                    }`}
                  >
                    <Ico size={14} stroke={method === m.id ? "#0B1D3A" : "#64748b"} />
                    {m.t}
                  </button>
                );
              })}
            </div>

            {method === "password" && (
              <div className="space-y-4 slidein">
                <Field label="Username">
                  <I.user size={16} stroke="#94a3b8" />
                  <input value={user} onChange={(e) => setUser(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" placeholder="Enter your username" />
                </Field>
                <Field label="Password">
                  <I.lock size={16} stroke="#94a3b8" />
                  <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" placeholder="Enter your password" />
                </Field>
              </div>
            )}

            {method === "pin" && (
              <div className="space-y-4 slidein">
                <div className="text-center text-sm text-slate-600">Enter your 6-digit PIN</div>
                <div className="flex justify-center gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={`w-10 h-12 rounded-lg border-2 flex items-center justify-center text-lg font-bold ${pin.length > i ? "border-navy-800 bg-navy-50" : "border-slate-200"}`}>
                      {pin.length > i ? "●" : ""}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                  {["1","2","3","4","5","6","7","8","9","C","0","⌫"].map((k) => (
                    <button
                      key={k}
                      onClick={() => {
                        if (k === "C") setPin("");
                        else if (k === "⌫") setPin(pin.slice(0, -1));
                        else if (pin.length < 6) setPin(pin + k);
                      }}
                      className="py-3 rounded-lg bg-slate-100 hover:bg-navy-50 font-semibold text-navy-800"
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {method === "biometric" && (
              <div className="space-y-4 slidein text-center py-2">
                <button
                  onClick={submit}
                  className={`mx-auto w-28 h-28 rounded-full flex items-center justify-center transition ${scanning ? "bg-emerald-50 ring-4 ring-emerald-300 animate-pulse" : "bg-navy-50 ring-4 ring-navy-100 hover:ring-gold-300"}`}
                >
                  <I.fingerprint size={56} stroke={scanning ? "#059669" : "#0B1D3A"} />
                </button>
                <div className="text-sm text-slate-600">{scanning ? "Verifying identity…" : "Tap to scan fingerprint"}</div>
                <div className="text-[11px] text-slate-400">Face ID, Touch ID & WebAuthn supported</div>
              </div>
            )}

            {/* role + tenant context */}
            <div className="mt-5 pt-5 border-t border-slate-100 space-y-3">
              <div>
                <label className="text-[11px] tracking-widest text-slate-500">SIGN IN AS</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-navy-800 outline-none focus:border-navy-500"
                >
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="rounded" /> Remember this device</label>
                <a className="text-navy-700 hover:underline cursor-pointer">Forgot Password?</a>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={onBack} className="btn-outline flex-1">Cancel</button>
              <button onClick={submit} className="btn-primary flex-1 flex items-center justify-center gap-2">
                Enter <I.arrow size={16} />
              </button>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] text-slate-400">
              <I.shield size={12} stroke="#94a3b8" />
              Protected by zero-trust authentication · Biometric MFA · Session recorded
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400 mt-6">
            © 2026 BEYU Family Trust · All rights reserved
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] tracking-widest text-slate-500">{label.toUpperCase()}</label>
      <div className="mt-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 focus-within:border-navy-500 bg-white">
        {children}
      </div>
    </div>
  );
}
