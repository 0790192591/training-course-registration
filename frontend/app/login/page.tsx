
"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

type UserRole = "employee" | "admin";

export default function LoginPage() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setResetMessage("");

    if (!selectedRole) {
      setMessage("Please select Employees or Human Resource first.");
      return;
    }

    setLoading(true);

    try {
      // Authenticate user with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      const token = data.session?.access_token;

      if (!token) {
        await supabase.auth.signOut();
        setMessage("Unable to get your login session. Please try again.");
        return;
      }

      // Get the real user role from Django backend
      const response = await fetch(
        "https://training-course-registration.onrender.com/api/me/",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        await supabase.auth.signOut();

        setMessage(
          "Unable to identify your account role. Please contact the administrator."
        );
        return;
      }

      const user = await response.json();

      // Check the actual role against the selected login role
      if (user.role !== selectedRole) {
        await supabase.auth.signOut();

        setMessage(
          selectedRole === "admin"
            ? "Access denied. This account is not registered as Human Resource."
            : "Access denied. This account is not registered as an Employee."
        );
        return;
      }

      // Redirect according to the verified role
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
    } catch (error) {
      console.error("Login error:", error);

      setMessage(
        "Unable to connect. Please check your internet connection and try again."
      );
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
    } catch (error) {
      console.error("Password reset error:", error);

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
      style={{
        backgroundImage: "url('/login-background.png')",
      }}
    >
      <div className="absolute inset-0 bg-slate-950/70" />

      <div className="relative z-10 w-full max-w-md">

        {/* Header */}
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

        {/* Login Card */}
        <div className="rounded-3xl border border-white/20 bg-white p-8 shadow-2xl sm:p-10">

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-900">
              Sign In
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Select your role and enter your account details.
            </p>
          </div>

          {/* Role Selection */}
          <div className="mb-7">
            <label className="mb-3 block text-sm font-semibold text-slate-700">
              Select Your Role
            </label>

            <div className="grid grid-cols-2 gap-3">

              {/* Employees Button */}
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setSelectedRole("employee");
                  setMessage("");
                  setResetMessage("");
                }}
                className={`rounded-xl border-2 p-4 text-center transition ${
                  selectedRole === "employee"
                    ? "border-blue-600 bg-blue-50 text-blue-800 shadow-md"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                <span className="mb-2 block text-2xl">
                  👨‍💼
                </span>

                <span className="block text-sm font-bold">
                  Employees
                </span>

                <span className="mt-1 block text-xs">
                  Employee Login
                </span>
              </button>

              {/* Human Resource Button */}
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setSelectedRole("admin");
                  setMessage("");
                  setResetMessage("");
                }}
                className={`rounded-xl border-2 p-4 text-center transition ${
                  selectedRole === "admin"
                    ? "border-purple-600 bg-purple-50 text-purple-800 shadow-md"
                    : "border-slate-200 bg-white text-slate-600 hover:border-purple-400 hover:bg-purple-50"
                }`}
              >
                <span className="mb-2 block text-2xl">
                  🏢
                </span>

                <span className="block text-sm font-bold">
                  Human Resource
                </span>

                <span className="mt-1 block text-xs">
                  Administrator Login
                </span>
              </button>

            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
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
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Password */}
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
                  autoComplete="current-password"
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

              {/* Forgot Password */}
              <div className="mt-3 text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading || loading}
                  className="text-sm font-semibold text-blue-700 underline hover:text-blue-900 disabled:opacity-50"
                >
                  {resetLoading ? "Sending..." : "Lost password?"}
                </button>
              </div>
            </div>

            {/* Reset Message */}
            {resetMessage && (
              <div
                role="status"
                className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800"
              >
                {resetMessage}
              </div>
            )}

            {/* Login Error */}
            {message && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {message}
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading || resetLoading}
              className="w-full rounded-xl bg-blue-700 px-4 py-4 font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Signing in..."
                : selectedRole === "admin"
                  ? "Sign In as Human Resource"
                  : selectedRole === "employee"
                    ? "Sign In as Employee"
                    : "Select Your Role to Sign In"}
            </button>

          </form>

          {/* Register */}
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

        {/* Footer */}
        <p className="mt-7 text-center text-xs text-white/80">
          Training Course Registration System
        </p>

      </div>
    </main>
  );
}
