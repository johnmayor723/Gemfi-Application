import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useBankAuth } from "@/auth/AuthProvider";
import Logo from "@/components/Logo";
import bgImg from "@/assets/bg-img.jpg";

export default function Login() {
  const { signIn, loading } = useBankAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signIn(identifier, password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(err.body?.message || err.message || "Unable to sign in");
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
            <h1 className="text-4xl font-bold">Welcome back</h1>
            <p className="mt-5 text-slate-300 max-w-md">Sign in to manage your accounts, send money, and track your activity — all in one place.</p>
          </div>
          <p className="text-xs text-slate-500">Gemfi Microfinance Bank</p>
        </div>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Logo className="lg:hidden text-2xl mb-8" />
          <span className="w-11 h-11 rounded-xl bg-[#e7f4ef] text-[#006f51] grid place-items-center"><LogIn size={20} /></span>
          <h2 className="text-2xl font-bold mt-4">Sign in</h2>
          <p className="text-slate-500 mt-1">Enter your details to access your internet banking account.</p>

          {error && <p className="mt-5 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium">Email, username, or account number
              <input
                type="text"
                autoComplete="username"
                autoFocus
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-2 w-full border rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#006f51]"
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="block text-sm font-medium">
              <span className="flex items-center justify-between">
                Password
                <Link to="/forgot-password" className="text-xs text-[#006f51] font-medium hover:underline">Forgot password?</Link>
              </span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full border rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#006f51]"
                placeholder="••••••••"
                required
              />
            </label>
            <button disabled={loading} className="w-full bg-[#ff832e] text-white font-semibold rounded-xl py-3.5 disabled:opacity-60">
              {loading ? "Signing in…" : "Sign in securely"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            New customer?{" "}
            <Link to="/register" className="text-[#006f51] font-medium hover:underline">
              Register for Internet Banking
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
