
"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";

type RequestedRole = "employee" | "human_resource";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requestedRole, setRequestedRole] =
    useState<RequestedRole>("employee");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            requested_role: requestedRole,
          },
        },
      });

      if (error) {
        setMessage("Registration failed: " + error.message);
        return;
      }

      if (data.user) {
        setMessage(
          data.session
            ? "Account created successfully! You can now sign in."
            : "Account created successfully. Please check your email if confirmation is required, then sign in."
        );

        setFullName("");
        setEmail("");
        setPassword("");

        if (data.session) {
          await supabase.auth.signOut();
        }

        return;
      }

      setMessage("Account creation could not be completed. Please try again.");
    } catch (error) {
      console.error("Registration error:", error);
      setMessage(
        "Connection error. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-10">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-bold text-blue-900">
          Create Account
        </h1>

        <p className="mb-6 text-center text-slate-500">
          Register for Training Courses
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="mb-2 block font-medium">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full rounded-lg border border-slate-300 p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Select Account Type
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => setRequestedRole("employee")}
                className={`rounded-lg border-2 p-4 text-center ${
                  requestedRole === "employee"
                    ? "border-blue-700 bg-blue-50 text-blue-900"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                <span className="mb-2 block text-2xl">👨‍💼</span>
                <span className="block font-bold">Employee</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => setRequestedRole("human_resource")}
                className={`rounded-lg border-2 p-4 text-center ${
                  requestedRole === "human_resource"
                    ? "border-purple-700 bg-purple-50 text-purple-900"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                <span className="mb-2 block text-2xl">🏢</span>
                <span className="block font-bold">Human Resource</span>
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-300 p-3"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-900 p-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-blue-900">
            Login
          </a>
        </p>
      </div>
    </main>
  );
}
