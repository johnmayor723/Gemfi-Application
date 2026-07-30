import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { forgotPassword } from "@/api/auth.api";
import Logo from "@/components/Logo";
import bgImg from "@/assets/bg-img.jpg";
import { useBranding } from "@/lib/branding";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const branding = useBranding();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(identifier);
    } catch {
      // Always show success regardless, so we don't leak account existence.
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-white">
      <section className="hidden lg:flex relative overflow-hidden bg-[#252323] text-white">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgImg})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/85" />
        <div className="relative z-10 flex flex-col justify-between p-14 w-full">
          <Logo light className="text-3xl" />
          <div>
            <h1 className="text-4xl font-bold">Reset your password</h1>
            <p className="mt-5 text-slate-300 max-w-md">We'll send a verification code to get you back into your account.</p>
          </div>
          <p className="text-xs text-slate-500">{branding.companyName} Microfinance Bank</p>
        </div>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Logo className="lg:hidden text-2xl mb-8" />
          <span className="w-11 h-11 rounded-xl bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] grid place-items-center"><Mail size={20} /></span>
          <h2 className="text-2xl font-bold mt-4">Forgot password?</h2>
          <p className="text-slate-500 mt-1">Enter your email, username, or account number and we'll send you a reset code.</p>

          {sent ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl">
                If an account exists with that email, username, or account number, you'll receive a reset code shortly.
              </p>
              <button
                onClick={() => navigate("/reset-password", { state: { identifier } })}
                className="w-full bg-[hsl(var(--brand-secondary))] text-white font-semibold rounded-xl py-3.5"
              >
                I have my code
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block text-sm font-medium">Email, username, or account number
                <input
                  type="text"
                  autoComplete="username"
                  autoFocus
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="mt-2 w-full border rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[hsl(var(--primary))]"
                  placeholder="you@example.com"
                  required
                />
              </label>
              <button disabled={loading} className="w-full bg-[hsl(var(--brand-secondary))] text-white font-semibold rounded-xl py-3.5 disabled:opacity-60">
                {loading ? "Sending…" : "Send reset code"}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            <Link to="/login" className="text-[hsl(var(--primary))] font-medium hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
