
"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setResetMessage("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      const token = data.session?.access_token;

      if (!token) {
        setMessage("Unable to get your login session. Please try again.");
        return;
      }

      const response = await fetch("http://127.0.0.1:8000/api/me/", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        await supabase.auth.signOut();
        setMessage(
          "Unable to identify your account role. Please contact the administrator."
        );
        return;
      }

      const user = await response.json();

      if (user.role === "admin") {
        router.replace("/admin");
      } else if (user.role === "employee") {
        router.replace("/employee");
      } else {
        await supabase.auth.signOut();
        setMessage("Your account role is not recognized.");
        return;
      }

      router.refresh();
    } catch {
      setMessage("Unable to connect. Please check the servers and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setResetMessage("");
    setMessage("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setResetMessage("Please enter your email address first.");
      return;
    }

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        setResetMessage(error.message);
        return;
      }

      setResetMessage(
        "If an account exists with this email, a password reset link has been sent. Please check your inbox."
      );
    } catch {
      setResetMessage(
        "Unable to send the reset email. Please try again."
      );
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat px-4 py-10"
      style={{ backgroundImage: "url('/login-background.png')" }}
    >
      <div className="absolute inset-0 bg-slate-950/70" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-3xl font-bold text-white shadow-lg shadow-blue-600/30">
            T
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Training Course
          </h1>

          <p className="mt-2 text-lg font-medium text-blue-300">
            Registration System
          </p>

          <p className="mt-3 text-sm text-slate-200">
            Welcome back! Sign in to continue.
          </p>
        </div>

        <div className="rounded-3xl border border-white/20 bg-white p-8 shadow-2xl sm:p-10">
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-900">
              Sign In
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Enter your account details below.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Address
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setResetMessage("");
                }}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-20 text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-blue-700 hover:text-blue-900"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className="mt-3 text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="text-sm font-semibold text-blue-700 underline hover:text-blue-900 disabled:opacity-50"
                >
                  {resetLoading ? "Sending..." : "Lost password?"}
                </button>
              </div>
            </div>

            {resetMessage && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                {resetMessage}
              </div>
            )}

            {message && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-700 px-4 py-4 font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-7 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{" "}
              <a
                href="/register"
                className="font-bold text-blue-700 hover:text-blue-900"
              >
                Create Account
              </a>
            </p>
          </div>
        </div>

        <p className="mt-7 text-center text-xs text-white/80">
          Training Course Registration System
        </p>
      </div>
    </main>
  );
}
